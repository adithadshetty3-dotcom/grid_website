"""Add per-admin session versions for credential revocation.

Revision ID: 0002_admin_session_revocation
Revises: 0001_timeline_admin_auth
Create Date: 2026-11-10
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_admin_session_revocation"
down_revision = "0001_timeline_admin_auth"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "timeline_admins",
        sa.Column("session_version", sa.Integer(), server_default="0", nullable=False),
    )
    op.add_column(
        "timeline_admin_sessions",
        sa.Column("session_version", sa.Integer(), server_default="0", nullable=False),
    )


def downgrade():
    op.drop_column("timeline_admin_sessions", "session_version")
    op.drop_column("timeline_admins", "session_version")
