"""Isolated security and contract tests for Timeline milestone endpoints."""

from __future__ import annotations

import unittest
from datetime import UTC, datetime, timedelta
from io import BytesIO
from pathlib import Path
import tempfile
from uuid import uuid4

from flask import g
from PIL import Image
from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models import Admin, AdminSession, TimelineImage, TimelineMilestone


class TimelineMilestoneApiTests(unittest.TestCase):
    def setUp(self):
        self.upload_dir = tempfile.TemporaryDirectory()
        self.app = create_app(
            {
                "TESTING": True,
                "SECRET_KEY": "isolated-milestone-api-test-secret",
                "SQLALCHEMY_DATABASE_URI": "sqlite://",
                "RATELIMIT_STORAGE_URI": "memory://",
                "WTF_CSRF_ENABLED": True,
                "SESSION_COOKIE_SECURE": False,
                "TIMELINE_UPLOAD_DIR": str(Path(self.upload_dir.name) / "private-images"),
            }
        )
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        self.client = self.app.test_client()
        self.password = "timeline-api-test-password"
        self.admin = Admin(
            username="timeline-api-admin",
            password_hash=generate_password_hash(self.password, method="scrypt"),
        )
        db.session.add(self.admin)
        db.session.commit()
        self.prelogin_csrf = self._csrf(self.client)
        login = self.client.post(
            "/api/auth/login",
            json={"username": self.admin.username, "password": self.password},
            headers={"X-CSRFToken": self.prelogin_csrf},
        )
        self.assertEqual(login.status_code, 200, login.get_data(as_text=True))
        self.write_csrf = login.json["csrf_token"]
        self.write_headers = {"X-CSRFToken": self.write_csrf}

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()
        self.upload_dir.cleanup()

    def _csrf(self, client):
        g.pop("csrf_token", None)
        response = client.get("/api/auth/csrf")
        self.assertEqual(response.status_code, 200)
        return response.json["csrf_token"]

    def _payload(self, **overrides):
        payload = {
            "title": "GRID project showcase",
            "category": "Projects",
            "date": "2025-03-22",
            "time": "10:30",
            "location": "KSSEM Campus",
            "summary": "Students shared prototypes and project ideas.",
            "description": "A verified milestone description with useful context.",
            "images": [],
        }
        payload.update(overrides)
        return payload

    def _create(self, **overrides):
        response = self.client.post(
            "/api/admin/timeline/milestones",
            json=self._payload(**overrides),
            headers=self.write_headers,
        )
        self.assertEqual(response.status_code, 201, response.get_data(as_text=True))
        return response.json["milestone"]

    def _png(self, size=(2, 2)):
        stream = BytesIO()
        Image.new("RGB", size, color=(220, 20, 60)).save(stream, format="PNG")
        stream.seek(0)
        return stream

    def _upload_png(self, client=None, name="photo.png", headers=None):
        return (client or self.client).post(
            "/api/admin/timeline/images",
            data={"file": (self._png(), name)},
            headers=headers or self.write_headers,
            content_type="multipart/form-data",
        )

    def _seed(self, *, published=False, sort_order=0, **overrides):
        payload = self._payload(**overrides)
        item = TimelineMilestone(
            id=str(uuid4()),
            title=payload["title"],
            category=payload["category"],
            date=payload["date"],
            time=payload["time"],
            location=payload["location"],
            summary=payload["summary"],
            description=payload["description"],
            images=payload["images"],
            is_published=published,
            sort_order=sort_order,
            created_at=datetime.now(UTC),
            updated_at=datetime.now(UTC),
        )
        db.session.add(item)
        db.session.commit()
        return item

    def test_public_get_returns_only_published_milestones_in_order(self):
        later = self._seed(published=True, sort_order=1, title="Later published")
        self._seed(published=False, sort_order=0, title="Draft only")
        earlier = self._seed(published=True, sort_order=0, title="First published")

        response = self.client.get("/api/timeline/milestones")
        self.assertEqual(response.status_code, 200)
        items = response.json["milestones"]
        self.assertEqual([item["id"] for item in items], [earlier.id, later.id])
        self.assertTrue(all(item["isPublished"] for item in items))
        self.assertNotIn("password_hash", items[0])
        self.assertNotIn("session_version", items[0])
        self.assertNotIn("admin_id", items[0])

    def test_public_get_returns_stable_import_source_only_when_present(self):
        imported = self._seed(published=True, sort_order=0)
        imported.source_id = "grid-timeline-pilot:indexeddb:v1:local-4"
        db.session.commit()
        ordinary = self._seed(published=True, sort_order=1, title="Ordinary server event")
        result = self.client.get("/api/timeline/milestones").json["milestones"]
        self.assertEqual(result[0]["sourceId"], imported.source_id)
        self.assertNotIn("sourceId", result[1])
        self.assertEqual(result[1]["id"], ordinary.id)

    def test_public_users_cannot_create_edit_delete_or_reorder(self):
        existing = self._seed(published=True)
        outsider = self.app.test_client()
        paths_and_methods = [
            ("/api/admin/timeline/milestones", "post", self._payload()),
            (f"/api/admin/timeline/milestones/{existing.id}", "patch", {"title": "Tampered"}),
            (f"/api/admin/timeline/milestones/{existing.id}", "delete", None),
            ("/api/admin/timeline/milestones/reorder", "post", {"ids": [existing.id]}),
        ]
        for path, method, payload in paths_and_methods:
            response = getattr(outsider, method)(path, json=payload)
            self.assertEqual(response.status_code, 401, (path, response.get_data(as_text=True)))

        db.session.expire_all()
        self.assertEqual(db.session.get(TimelineMilestone, existing.id).title, "GRID project showcase")

    def test_unauthenticated_admin_get_and_writes_are_rejected(self):
        outsider = self.app.test_client()
        responses = [
            outsider.get("/api/admin/timeline/milestones"),
            outsider.post("/api/admin/timeline/milestones", json=self._payload()),
        ]
        self.assertEqual([response.status_code for response in responses], [401, 401])

    def test_authenticated_admin_can_create_list_update_and_delete(self):
        created = self._create(
            images=[{"url": "/assets/grid/showcase.webp", "name": "showcase.webp", "type": "image/webp"}]
        )
        self.assertEqual(created["category"], "Projects")
        self.assertFalse(created["isPublished"])
        self.assertEqual(created["images"][0]["url"], "/assets/grid/showcase.webp")
        self.assertIn("createdAt", created)
        self.assertIn("updatedAt", created)
        self.assertIn("sortOrder", created)

        listed = self.client.get("/api/admin/timeline/milestones")
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(len(listed.json["milestones"]), 1)

        updated = self.client.patch(
            f"/api/admin/timeline/milestones/{created['id']}",
            json={"title": "Updated GRID project showcase", "isPublished": True},
            headers=self.write_headers,
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json["milestone"]["title"], "Updated GRID project showcase")
        self.assertTrue(updated.json["milestone"]["isPublished"])
        self.assertEqual(len(self.client.get("/api/timeline/milestones").json["milestones"]), 1)

        deleted = self.client.delete(
            f"/api/admin/timeline/milestones/{created['id']}", headers=self.write_headers
        )
        self.assertEqual(deleted.status_code, 200)
        self.assertTrue(deleted.json["deleted"])
        self.assertEqual(self.client.get("/api/admin/timeline/milestones").json["milestones"], [])

    def test_state_changing_routes_reject_missing_and_invalid_csrf(self):
        existing = self._seed()
        requests = [
            ("post", "/api/admin/timeline/milestones", self._payload()),
            ("patch", f"/api/admin/timeline/milestones/{existing.id}", {"title": "Changed"}),
            ("delete", f"/api/admin/timeline/milestones/{existing.id}", None),
            ("post", "/api/admin/timeline/milestones/reorder", {"ids": [existing.id]}),
        ]
        for method, path, payload in requests:
            missing = getattr(self.client, method)(path, json=payload)
            invalid = getattr(self.client, method)(
                path, json=payload, headers={"X-CSRFToken": "wrong"}
            )
            self.assertEqual(missing.status_code, 400, (method, path, "missing token"))
            self.assertEqual(invalid.status_code, 400, (method, path, "invalid token"))
            self.assertEqual(missing.json["error"], "csrf_failed")
            self.assertEqual(invalid.json["error"], "csrf_failed")
        self.assertEqual(db.session.scalar(db.select(db.func.count()).select_from(TimelineMilestone)), 1)

    def test_expired_inactive_and_revoked_admin_sessions_are_rejected(self):
        existing = self._seed()
        admin_session = db.session.scalar(db.select(AdminSession))
        admin_session.expires_at = datetime.now(UTC) - timedelta(seconds=1)
        db.session.commit()
        expired = self.client.get("/api/admin/timeline/milestones")
        self.assertEqual(expired.status_code, 401)

        # Log in again, then verify inactive status is enforced on the content API.
        self.prelogin_csrf = self._csrf(self.client)
        login = self.client.post(
            "/api/auth/login",
            json={"username": self.admin.username, "password": self.password},
            headers={"X-CSRFToken": self.prelogin_csrf},
        )
        self.assertEqual(login.status_code, 200)
        self.admin.is_active = False
        db.session.commit()
        inactive = self.client.get("/api/admin/timeline/milestones")
        self.assertEqual(inactive.status_code, 401)

        self.admin.is_active = True
        self.admin.session_version += 1
        db.session.commit()
        revoked = self.client.patch(
            f"/api/admin/timeline/milestones/{existing.id}",
            json={"title": "Should not change"},
            headers={"X-CSRFToken": login.json["csrf_token"]},
        )
        self.assertEqual(revoked.status_code, 401)

    def test_invalid_ids_return_safe_not_found_responses(self):
        for method, path in [
            ("patch", "/api/admin/timeline/milestones/not-an-id"),
            ("delete", "/api/admin/timeline/milestones/not-an-id"),
        ]:
            response = getattr(self.client, method)(path, json={} if method == "patch" else None, headers=self.write_headers)
            self.assertEqual(response.status_code, 404)
            self.assertEqual(response.json["error"], "milestone_not_found")

    def test_invalid_fields_and_oversized_values_are_rejected(self):
        invalid_payloads = [
            {"category": "Unverified"},
            {"date": "2025-02-30"},
            {"time": "27:00"},
            {"title": "x" * 91},
            {"summary": "x" * 181},
            {"description": "x" * 6001},
            {"location": "x" * 101},
            {"isPublished": "yes"},
            {"sortOrder": -1},
            {"extra": "not accepted"},
        ]
        for change in invalid_payloads:
            response = self.client.post(
                "/api/admin/timeline/milestones",
                json=self._payload(**change),
                headers=self.write_headers,
            )
            self.assertEqual(response.status_code, 400, (change, response.get_data(as_text=True)))
        self.assertEqual(db.session.scalar(db.select(db.func.count()).select_from(TimelineMilestone)), 0)

    def test_server_rejects_more_than_eight_image_references(self):
        images = [
            {"url": f"/photos/{index}.jpg", "name": f"{index}.jpg", "type": "image/jpeg"}
            for index in range(9)
        ]
        response = self.client.post(
            "/api/admin/timeline/milestones",
            json=self._payload(images=images),
            headers=self.write_headers,
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("At most 8 image references are allowed", response.json["fields"]["images"])
        self.assertEqual(db.session.scalar(db.select(db.func.count()).select_from(TimelineMilestone)), 0)

    def test_image_references_are_bounded_and_reject_filesystem_or_active_urls(self):
        invalid_references = [
            {"url": "file:///etc/passwd"},
            {"url": "javascript:alert(1)"},
            {"url": "https://[malformed-host/image.webp"},
            {"url": "//untrusted.example/image.jpg"},
            {"url": "/../../private/photo.jpg"},
            {"url": "https://user:password@example.com/image.jpg"},
            {"url": "/assets/image.svg", "type": "image/svg+xml"},
            {"url": "/assets/image.jpg", "blob": "not accepted"},
        ]
        for image in invalid_references:
            response = self.client.post(
                "/api/admin/timeline/milestones",
                json=self._payload(images=[image]),
                headers=self.write_headers,
            )
            self.assertEqual(response.status_code, 400)
        too_many = self.client.post(
            "/api/admin/timeline/milestones",
            json=self._payload(images=[{"url": "/assets/pic.webp"}] * 9),
            headers=self.write_headers,
        )
        self.assertEqual(too_many.status_code, 400)

    def test_reorder_is_deterministic_and_updates_both_public_and_admin_order(self):
        first = self._seed(published=True, sort_order=0, title="First")
        second = self._seed(published=True, sort_order=1, title="Second")
        third = self._seed(published=False, sort_order=2, title="Draft")
        response = self.client.post(
            "/api/admin/timeline/milestones/reorder",
            json={"ids": [third.id, first.id, second.id]},
            headers=self.write_headers,
        )
        self.assertEqual(response.status_code, 200, response.get_data(as_text=True))
        self.assertEqual(response.json["ids"], [third.id, first.id, second.id])
        public_ids = [item["id"] for item in self.client.get("/api/timeline/milestones").json["milestones"]]
        admin_ids = [item["id"] for item in self.client.get("/api/admin/timeline/milestones").json["milestones"]]
        self.assertEqual(public_ids, [first.id, second.id])
        self.assertEqual(admin_ids, [third.id, first.id, second.id])

    def test_invalid_reorder_is_rejected_without_partial_updates(self):
        first = self._seed(sort_order=0)
        second = self._seed(sort_order=1, title="Second milestone")
        before = [(item.id, item.sort_order) for item in db.session.scalars(_milestones_order()).all()]
        bad_lists = [
            {"ids": [first.id]},
            {"ids": [first.id, first.id]},
            {"ids": [first.id, "not-a-uuid"]},
            {"ids": [first.id, second.id], "unexpected": True},
            [],
        ]
        for body in bad_lists:
            response = self.client.post(
                "/api/admin/timeline/milestones/reorder", json=body, headers=self.write_headers
            )
            self.assertEqual(response.status_code, 400)
            db.session.expire_all()
            after = [(item.id, item.sort_order) for item in db.session.scalars(_milestones_order()).all()]
            self.assertEqual(after, before)

    def test_public_and_admin_get_requests_are_read_only(self):
        item = self._seed(published=True, sort_order=3)
        before_milestone = (item.id, item.sort_order, item.updated_at)
        before_sessions = db.session.scalar(db.select(db.func.count()).select_from(AdminSession))
        self.client.get("/api/timeline/milestones")
        self.client.get("/api/admin/timeline/milestones")
        db.session.expire_all()
        current = db.session.get(TimelineMilestone, item.id)
        after_milestone = (current.id, current.sort_order, current.updated_at)
        after_sessions = db.session.scalar(db.select(db.func.count()).select_from(AdminSession))
        self.assertEqual(after_milestone, before_milestone)
        self.assertEqual(after_sessions, before_sessions)

    def test_upload_requires_authenticated_admin_and_csrf(self):
        outsider = self.app.test_client()
        response = self._upload_png(client=outsider)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(self._upload_png(headers={"X-CSRFToken": "invalid"}).status_code, 400)

    def test_upload_verifies_format_size_dimensions_and_uses_private_random_storage(self):
        invalid = self.client.post(
            "/api/admin/timeline/images", data={"file": (BytesIO(b"not an image"), "looks-like.png")},
            headers=self.write_headers, content_type="multipart/form-data",
        )
        self.assertEqual(invalid.status_code, 400)

        oversized = self.client.post(
            "/api/admin/timeline/images", data={"file": (BytesIO(b"x" * (10 * 1024 * 1024 + 1)), "large.png")},
            headers=self.write_headers, content_type="multipart/form-data",
        )
        self.assertEqual(oversized.status_code, 400)

        huge_dimensions = self.client.post(
            "/api/admin/timeline/images", data={"file": (self._png(size=(8001, 1)), "wide.png")},
            headers=self.write_headers, content_type="multipart/form-data",
        )
        self.assertEqual(huge_dimensions.status_code, 400)

        uploaded = self._upload_png(name="../../folder/renamed.png")
        self.assertEqual(uploaded.status_code, 201, uploaded.get_data(as_text=True))
        image = uploaded.json["image"]
        self.assertRegex(image["url"], r"^/api/timeline/images/[0-9a-f-]{36}$")
        self.assertEqual(image["type"], "image/png")
        self.assertEqual(image["name"], "renamed.png")
        stored_files = list((Path(self.upload_dir.name) / "private-images").iterdir())
        self.assertEqual(len(stored_files), 1)
        self.assertRegex(stored_files[0].name, r"^[a-f0-9]{32}\.img$")
        self.assertEqual(stored_files[0].stat().st_mode & 0o777, 0o600)
        self.assertNotIn("react-pilot", str(stored_files[0].resolve()))

    def test_image_is_private_until_linked_to_published_milestone(self):
        uploaded = self._upload_png()
        reference = uploaded.json["image"]
        url = reference["url"]
        outsider = self.app.test_client()
        private_response = outsider.get(url)
        self.assertEqual(private_response.status_code, 404)
        private_response.close()
        admin_image_response = self.client.get(url)
        self.assertEqual(admin_image_response.status_code, 200)
        admin_image_response.close()

        clean_reference = {key: reference[key] for key in ("url", "name", "type")}
        created = self._create(images=[clean_reference])
        self.assertFalse(created["isPublished"])
        hidden_response = outsider.get(url)
        self.assertEqual(hidden_response.status_code, 404)
        hidden_response.close()
        published = self.client.patch(
            f"/api/admin/timeline/milestones/{created['id']}",
            json={"isPublished": True}, headers=self.write_headers,
        )
        self.assertEqual(published.status_code, 200)
        public_items = self.client.get("/api/timeline/milestones").json["milestones"]
        self.assertEqual([item["id"] for item in public_items], [created["id"]])
        response = outsider.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, "image/png")
        self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")
        response.close()

        self.client.patch(
            f"/api/admin/timeline/milestones/{created['id']}",
            json={"isPublished": False}, headers=self.write_headers,
        )
        hidden_again = outsider.get(url)
        self.assertEqual(hidden_again.status_code, 404)
        hidden_again.close()

    def test_delete_retains_shared_image_data(self):
        reference = self._upload_png().json["image"]
        item = self._create(images=[{key: reference[key] for key in ("url", "name", "type")}])
        image_id = reference["url"].rsplit("/", 1)[-1]
        image = db.session.get(TimelineImage, image_id)
        image_path = Path(self.upload_dir.name) / "private-images" / image.storage_key
        self.client.delete(f"/api/admin/timeline/milestones/{item['id']}", headers=self.write_headers)
        self.assertTrue(image_path.is_file())

    def test_local_import_preserves_fields_photos_and_is_idempotent(self):
        import json

        payload = self._payload(isDemo=True, isPublished=True)
        form = {"milestone": json.dumps({**payload, "sourceId": "grid-timeline-pilot:legacy-42"})}
        first = self.client.post(
            "/api/admin/timeline/imports", data={**form, "photos": (self._png(), "old-photo.png")},
            headers=self.write_headers, content_type="multipart/form-data",
        )
        self.assertEqual(first.status_code, 201, first.get_data(as_text=True))
        imported = first.json["milestone"]
        self.assertFalse(imported["isPublished"])
        self.assertTrue(imported["isDemo"])
        self.assertEqual(imported["sourceId"], "grid-timeline-pilot:legacy-42")
        self.assertEqual(len(imported["images"]), 1)
        self.assertNotIn("blob", imported["images"][0])
        server_id = imported["id"]
        retry = self.client.post(
            "/api/admin/timeline/imports", data={**form, "photos": (self._png(), "old-photo.png")},
            headers=self.write_headers, content_type="multipart/form-data",
        )
        self.assertEqual(retry.status_code, 200)
        self.assertTrue(retry.json["alreadyImported"])
        self.assertEqual(retry.json["milestone"]["id"], server_id)
        self.assertEqual(db.session.scalar(db.select(db.func.count()).select_from(TimelineMilestone)), 1)
        self.assertEqual(len(list((Path(self.upload_dir.name) / "private-images").iterdir())), 1)


def _milestones_order():
    return db.select(TimelineMilestone).order_by(TimelineMilestone.sort_order, TimelineMilestone.id)


if __name__ == "__main__":
    unittest.main()
