"""Timeline-local admin security operations.

Callers should commit these changes in the same transaction as any related
account update. Session versions ensure a session cannot be revived by merely
reactivating an admin after a deactivation.
"""

from __future__ import annotations

from flask import current_app
from werkzeug.security import generate_password_hash

from .extensions import db
from .models import Admin, AdminSession


def revoke_admin_sessions(admin: Admin) -> int:
    """Revoke all stored sessions and advance the admin's session version."""
    admin.session_version += 1
    result = db.session.execute(
        db.delete(AdminSession).where(AdminSession.admin_id == admin.id)
    )
    return int(result.rowcount or 0)


def set_admin_active(admin: Admin, is_active: bool) -> None:
    """Change account activity and invalidate its sessions atomically."""
    if admin.is_active != is_active:
        admin.is_active = is_active
        revoke_admin_sessions(admin)


def change_admin_password(admin: Admin, password: str) -> None:
    """Set a new password and revoke sessions using the previous credential."""
    minimum = current_app.config["ADMIN_MIN_PASSWORD_LENGTH"]
    maximum = current_app.config["ADMIN_MAX_PASSWORD_LENGTH"]
    if not isinstance(password, str) or not minimum <= len(password) <= maximum:
        raise ValueError(f"Password must be between {minimum} and {maximum} characters.")

    admin.password_hash = generate_password_hash(password, method="scrypt")
    revoke_admin_sessions(admin)
