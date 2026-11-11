"""Timeline-only published milestone reads and protected admin management."""

from __future__ import annotations

import re
from datetime import UTC, datetime
from urllib.parse import unquote, urlsplit
from uuid import UUID, uuid4

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy.exc import IntegrityError

from .auth import admin_required
from .extensions import db
from .models import TimelineImage, TimelineMilestone

milestones_api = Blueprint("timeline_milestones", __name__)

CATEGORIES = {"Events", "Workshops", "Achievements", "Projects", "Community"}
IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"}
IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif", "avif"}
WRITABLE_FIELDS = {
    "title", "category", "date", "time", "location", "summary", "description",
    "images", "isDemo", "isPublished",
}
REQUIRED_FIELDS = {"title", "category", "date", "summary", "description"}
DATE_PATTERN = re.compile(r"^(\d{4})-(\d{2})-(\d{2})$")
TIME_PATTERN = re.compile(r"^(?:[01]\d|2[0-3]):[0-5]\d$")
MANAGED_IMAGE_PATTERN = re.compile(r"^/api/timeline/images/([0-9a-f-]{36})$")


def _timestamp(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=UTC)
    return value.astimezone(UTC).isoformat().replace("+00:00", "Z")


def _serialize(milestone: TimelineMilestone, *, include_source: bool = False) -> dict:
    result = {
        "id": milestone.id,
        "title": milestone.title,
        "category": milestone.category,
        "date": milestone.date,
        "time": milestone.time,
        "location": milestone.location,
        "summary": milestone.summary,
        "description": milestone.description,
        "images": milestone.images,
        "isDemo": milestone.is_demo,
        "isPublished": milestone.is_published,
        "sortOrder": milestone.sort_order,
        "createdAt": _timestamp(milestone.created_at),
        "updatedAt": _timestamp(milestone.updated_at),
    }
    if include_source and milestone.source_id:
        result["sourceId"] = milestone.source_id
    return result


def _managed_image_size_error(images: list[dict]) -> str | None:
    if len(images) > current_app.config.get("TIMELINE_MAX_MILESTONE_IMAGES", 8):
        return "A milestone can contain at most 8 photos."
    total = 0
    for reference in images:
        url = reference["url"]
        if not url.startswith("/api/timeline/images/"):
            continue
        match = MANAGED_IMAGE_PATTERN.fullmatch(url)
        if not match:
            return "Managed Timeline image references must use the canonical image URL."
        image = db.session.get(TimelineImage, match.group(1))
        if image is None:
            return "A managed Timeline image reference does not exist."
        total += image.size_bytes
    if total > current_app.config["TIMELINE_MAX_MILESTONE_IMAGE_BYTES"]:
        return "Keep combined uploaded photos under 40 MB per milestone."
    return None


def _valid_date(value: str) -> bool:
    match = DATE_PATTERN.fullmatch(value)
    if not match:
        return False
    try:
        datetime(*(int(part) for part in match.groups()))
    except ValueError:
        return False
    return True


def _valid_image_reference(value: object) -> bool:
    if not isinstance(value, dict) or set(value) - {"url", "name", "type"}:
        return False
    url = value.get("url")
    if not isinstance(url, str) or not url or len(url) > 2048 or any(ord(char) < 32 for char in url):
        return False
    if "\\" in url or url.startswith("//"):
        return False

    try:
        parsed = urlsplit(url)
    except ValueError:
        return False
    if parsed.scheme:
        if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
            return False
    elif not url.startswith("/") or parsed.netloc:
        return False
    decoded_segments = unquote(parsed.path).split("/")
    if any(segment in {".", ".."} for segment in decoded_segments):
        return False

    name = value.get("name", "")
    image_type = value.get("type", "")
    if not isinstance(name, str) or len(name) > 255:
        return False
    if not isinstance(image_type, str) or (image_type and image_type.lower() not in IMAGE_TYPES):
        return False
    path_name = unquote(parsed.path).rsplit("/", 1)[-1]
    candidate_name = name or path_name
    if "." in candidate_name and candidate_name.rsplit(".", 1)[-1].lower() not in IMAGE_EXTENSIONS:
        return False
    return True


def _validate_payload(payload: object, *, partial: bool) -> tuple[dict | None, dict]:
    if not isinstance(payload, dict):
        return None, {"body": "Expected a JSON object."}

    errors: dict[str, str] = {}
    unknown = set(payload) - WRITABLE_FIELDS
    for key in sorted(unknown):
        errors[key] = "This field is not accepted."
    if not partial:
        for key in REQUIRED_FIELDS - set(payload):
            errors[key] = "This field is required."

    cleaned: dict = {}
    for key, value in payload.items():
        if key not in WRITABLE_FIELDS:
            continue
        if key in {"title", "summary", "description", "location", "time"}:
            if not isinstance(value, str):
                errors[key] = "Expected text."
                continue
            value = value.strip()
            max_lengths = {"title": 90, "summary": 180, "description": 6000, "location": 100, "time": 5}
            if len(value) > max_lengths[key]:
                errors[key] = f"Must be no more than {max_lengths[key]} characters."
                continue
            if key in REQUIRED_FIELDS and not value:
                errors[key] = "This field cannot be blank."
                continue
            if key == "time" and value and not TIME_PATTERN.fullmatch(value):
                errors[key] = "Expected a 24-hour HH:MM time."
                continue
            cleaned[key] = value
        elif key == "category":
            if not isinstance(value, str) or value not in CATEGORIES:
                errors[key] = "Choose one of the supported Timeline categories."
            else:
                cleaned[key] = value
        elif key == "date":
            if not isinstance(value, str) or not _valid_date(value):
                errors[key] = "Expected a real calendar date in YYYY-MM-DD format."
            else:
                cleaned[key] = value
        elif key in {"isDemo", "isPublished"}:
            if not isinstance(value, bool):
                errors[key] = "Expected a boolean."
            else:
                cleaned[key] = value
        elif key == "images":
            if not isinstance(value, list):
                errors[key] = "Expected a list of image references."
            elif len(value) > 8:
                errors[key] = "At most 8 image references are allowed."
            elif any(not _valid_image_reference(image) for image in value):
                errors[key] = "Each image must use a safe HTTPS or same-origin path reference and supported image metadata."
            else:
                cleaned[key] = [
                    {"url": image["url"], "name": image.get("name", ""), "type": image.get("type", "")}
                    for image in value
                ]

    return (cleaned if not errors else None), errors


