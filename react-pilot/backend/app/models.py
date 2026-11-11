"""Timeline-local admin and server-side authentication session records."""

from __future__ import annotations

from datetime import UTC, datetime

from .extensions import db


class Admin(db.Model):
    __tablename__ = "timeline_admins"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    session_version = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))


class AdminSession(db.Model):
    __tablename__ = "timeline_admin_sessions"

    id = db.Column(db.Integer, primary_key=True)
    token_hash = db.Column(db.String(64), unique=True, nullable=False, index=True)
    csrf_token = db.Column(db.String(64), nullable=False)
    admin_id = db.Column(db.Integer, db.ForeignKey("timeline_admins.id", ondelete="CASCADE"), nullable=False, index=True)
    session_version = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False, index=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))
    admin = db.relationship(Admin, backref=db.backref("sessions", cascade="all, delete-orphan"))


class TimelineMilestone(db.Model):
    """Persistent Timeline content; image values are safe references, not files."""

    __tablename__ = "timeline_milestones"
    __table_args__ = (
        db.CheckConstraint("sort_order >= 0", name="ck_timeline_milestone_sort_order_nonnegative"),
        db.CheckConstraint(
            "category IN ('Events', 'Workshops', 'Achievements', 'Projects', 'Community')",
            name="ck_timeline_milestone_category",
        ),
        db.Index("ix_timeline_milestones_public_order", "is_published", "sort_order", "date", "id"),
    )

    id = db.Column(db.String(36), primary_key=True)
    title = db.Column(db.String(90), nullable=False)
    category = db.Column(db.String(24), nullable=False)
    date = db.Column(db.String(10), nullable=False)
    time = db.Column(db.String(5), nullable=False, default="", server_default="")
    location = db.Column(db.String(100), nullable=False, default="", server_default="")
    summary = db.Column(db.String(180), nullable=False)
    description = db.Column(db.String(6000), nullable=False)
    source_id = db.Column(db.String(255), unique=True, nullable=True, index=True)
    images = db.Column(db.JSON, nullable=False, default=list)
    is_demo = db.Column(db.Boolean, nullable=False, default=False, server_default=db.false())
    is_published = db.Column(db.Boolean, nullable=False, default=False, server_default=db.false())
    sort_order = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))
    updated_at = db.Column(
        db.DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )


class TimelineImage(db.Model):
    """Private Timeline image metadata; files live outside the source tree."""

    __tablename__ = "timeline_images"
    __table_args__ = (
        db.CheckConstraint("size_bytes > 0", name="ck_timeline_image_size_positive"),
        db.CheckConstraint("width > 0 AND height > 0", name="ck_timeline_image_dimensions_positive"),
    )

    id = db.Column(db.String(36), primary_key=True)
    storage_key = db.Column(db.String(40), unique=True, nullable=False)
    original_name = db.Column(db.String(255), nullable=False)
    mime_type = db.Column(db.String(32), nullable=False)
    size_bytes = db.Column(db.Integer, nullable=False)
    width = db.Column(db.Integer, nullable=False)
    height = db.Column(db.Integer, nullable=False)
    sha256 = db.Column(db.String(64), nullable=False)
    uploaded_by = db.Column(db.Integer, db.ForeignKey("timeline_admins.id", ondelete="RESTRICT"), nullable=False, index=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC))
