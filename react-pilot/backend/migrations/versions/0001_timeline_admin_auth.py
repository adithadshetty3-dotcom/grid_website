"""Create Timeline-local admin accounts and server-side sessions.

Revision ID: 0001_timeline_admin_auth
Revises:
Create Date: 2026-11-10
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_timeline_admin_auth"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "timeline_admins",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(length=80), nullable=False),
        sa.Column("password_hash", sa.String(length=256), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_timeline_admins_username", "timeline_admins", ["username"], unique=True)

    op.create_table(
        "timeline_admin_sessions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("token_hash", sa.String(length=64), nullable=False),
        sa.Column("csrf_token", sa.String(length=64), nullable=False),
        sa.Column("admin_id", sa.Integer(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["admin_id"], ["timeline_admins.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_timeline_admin_sessions_token_hash", "timeline_admin_sessions", ["token_hash"], unique=True)
    op.create_index("ix_timeline_admin_sessions_admin_id", "timeline_admin_sessions", ["admin_id"], unique=False)
    op.create_index("ix_timeline_admin_sessions_expires_at", "timeline_admin_sessions", ["expires_at"], unique=False)


def downgrade():
    op.drop_index("ix_timeline_admin_sessions_expires_at", table_name="timeline_admin_sessions")
    op.drop_index("ix_timeline_admin_sessions_admin_id", table_name="timeline_admin_sessions")
    op.drop_index("ix_timeline_admin_sessions_token_hash", table_name="timeline_admin_sessions")
    op.drop_table("timeline_admin_sessions")
    op.drop_index("ix_timeline_admins_username", table_name="timeline_admins")
    op.drop_table("timeline_admins")