def _bad_request(errors: dict):
    return jsonify(error="invalid_milestone", fields=errors), 400


def _find_milestone(milestone_id: str):
    try:
        # UUID parsing also bounds the lookup input and avoids leaking DB details.
        canonical_id = str(UUID(milestone_id))
    except ValueError:
        return None
    return db.session.get(TimelineMilestone, canonical_id)


def _ordered_query(*, published_only: bool):
    statement = db.select(TimelineMilestone)
    if published_only:
        statement = statement.where(TimelineMilestone.is_published.is_(True))
    return statement.order_by(
        TimelineMilestone.sort_order,
        TimelineMilestone.date,
        TimelineMilestone.time,
        TimelineMilestone.id,
    )


@milestones_api.get("/timeline/milestones")
def public_milestones():
    items = db.session.scalars(_ordered_query(published_only=True)).all()
    # Return the non-sensitive local import key only when present so the public
    # React adapter can suppress the still-preserved IndexedDB copy.
    return jsonify(milestones=[_serialize(item, include_source=True) for item in items])


@milestones_api.get("/admin/timeline/milestones")
@admin_required
def admin_list_milestones():
    items = db.session.scalars(_ordered_query(published_only=False)).all()
    return jsonify(milestones=[_serialize(item, include_source=True) for item in items])


@milestones_api.post("/admin/timeline/milestones")
@admin_required
def create_milestone():
    cleaned, errors = _validate_payload(request.get_json(silent=True), partial=False)
    if errors:
        return _bad_request(errors)
    image_error = _managed_image_size_error(cleaned.get("images", []))
    if image_error:
        return _bad_request({"images": image_error})

    last_order = db.session.scalar(db.select(db.func.max(TimelineMilestone.sort_order)))
    values = {
        "id": str(uuid4()),
        "time": "",
        "location": "",
        "images": [],
        "is_demo": False,
        "is_published": False,
        "sort_order": (last_order if last_order is not None else -1) + 1,
    }
    field_map = {"isDemo": "is_demo", "isPublished": "is_published"}
    values.update({field_map.get(key, key): value for key, value in cleaned.items()})
    milestone = TimelineMilestone(**values)
    db.session.add(milestone)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(error="milestone_conflict"), 409
    return jsonify(milestone=_serialize(milestone)), 201


@milestones_api.patch("/admin/timeline/milestones/<milestone_id>")
@admin_required
def update_milestone(milestone_id: str):
    milestone = _find_milestone(milestone_id)
    if milestone is None:
        return jsonify(error="milestone_not_found"), 404
    cleaned, errors = _validate_payload(request.get_json(silent=True), partial=True)
    if errors:
        return _bad_request(errors)
    if not cleaned:
        return _bad_request({"body": "Provide at least one field to update."})
    image_error = _managed_image_size_error(cleaned.get("images", milestone.images))
    if image_error:
        return _bad_request({"images": image_error})

    field_map = {
        "isDemo": "is_demo",
        "isPublished": "is_published",
    }
    for key, value in cleaned.items():
        setattr(milestone, field_map.get(key, key), value)
    milestone.updated_at = datetime.now(UTC)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(error="milestone_conflict"), 409
    return jsonify(milestone=_serialize(milestone, include_source=True))


@milestones_api.delete("/admin/timeline/milestones/<milestone_id>")
@admin_required
def delete_milestone(milestone_id: str):
    milestone = _find_milestone(milestone_id)
    if milestone is None:
        return jsonify(error="milestone_not_found"), 404
    db.session.delete(milestone)
    db.session.commit()
    return jsonify(deleted=True)


@milestones_api.post("/admin/timeline/milestones/reorder")
@admin_required
def reorder_milestones():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or set(payload) != {"ids"} or not isinstance(payload["ids"], list):
        return _bad_request({"ids": "Expected an object containing the complete ordered milestone ID list."})
    ids = payload["ids"]
    if any(not isinstance(item, str) for item in ids) or len(set(ids)) != len(ids):
        return _bad_request({"ids": "IDs must be unique strings."})
    try:
        canonical_ids = [str(UUID(item)) for item in ids]
    except ValueError:
        return _bad_request({"ids": "Every ID must be a valid milestone UUID."})
    if len(set(canonical_ids)) != len(canonical_ids):
        return _bad_request({"ids": "IDs must be unique strings."})

    existing_ids = set(db.session.scalars(db.select(TimelineMilestone.id)).all())
    if set(canonical_ids) != existing_ids:
        return _bad_request({"ids": "Provide every existing milestone ID exactly once."})

    try:
        for position, milestone_id in enumerate(canonical_ids):
            db.session.get(TimelineMilestone, milestone_id).sort_order = position
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return jsonify(ids=canonical_ids)
