"""Create persistent Timeline milestone content.

Revision ID: 0003_timeline_milestones
Revises: 0002_admin_session_revocation
Create Date: 2026-11-10
"""

from alembic import op
import sqlalchemy as sa

revision = "0003_timeline_milestones"
down_revision = "0002_admin_session_revocation"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "timeline_milestones",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("title", sa.String(length=90), nullable=False),
        sa.Column("category", sa.String(length=24), nullable=False),
        sa.Column("date", sa.String(length=10), nullable=False),
        sa.Column("time", sa.String(length=5), server_default="", nullable=False),
        sa.Column("location", sa.String(length=100), server_default="", nullable=False),
        sa.Column("summary", sa.String(length=180), nullable=False),
        sa.Column("description", sa.String(length=6000), nullable=False),
        sa.Column("images", sa.JSON(), nullable=False),
        sa.Column("is_demo", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("is_published", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.Column("sort_order", sa.Integer(), server_default="0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("sort_order >= 0", name="ck_timeline_milestone_sort_order_nonnegative"),
        sa.CheckConstraint(
            "category IN ('Events', 'Workshops', 'Achievements', 'Projects', 'Community')",
            name="ck_timeline_milestone_category",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_timeline_milestones_public_order",
        "timeline_milestones",
        ["is_published", "sort_order", "date", "id"],
        unique=False,
    )


def downgrade():
    op.drop_index("ix_timeline_milestones_public_order", table_name="timeline_milestones")
    op.drop_table("timeline_milestones")
