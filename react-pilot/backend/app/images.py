"""Private Timeline image uploads and published-only image serving."""

from __future__ import annotations

import hashlib
import io
import os
import re
import warnings
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID, uuid4

from flask import Blueprint, current_app, jsonify, request, send_file
from PIL import Image, UnidentifiedImageError
from PIL.Image import DecompressionBombError, DecompressionBombWarning
from werkzeug.utils import secure_filename

from .auth import admin_required, authenticate_admin_request
from . import _restrict_path_permissions
from .extensions import db
from .milestones import _bad_request, _managed_image_size_error, _serialize, _validate_payload
from .models import Admin, TimelineImage, TimelineMilestone

images_api = Blueprint("timeline_images", __name__)
IMAGE_MIMES = {
    "JPEG": "image/jpeg",
    "PNG": "image/png",
    "WEBP": "image/webp",
    "GIF": "image/gif",
    "AVIF": "image/avif",
}
IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif", "avif"}
STORAGE_KEY_PATTERN = re.compile(r"^[a-f0-9]{32}\.img$")
IMAGE_ROUTE_PREFIX = "/api/timeline/images/"


def _storage_root() -> Path:
    root = Path(current_app.config["TIMELINE_UPLOAD_DIR"]).expanduser().resolve()
    source_root = Path(current_app.root_path).resolve().parents[2]
    if root == source_root or source_root in root.parents:
        raise RuntimeError("Timeline image storage must be outside the GRID source repository.")
    return root


def _ensure_storage_root(root: Path) -> None:
    missing = []
    candidate = root
    while not candidate.exists():
        missing.append(candidate)
        candidate = candidate.parent
    if not candidate.is_dir():
        raise RuntimeError("Timeline image storage parent is not a directory.")
    for directory in reversed(missing):
        directory.mkdir(mode=0o700)
        _restrict_path_permissions(directory, is_directory=True)


def _decode_image(data: bytes) -> tuple[str, int, int]:
    if not data:
        raise ValueError("The selected image is empty.")
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("error", DecompressionBombWarning)
            with Image.open(io.BytesIO(data)) as image:
                image_format = image.format
                width, height = image.size
                max_dimension = current_app.config["TIMELINE_MAX_IMAGE_DIMENSION"]
                max_pixels = current_app.config["TIMELINE_MAX_IMAGE_PIXELS"]
                if width < 1 or height < 1 or width > max_dimension or height > max_dimension or width * height > max_pixels:
                    raise ValueError(
                        f"Image dimensions must be at most {max_dimension}×{max_dimension} and {max_pixels:,} total pixels."
                    )
                image.verify()
            with Image.open(io.BytesIO(data)) as verified:
                verified.load()
    except ValueError:
        raise
    except (UnidentifiedImageError, OSError, DecompressionBombError, DecompressionBombWarning) as error:
        raise ValueError("The uploaded file is not a valid supported raster image.") from error

    mime_type = IMAGE_MIMES.get(image_format or "")
    if not mime_type:
        raise ValueError("Use JPG, PNG, WebP, GIF or AVIF images. SVG is not accepted.")
    return mime_type, width, height


def _normal_name(name: str, mime_type: str) -> str:
    safe = secure_filename(Path(name or "").name)[:255]
    extension = safe.rsplit(".", 1)[-1].lower() if "." in safe else ""
    if extension not in IMAGE_EXTENSIONS:
        extension = mime_type.split("/", 1)[-1].replace("jpeg", "jpg")
        safe = f"photo.{extension}"
    return safe or "photo"


def _write_private_image(data: bytes, *, name: str, admin: Admin) -> tuple[TimelineImage, dict]:
    mime_type, width, height = _decode_image(data)
    storage_root = _storage_root()
    _ensure_storage_root(storage_root)
    image_id = str(uuid4())
    storage_key = f"{uuid4().hex}.img"
    path = storage_root / storage_key
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        with os.fdopen(descriptor, "wb") as output:
            output.write(data)
            output.flush()
            os.fsync(output.fileno())
    except Exception:
        path.unlink(missing_ok=True)
        raise

    safe_name = _normal_name(name, mime_type)
    image = TimelineImage(
        id=image_id,
        storage_key=storage_key,
        original_name=safe_name,
        mime_type=mime_type,
        size_bytes=len(data),
        width=width,
        height=height,
        sha256=hashlib.sha256(data).hexdigest(),
        uploaded_by=admin.id,
        created_at=datetime.now(UTC),
    )
    reference = {"url": f"{IMAGE_ROUTE_PREFIX}{image_id}", "name": safe_name, "type": mime_type}
    return image, reference


def _read_upload(file_storage) -> tuple[bytes, str]:
    data = file_storage.stream.read(current_app.config["TIMELINE_MAX_IMAGE_BYTES"] + 1)
    if not data:
        raise ValueError("Choose an image to upload.")
    if len(data) > current_app.config["TIMELINE_MAX_IMAGE_BYTES"]:
        raise ValueError("Each photo must be 10 MB or smaller.")
    return data, file_storage.filename or "photo"


def _image_path(image: TimelineImage) -> Path | None:
    if not STORAGE_KEY_PATTERN.fullmatch(image.storage_key):
        return None
    root = _storage_root()
    path = (root / image.storage_key).resolve()
    return path if path.parent == root and path.is_file() else None


def _linked_to_published_milestone(reference: str) -> bool:
    published = db.session.scalars(
        db.select(TimelineMilestone).where(TimelineMilestone.is_published.is_(True))
    ).all()
    return any(
        any(isinstance(item, dict) and item.get("url") == reference for item in (milestone.images or []))
        for milestone in published
    )


