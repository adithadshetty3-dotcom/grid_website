"""Timeline-only authentication endpoints and server-side access checks."""

from __future__ import annotations

import hashlib
import hmac
import re
import secrets
from datetime import UTC, datetime, timedelta
from functools import wraps

from flask import Blueprint, current_app, g, jsonify, request, session
from flask_limiter.util import get_remote_address
from flask_wtf.csrf import generate_csrf, validate_csrf
from wtforms.validators import ValidationError
from werkzeug.security import check_password_hash

from .extensions import csrf, db, limiter
from .models import Admin, AdminSession

auth_api = Blueprint("timeline_auth", __name__)
csrf.exempt(auth_api)
USERNAME_PATTERN = re.compile(r"^[A-Za-z0-9._-]{1,80}$")
DUMMY_PASSWORD_HASH = (
    "scrypt:32768:8:1$1a4R2uWgjUY2NeqF$"
    "c26be3a6d4de2ff0592b2aeb3d8a0478cbc28f4671e5efb278c7b91efaa27a44"
    "b969b662bfa8b4f64d157d363807fd7db7f1e2eb8b47adb84b52226bd314fa2b"
)


def _token_digest(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _login_rate_limit_key() -> str:
    username = request.get_json(silent=True)
    if not isinstance(username, dict):
        username = {}
    normalized_username = str(username.get("username", "")).strip().casefold()[:80]
    return f"{get_remote_address()}:{normalized_username}"


def authenticate_admin_request():
    """Load a valid, unexpired session for an active admin without mutations."""
    token = request.cookies.get(current_app.config["ADMIN_SESSION_COOKIE"])
    if not token:
        return jsonify(error="authentication_required"), 401

    admin_session = db.session.scalar(
        db.select(AdminSession).where(AdminSession.token_hash == _token_digest(token))
    )
    if not admin_session:
        return jsonify(error="authentication_required"), 401

    expiry = admin_session.expires_at
    if expiry.tzinfo is None:
        expiry = expiry.replace(tzinfo=UTC)
    if (
        expiry <= datetime.now(UTC)
        or not admin_session.admin.is_active
        or admin_session.session_version != admin_session.admin.session_version
    ):
        return jsonify(error="authentication_required"), 401

    g.timeline_admin = admin_session.admin
    g.timeline_admin_session = admin_session
    return None


def admin_required(view):
    """Reusable authorization decorator for Timeline admin operations."""
    @wraps(view)
    def wrapped(*args, **kwargs):
        denied = authenticate_admin_request()
        if denied is not None:
            return denied
        return view(*args, **kwargs)

    return wrapped


@auth_api.get("/auth/csrf")
def csrf_token():
    return jsonify(csrf_token=generate_csrf())


@auth_api.get("/auth/session")
def current_session():
    if authenticate_admin_request() is not None:
        return jsonify(authenticated=False)

    # The session credential remains HttpOnly. The session-bound CSRF value is
    # intentionally readable by the authenticated UI so it can resume writes
    # after a refresh without persisting credentials in browser storage.
    return jsonify(
        authenticated=True,
        admin={"id": g.timeline_admin.id, "username": g.timeline_admin.username},
        csrf_token=g.timeline_admin_session.csrf_token,
    )


@auth_api.post("/auth/login")
@limiter.limit("20 per minute", key_func=get_remote_address)
@limiter.limit("5 per minute", key_func=_login_rate_limit_key)
def login():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        payload = {}
    username = payload.get("username")
    password = payload.get("password")
    if (
        not isinstance(username, str)
        or not USERNAME_PATTERN.fullmatch(username.strip())
        or not isinstance(password, str)
        or len(password) > current_app.config["ADMIN_MAX_PASSWORD_LENGTH"]
    ):
        return jsonify(error="invalid_credentials"), 401

    admin = db.session.scalar(
        db.select(Admin).where(db.func.lower(Admin.username) == username.strip().lower())
    )
    password_hash = admin.password_hash if admin else DUMMY_PASSWORD_HASH
    password_matches = check_password_hash(password_hash, password)
    if not admin or not admin.is_active or not password_matches:
        return jsonify(error="invalid_credentials"), 401

    raw_token = secrets.token_urlsafe(32)
    csrf_token_value = secrets.token_urlsafe(32)
    admin_session = AdminSession(
        token_hash=_token_digest(raw_token),
        csrf_token=csrf_token_value,
        admin=admin,
        session_version=admin.session_version,
        expires_at=datetime.now(UTC) + timedelta(seconds=current_app.config["ADMIN_SESSION_TTL_SECONDS"]),
    )
    db.session.add(admin_session)
    db.session.commit()

    # Authentication is carried only by the opaque, revocable database token.
    # The Flask cookie session is used only by Flask-WTF to protect login CSRF.
    session.clear()
    response = jsonify(authenticated=True, admin={"id": admin.id, "username": admin.username}, csrf_token=csrf_token_value)
    response.set_cookie(
        current_app.config["ADMIN_SESSION_COOKIE"],
        raw_token,
        max_age=current_app.config["ADMIN_SESSION_TTL_SECONDS"],
        httponly=True,
        secure=current_app.config["SESSION_COOKIE_SECURE"],
        samesite="Lax",
        path="/api",
    )
    return response


@auth_api.post("/auth/logout")
@admin_required
def logout():
    db.session.delete(g.timeline_admin_session)
    db.session.commit()
    session.clear()
    response = jsonify(authenticated=False)
    response.delete_cookie(
        current_app.config["ADMIN_SESSION_COOKIE"],
        path="/api",
        secure=current_app.config["SESSION_COOKIE_SECURE"],
        httponly=True,
        samesite="Lax",
    )
    return response


@auth_api.get("/admin/ping")
@admin_required
def admin_ping():
    return jsonify(ok=True, admin={"id": g.timeline_admin.id, "username": g.timeline_admin.username})


def validate_timeline_write_csrf():
    """Validate write tokens independently of the admin authorization guard."""
    if not request.endpoint or not request.path.startswith("/api/"):
        return None
    if request.method not in {"GET", "HEAD", "OPTIONS"}:
        if request.endpoint == "timeline_auth.login":
            try:
                validate_csrf(request.headers.get("X-CSRFToken", ""))
            except ValidationError:
                return jsonify(error="csrf_failed", message="A valid CSRF token is required."), 400
            return None

        token = request.cookies.get(current_app.config["ADMIN_SESSION_COOKIE"])
        if not token:
            return jsonify(error="authentication_required"), 401

        admin_session = getattr(g, "timeline_admin_session", None)
        if admin_session is None:
            admin_session = db.session.scalar(
                db.select(AdminSession).where(AdminSession.token_hash == _token_digest(token))
            )
        if not admin_session:
            return jsonify(error="authentication_required"), 401

        submitted = request.headers.get("X-CSRFToken", "")
        if not hmac.compare_digest(admin_session.csrf_token, submitted):
            return jsonify(error="csrf_failed", message="A valid CSRF token is required."), 400


# This blueprint uses the same Flask-WTF signed token validator explicitly for
# pre-login CSRF. Authenticated writes use the per-database-session token, so
# logout and future admin writes remain bound to the server-side auth session.
