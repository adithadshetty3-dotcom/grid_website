"""Environment-backed configuration for the Timeline-only API."""

from __future__ import annotations

import os
from pathlib import Path


def _default_database_path() -> Path:
    if os.name == "nt":
        base = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
    else:
        base = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share"))
    return base / "grid-timeline" / "timeline-admin.sqlite3"


def _default_upload_path() -> Path:
    if os.name == "nt":
        base = Path(os.environ.get("LOCALAPPDATA", Path.home() / "AppData" / "Local"))
    else:
        base = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local" / "share"))
    return base / "grid-timeline" / "images"


class Config:
    TIMELINE_ENV = os.environ.get("TIMELINE_ENV", "development").strip().lower()
    SECRET_KEY = os.environ.get("TIMELINE_SECRET_KEY")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "TIMELINE_DATABASE_URL", f"sqlite:///{_default_database_path().as_posix()}"
    )
    TIMELINE_UPLOAD_DIR = os.environ.get("TIMELINE_UPLOAD_DIR", str(_default_upload_path()))
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SESSION_COOKIE_NAME = "timeline_csrf"
    SESSION_COOKIE_PATH = "/api"
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = TIMELINE_ENV == "production"
    WTF_CSRF_TIME_LIMIT = 60 * 60 * 8
    # The app factory validates every matched /api/ write centrally with
    # validate_csrf or the session-bound token, including future API blueprints.
    WTF_CSRF_CHECK_DEFAULT = False
    RATELIMIT_STORAGE_URI = os.environ.get("TIMELINE_RATE_LIMIT_STORAGE_URI", "memory://")
    RATELIMIT_HEADERS_ENABLED = True
    ADMIN_SESSION_COOKIE = "timeline_admin_session"
    ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12
    ADMIN_MIN_PASSWORD_LENGTH = 12
    ADMIN_MAX_PASSWORD_LENGTH = 1024
    # Supports one import batch of eight photos at the 40 MB aggregate cap,
    # plus multipart overhead. Each regular upload is separately capped at 10 MB.
    MAX_CONTENT_LENGTH = 42 * 1024 * 1024
    TIMELINE_MAX_IMAGE_BYTES = 10 * 1024 * 1024
    TIMELINE_MAX_MILESTONE_IMAGE_BYTES = 40 * 1024 * 1024
    TIMELINE_MAX_IMAGE_DIMENSION = 8000
    TIMELINE_MAX_IMAGE_PIXELS = 32_000_000
    TIMELINE_MAX_MILESTONE_IMAGES = 8