@images_api.post("/admin/timeline/images")
@admin_required
def upload_image():
    file_storage = request.files.get("file")
    if file_storage is None:
        return _bad_request({"file": "Choose one image file."})
    try:
        data, name = _read_upload(file_storage)
        image, reference = _write_private_image(data, name=name, admin=request_admin())
        db.session.add(image)
        db.session.commit()
    except ValueError as error:
        db.session.rollback()
        return _bad_request({"file": str(error)})
    except Exception:
        db.session.rollback()
        if "image" in locals():
            (_storage_root() / image.storage_key).unlink(missing_ok=True)
        raise
    return jsonify(image={**reference, "size": image.size_bytes, "width": image.width, "height": image.height}), 201


@images_api.post("/admin/timeline/imports")
@admin_required
def import_local_milestone():
    import json

    try:
        payload = json.loads(request.form.get("milestone", ""))
    except (TypeError, ValueError):
        return _bad_request({"milestone": "Provide a valid milestone JSON object."})
    if not isinstance(payload, dict):
        return _bad_request({"milestone": "Expected a JSON object."})
    source_id = payload.pop("sourceId", None)
    if not isinstance(source_id, str) or not source_id.strip() or len(source_id) > 255:
        return _bad_request({"sourceId": "A stable local source ID up to 255 characters is required."})
    source_id = source_id.strip()

    existing = db.session.scalar(db.select(TimelineMilestone).where(TimelineMilestone.source_id == source_id))
    if existing:
        return jsonify(imported=False, alreadyImported=True, milestone=_serialize(existing, include_source=True))

    files = request.files.getlist("photos")
    if not isinstance(payload.get("images", []), list) or len(payload.get("images", [])) + len(files) > 8:
        return _bad_request({"images": "At most 8 image references/photos are allowed."})

    original_publication = payload.pop("isPublished", False)
    if not isinstance(original_publication, bool):
        return _bad_request({"isPublished": "Expected a boolean."})
    payload["isPublished"] = False  # imported browser content always awaits explicit review/publication
    cleaned, errors = _validate_payload(payload, partial=False)
    if errors:
        return _bad_request(errors)

    total_bytes = 0
    decoded_files = []
    try:
        for file_storage in files:
            data, name = _read_upload(file_storage)
            total_bytes += len(data)
            if total_bytes > current_app.config["TIMELINE_MAX_MILESTONE_IMAGE_BYTES"]:
                raise ValueError("Keep combined photos under 40 MB per milestone.")
            _decode_image(data)
            decoded_files.append((data, name))
    except ValueError as error:
        return _bad_request({"images": str(error)})

    admin = request_admin()
    created_images = []
    try:
        refs = list(cleaned.get("images", []))
        for data, name in decoded_files:
            image, reference = _write_private_image(data, name=name, admin=admin)
            db.session.add(image)
            refs.append(reference)
            created_images.append(image)
        cleaned["images"] = refs
        image_error = _managed_image_size_error(refs)
        if image_error:
            raise ValueError(image_error)
        last_order = db.session.scalar(db.select(db.func.max(TimelineMilestone.sort_order)))
        values = {"id": str(uuid4()), "source_id": source_id, "sort_order": (last_order if last_order is not None else -1) + 1}
        field_map = {"isDemo": "is_demo", "isPublished": "is_published"}
        values.update({field_map.get(key, key): value for key, value in cleaned.items()})
        milestone = TimelineMilestone(**values)
        db.session.add(milestone)
        db.session.commit()
    except ValueError as error:
        db.session.rollback()
        for image in created_images:
            if STORAGE_KEY_PATTERN.fullmatch(image.storage_key):
                (_storage_root() / image.storage_key).unlink(missing_ok=True)
        return _bad_request({"images": str(error)})
    except Exception:
        db.session.rollback()
        for image in created_images:
            if STORAGE_KEY_PATTERN.fullmatch(image.storage_key):
                (_storage_root() / image.storage_key).unlink(missing_ok=True)
        # A concurrent retry may have won the unique source_id race.
        existing = db.session.scalar(db.select(TimelineMilestone).where(TimelineMilestone.source_id == source_id))
        if existing:
            return jsonify(imported=False, alreadyImported=True, milestone=_serialize(existing, include_source=True))
        raise
    return jsonify(imported=True, alreadyImported=False, milestone=_serialize(milestone, include_source=True)), 201


@images_api.get("/timeline/images/<image_id>")
def serve_image(image_id: str):
    try:
        canonical_id = str(UUID(image_id))
    except ValueError:
        return jsonify(error="image_not_found"), 404
    image = db.session.get(TimelineImage, canonical_id)
    if image is None:
        return jsonify(error="image_not_found"), 404

    is_admin = authenticate_admin_request() is None
    reference = f"{IMAGE_ROUTE_PREFIX}{image.id}"
    if not is_admin and not _linked_to_published_milestone(reference):
        return jsonify(error="image_not_found"), 404
    path = _image_path(image)
    if path is None:
        return jsonify(error="image_not_found"), 404
    response = send_file(path, mimetype=image.mime_type, download_name=image.original_name, conditional=True)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Cache-Control"] = "private, no-store" if is_admin else "public, max-age=3600"
    return response


def request_admin() -> Admin:
    # @admin_required / the app-wide guard have already populated this value.
    from flask import g

    return g.timeline_admin
