"""Security regression tests for Timeline-only admin authentication."""

from __future__ import annotations

import unittest
import os
import sqlite3
import stat
import tempfile
from pathlib import Path
from unittest.mock import patch
from flask import g

from app import create_app
from app.accounts import change_admin_password, revoke_admin_sessions, set_admin_active
from app.auth import DUMMY_PASSWORD_HASH
from app.extensions import db
from app.models import Admin, AdminSession
from werkzeug.security import check_password_hash, generate_password_hash


class TimelineAuthTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app(
            {
                "TESTING": True,
                "SECRET_KEY": "test-only-secret-key-that-is-not-used-in-production",
                "SQLALCHEMY_DATABASE_URI": "sqlite://",
                "RATELIMIT_STORAGE_URI": "memory://",
                "WTF_CSRF_ENABLED": True,
                "SESSION_COOKIE_SECURE": False,
            }
        )
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        self.client = self.app.test_client()
        self.password = "timeline-test-password-long"
        self.admin = Admin(username="timeline-reviewer", password_hash=generate_password_hash(self.password, method="scrypt"))
        db.session.add(self.admin)
        db.session.commit()
        self.csrf_token = self._csrf_token()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def _csrf_token(self):
        # The fixture holds an app context across requests; clear Flask-WTF's
        # request cache so each simulated request uses its own session cookie.
        g.pop("csrf_token", None)
        response = self.client.get("/api/auth/csrf")
        self.assertEqual(response.status_code, 200)
        return response.json["csrf_token"]

    def _login(self, password=None):
        csrf_token = self._csrf_token()
        response = self.client.post(
            "/api/auth/login",
            json={"username": self.admin.username, "password": password or self.password},
            headers={"X-CSRFToken": csrf_token},
        )
        if response.status_code == 200:
            self.login_csrf_token = response.json["csrf_token"]
        return response

    def test_wrong_password_is_rejected(self):
        response = self._login("incorrect-password")
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json["error"], "invalid_credentials")

    def test_oversized_password_is_rejected_before_hash_verification(self):
        response = self._login("x" * 1025)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json["error"], "invalid_credentials")

    def test_unauthenticated_admin_route_returns_401(self):
        response = self.client.get("/api/admin/ping")
        self.assertEqual(response.status_code, 401)
        write_response = self.client.post("/api/auth/logout")
        self.assertEqual(write_response.status_code, 401)

    def test_authenticated_admin_can_access_protected_route(self):
        response = self._login()
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json["authenticated"])
        protected = self.client.get("/api/admin/ping")
        self.assertEqual(protected.status_code, 200)
        self.assertEqual(protected.json["admin"]["username"], self.admin.username)

    def test_current_session_restoration_returns_csrf_for_authenticated_session(self):
        login = self._login()
        self.assertEqual(login.status_code, 200)
        restored = self.client.get("/api/auth/session")
        self.assertEqual(restored.status_code, 200)
        self.assertTrue(restored.json["authenticated"])
        self.assertEqual(restored.json["csrf_token"], login.json["csrf_token"])
        self.assertNotIn("session", restored.json)
        self.assertNotIn("token", restored.json)
        logout = self.client.post(
            "/api/auth/logout",
            headers={"X-CSRFToken": restored.json["csrf_token"]},
        )
        self.assertEqual(logout.status_code, 200)
        self.assertFalse(self.client.get("/api/auth/session").json["authenticated"])

    def test_current_session_does_not_expose_csrf_without_authentication(self):
        response = self.client.get("/api/auth/session")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json["authenticated"])
        self.assertNotIn("csrf_token", response.json)

    def test_production_admin_cookie_has_secure_attributes(self):
        self.app.config["SESSION_COOKIE_SECURE"] = True
        response = self._login()
        self.assertEqual(response.status_code, 200)
        auth_cookie = next(
            header for header in response.headers.getlist("Set-Cookie")
            if header.startswith("timeline_admin_session=")
        )
        self.assertIn("Secure", auth_cookie)
        self.assertIn("HttpOnly", auth_cookie)
        self.assertIn("SameSite=Lax", auth_cookie)
        self.assertIn("Path=/api", auth_cookie)

    def test_production_requires_secure_session_cookies(self):
        with self.assertRaisesRegex(RuntimeError, "Secure session cookies"):
            create_app(
                {
                    "SECRET_KEY": "test-only-secret-key-that-is-not-used-in-production",
                    "TIMELINE_ENV": "production",
                    "SESSION_COOKIE_SECURE": False,
                    "RATELIMIT_STORAGE_URI": "redis://localhost:6379/0",
                }
            )

    def test_production_requires_shared_rate_limit_storage(self):
        with self.assertRaisesRegex(RuntimeError, "shared Redis"):
            create_app(
                {
                    "SECRET_KEY": "test-only-secret-key-that-is-not-used-in-production",
                    "TIMELINE_ENV": "production",
                    "SESSION_COOKIE_SECURE": True,
                    "RATELIMIT_STORAGE_URI": "memory://",
                }
            )

    def test_production_configuration_accepts_redis_scheme(self):
        from app import _validate_production_config

        _validate_production_config(
            {
                "TIMELINE_ENV": "production",
                "SESSION_COOKIE_SECURE": True,
                "RATELIMIT_STORAGE_URI": "rediss://user:password@example.invalid:6379/0",
            }
        )

    def test_write_without_valid_csrf_token_is_rejected(self):
        self.assertEqual(self._login().status_code, 200)
        response = self.client.post("/api/auth/logout", headers={"X-CSRFToken": "invalid"})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["error"], "csrf_failed")
        self.assertEqual(self.client.get("/api/admin/ping").status_code, 200)

    def test_invalid_login_csrf_is_rejected(self):
        response = self.client.post(
            "/api/auth/login",
            json={"username": self.admin.username, "password": self.password},
            headers={"X-CSRFToken": "invalid"},
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json["error"], "csrf_failed")

    def test_public_registration_does_not_exist(self):
        response = self.client.post("/api/auth/register", json={"username": "public", "password": "anything"})
        self.assertEqual(response.status_code, 404)

    def test_admin_cli_creates_hashed_account_interactively(self):
        result = self.app.test_cli_runner().invoke(
            args=["create-admin", "--username", "new-timeline-admin"],
            input="another-long-password\nanother-long-password\n",
        )
        self.assertEqual(result.exit_code, 0, result.output)
        created = db.session.scalar(db.select(Admin).where(Admin.username == "new-timeline-admin"))
        self.assertIsNotNone(created)
        self.assertNotEqual(created.password_hash, "another-long-password")
        self.assertTrue(check_password_hash(created.password_hash, "another-long-password"))

    def test_cli_and_login_share_the_same_password_maximum(self):
        maximum = self.app.config["ADMIN_MAX_PASSWORD_LENGTH"]
        self.assertEqual(maximum, 1024)
        self.assertEqual(len(DUMMY_PASSWORD_HASH), 162)

        result = self.app.test_cli_runner().invoke(
            args=["create-admin", "--username", "too-long-password-admin"],
            input=f"{'x' * (maximum + 1)}\n{'x' * (maximum + 1)}\n",
        )
        self.assertNotEqual(result.exit_code, 0)
        self.assertIn(f"between 12 and {maximum} characters", result.output)

        response = self._login("x" * (maximum + 1))
        self.assertEqual(response.status_code, 401)

    def test_password_is_stored_as_a_hash_not_plaintext(self):
        admin = db.session.scalar(db.select(Admin).where(Admin.username == self.admin.username))
        self.assertNotEqual(admin.password_hash, self.password)
        self.assertTrue(check_password_hash(admin.password_hash, self.password))
        self.assertTrue(admin.password_hash.startswith("scrypt:"))

    def test_logout_invalidates_server_side_session(self):
        self.assertEqual(self._login().status_code, 200)
        self.assertEqual(self.client.get("/api/admin/ping").status_code, 200)
        self.assertEqual(db.session.scalar(db.select(db.func.count()).select_from(AdminSession)), 1)

        # The login CSRF token is stored in the server-side session row. The
        # Flask-WTF bootstrap session is deliberately cleared on login.
        response = self.client.post("/api/auth/logout", headers={"X-CSRFToken": self.login_csrf_token})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(db.session.scalar(db.select(db.func.count()).select_from(AdminSession)), 0)
        self.assertFalse(self.client.get("/api/auth/session").json["authenticated"])
        self.assertEqual(self.client.get("/api/admin/ping").status_code, 401)

    def test_expired_session_is_rejected_without_get_mutation(self):
        self.assertEqual(self._login().status_code, 200)
        admin_session = db.session.scalar(db.select(AdminSession))
        admin_session.expires_at = admin_session.expires_at.replace(year=2000)
        db.session.commit()

        before_count = db.session.scalar(db.select(db.func.count()).select_from(AdminSession))
        self.assertEqual(self.client.get("/api/admin/ping").status_code, 401)
        self.assertFalse(self.client.get("/api/auth/session").json["authenticated"])
        after_count = db.session.scalar(db.select(db.func.count()).select_from(AdminSession))
        self.assertEqual(after_count, before_count)

    def test_inactive_admin_session_is_rejected(self):
        self.assertEqual(self._login().status_code, 200)
        self.admin.is_active = False
        db.session.commit()

        self.assertEqual(self.client.get("/api/admin/ping").status_code, 401)
        self.assertFalse(self.client.get("/api/auth/session").json["authenticated"])

    def test_deactivation_then_reactivation_does_not_restore_old_session(self):
        self.assertEqual(self._login().status_code, 200)
        set_admin_active(self.admin, False)
        db.session.commit()
        set_admin_active(self.admin, True)
        db.session.commit()

        self.assertEqual(self.client.get("/api/admin/ping").status_code, 401)
        self.assertFalse(self.client.get("/api/auth/session").json["authenticated"])
        self.assertEqual(self._login().status_code, 200)

    def test_password_change_revokes_existing_sessions(self):
        self.assertEqual(self._login().status_code, 200)
        change_admin_password(self.admin, "replacement-password-long")
        db.session.commit()

        self.assertEqual(self.client.get("/api/admin/ping").status_code, 401)
        self.assertEqual(self._login("replacement-password-long").status_code, 200)

    def test_revoke_helper_removes_all_admin_sessions(self):
        self.assertEqual(self._login().status_code, 200)
        second_client = self.app.test_client()
        g.pop("csrf_token", None)
        csrf = second_client.get("/api/auth/csrf").json["csrf_token"]
        second_login = second_client.post(
            "/api/auth/login",
            json={"username": self.admin.username, "password": self.password},
            headers={"X-CSRFToken": csrf},
        )
        self.assertEqual(second_login.status_code, 200, second_login.get_data(as_text=True))
        self.assertEqual(db.session.scalar(db.select(db.func.count()).select_from(AdminSession)), 2)

        self.assertEqual(revoke_admin_sessions(self.admin), 2)
        db.session.commit()
        self.assertEqual(self.client.get("/api/admin/ping").status_code, 401)
        self.assertEqual(second_client.get("/api/admin/ping").status_code, 401)

    def test_login_is_rate_limited(self):
        for _ in range(5):
            self.assertEqual(self._login("incorrect-password").status_code, 401)
        response = self._login("incorrect-password")
        self.assertEqual(response.status_code, 429)

    def test_login_attempts_across_usernames_are_limited_per_ip(self):
        for index in range(20):
            response = self.client.post(
                "/api/auth/login",
                json={"username": f"unknown-user-{index}", "password": "incorrect-password"},
                headers={"X-CSRFToken": self.csrf_token},
            )
            self.assertEqual(response.status_code, 401)

        response = self.client.post(
            "/api/auth/login",
            json={"username": "a-new-unknown-user", "password": "incorrect-password"},
            headers={"X-CSRFToken": self.csrf_token},
        )
        self.assertEqual(response.status_code, 429)

    def test_unknown_username_uses_dummy_password_verification(self):
        with patch("app.auth.check_password_hash", return_value=False) as verify:
            response = self.client.post(
                "/api/auth/login",
                json={"username": "missing-admin", "password": "incorrect-password"},
                headers={"X-CSRFToken": self.csrf_token},
            )
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json, {"error": "invalid_credentials"})
        verify.assert_called_once_with(DUMMY_PASSWORD_HASH, "incorrect-password")

    def test_all_admin_namespace_operations_require_server_authorization(self):
        future_app = create_app(
            {
                "TESTING": True,
                "SECRET_KEY": "future-route-test-secret",
                "SQLALCHEMY_DATABASE_URI": "sqlite://",
                "RATELIMIT_STORAGE_URI": "memory://",
            }
        )
        future_app.add_url_rule(
            "/api/admin/future-operation",
            endpoint="future_timeline_admin.write_operation",
            view_func=lambda: {"ok": True},
            methods=["POST"],
        )
        with future_app.app_context():
            db.create_all()
            future_admin = Admin(
                username="future-route-admin",
                password_hash=generate_password_hash(self.password, method="scrypt"),
            )
            db.session.add(future_admin)
            db.session.commit()
            future_username = future_admin.username

        future_client = future_app.test_client()
        response = future_client.post("/api/admin/future-operation")
        self.assertEqual(response.status_code, 401)
        csrf = future_client.get("/api/auth/csrf").json["csrf_token"]
        login = future_client.post(
            "/api/auth/login",
            json={"username": future_username, "password": self.password},
            headers={"X-CSRFToken": csrf},
        )
        self.assertEqual(login.status_code, 200)
        rejected = future_client.post(
            "/api/admin/future-operation", headers={"X-CSRFToken": "invalid"}
        )
        self.assertEqual(rejected.status_code, 400)
        accepted = future_client.post(
            "/api/admin/future-operation",
            headers={"X-CSRFToken": login.json["csrf_token"]},
        )
        self.assertEqual(accepted.status_code, 200)
        with future_app.app_context():
            db.drop_all()
            db.session.remove()
            db.engine.dispose()

    def test_sqlite_permissions_restrict_new_paths_and_preserve_existing_modes(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            new_database = root / "new-private" / "nested" / "timeline.sqlite3"
            new_app = create_app(
                {
                    "TESTING": True,
                    "SECRET_KEY": "temporary-database-test-secret",
                    "SQLALCHEMY_DATABASE_URI": f"sqlite:///{new_database}",
                    "RATELIMIT_STORAGE_URI": "memory://",
                }
            )
            self.assertEqual(stat.S_IMODE(new_database.parent.stat().st_mode), 0o700)
            with new_app.app_context():
                db.create_all()
                db.engine.dispose()
            self.assertEqual(stat.S_IMODE(new_database.stat().st_mode), 0o600)

            existing_directory = root / "existing-data"
            existing_directory.mkdir(mode=0o755)
            os.chmod(existing_directory, 0o755)
            existing_database = existing_directory / "timeline.sqlite3"
            existing_connection = sqlite3.connect(existing_database)
            existing_connection.close()
            os.chmod(existing_database, 0o640)

            existing_app = create_app(
                {
                    "TESTING": True,
                    "SECRET_KEY": "temporary-database-test-secret",
                    "SQLALCHEMY_DATABASE_URI": f"sqlite:///{existing_database}",
                    "RATELIMIT_STORAGE_URI": "memory://",
                }
            )
            with existing_app.app_context():
                db.create_all()
                db.engine.dispose()
            self.assertEqual(stat.S_IMODE(existing_directory.stat().st_mode), 0o755)
            self.assertEqual(stat.S_IMODE(existing_database.stat().st_mode), 0o640)

    def test_sqlite_database_path_inside_repository_is_rejected(self):
        repository_root = Path(__file__).resolve().parents[3]
        database_path = repository_root / ".timeline-backend-path-guard-test.sqlite3"
        self.assertFalse(database_path.exists())

        with self.assertRaisesRegex(RuntimeError, "outside the GRID source repository"):
            create_app(
                {
                    "SECRET_KEY": "temporary-path-guard-test-secret",
                    "SQLALCHEMY_DATABASE_URI": f"sqlite:///{database_path}",
                    "RATELIMIT_STORAGE_URI": "memory://",
                }
            )

        self.assertFalse(database_path.exists())


if __name__ == "__main__":
    unittest.main()
