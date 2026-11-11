"""Application factory for the isolated GRID Timeline admin API."""

from __future__ import annotations

import os
import subprocess
from pathlib import Path

from flask import Flask, jsonify, request
from flask_wtf.csrf import CSRFError
from sqlalchemy import event
from sqlalchemy.engine import Engine, make_url

from .config import Config
from .extensions import csrf, db, limiter, migrate


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)

    if not app.config.get("SECRET_KEY"):
        raise RuntimeError("Set TIMELINE_SECRET_KEY before starting the Timeline API.")

    _validate_production_config(app.config)
    database_path, database_existed = _ensure_sqlite_parent(
        app.config["SQLALCHEMY_DATABASE_URI"],
        source_root=Path(app.root_path).resolve().parents[2],
    )

    db.init_app(app)
    if database_path is not None and not database_existed:
        with app.app_context():
            _secure_new_sqlite_file(db.engine, database_path)
    migrate.init_app(app, db, directory=str(Path(app.root_path).parent / "migrations"))
    csrf.init_app(app)
    limiter.init_app(app)

    from . import models  # noqa: F401 - registers models with SQLAlchemy metadata
    from .auth import auth_api, authenticate_admin_request, validate_timeline_write_csrf
    from .cli import register_cli
    from .milestones import milestones_api
    from .images import images_api

    app.register_blueprint(auth_api, url_prefix="/api")
    app.register_blueprint(milestones_api, url_prefix="/api")
    app.register_blueprint(images_api, url_prefix="/api")
    register_cli(app)

    @app.before_request
    def protect_timeline_admin_namespace():
        # Every recognized route under the Timeline /api/admin namespace is
        # protected, including future writes without handler decorators.
        if request.endpoint and (
            request.path == "/api/admin" or request.path.startswith("/api/admin/")
        ):
            return authenticate_admin_request()
        return None

    @app.before_request
    def validate_timeline_write_requests():
        return validate_timeline_write_csrf()

    @app.errorhandler(CSRFError)
    def handle_csrf_error(error: CSRFError):
        return jsonify(error="csrf_failed", message="A valid CSRF token is required."), 400

    @app.errorhandler(429)
    def handle_rate_limit(error):
        return jsonify(error="rate_limited", message="Too many login attempts. Try again later."), 429

    @app.errorhandler(413)
    def handle_payload_too_large(error):
        return jsonify(error="request_too_large", message="Request body exceeds the Timeline API upload limit."), 413

    return app


def _validate_production_config(config) -> None:
    if config.get("TIMELINE_ENV", "development").lower() != "production":
        return
    if not config.get("SESSION_COOKIE_SECURE"):
        raise RuntimeError("Production requires Secure session cookies; verify TIMELINE_ENV=production configuration.")

    storage_uri = config.get("RATELIMIT_STORAGE_URI", "")
    try:
        storage_scheme = make_url(storage_uri).drivername
    except (TypeError, ValueError) as error:
        raise RuntimeError("Production requires a shared Redis rate-limit storage URI.") from error
    if storage_scheme not in {"redis", "rediss"}:
        raise RuntimeError("Production requires shared Redis rate-limit storage; memory:// is development-only.")


def _ensure_sqlite_parent(
    database_uri: str, *, source_root: Path | None = None
) -> tuple[Path | None, bool]:
    url = make_url(database_uri)
    if url.get_backend_name() != "sqlite" or not url.database or url.database == ":memory:":
        return None, True

    path = Path(url.database)
    if not path.is_absolute():
        path = Path.cwd() / path
    path = path.resolve()
    if source_root is not None:
        resolved_source_root = source_root.resolve()
        if path == resolved_source_root or resolved_source_root in path.parents:
            raise RuntimeError("SQLite database files must be stored outside the GRID source repository.")
    parent = path.parent
    missing_directories = []
    candidate = parent
    while not candidate.exists():
        missing_directories.append(candidate)
        candidate = candidate.parent

    for directory in reversed(missing_directories):
        try:
            directory.mkdir(mode=0o700)
        except FileExistsError:
            continue
        _restrict_path_permissions(directory, is_directory=True)

    return path, path.exists()


def _secure_new_sqlite_file(engine: Engine, path: Path) -> None:
    """Restrict a newly-created DB file; leave pre-existing files untouched."""
    def secure_file_permissions(_connection, _record) -> None:
        if path.exists():
            _restrict_path_permissions(path, is_directory=False)

    event.listen(engine, "connect", secure_file_permissions, once=True)


def _restrict_path_permissions(path: Path, *, is_directory: bool) -> None:
    """Restrict new data paths for the current user on POSIX and Windows."""
    if os.name == "nt":
        identity = subprocess.run(
            ["whoami"], check=True, capture_output=True, text=True
        ).stdout.strip()
        if not identity:
            raise RuntimeError("Could not determine the current Windows identity for SQLite permissions.")
        permissions = f"{identity}:(OI)(CI)F" if is_directory else f"{identity}:F"
        subprocess.run(
            ["icacls", str(path), "/inheritance:r", "/grant:r", permissions],
            check=True,
            capture_output=True,
            text=True,
        )
        return

    os.chmod(path, 0o700 if is_directory else 0o600)
