"""Add private Timeline image metadata and import idempotency keys.

Revision ID: 0004_timeline_private_images
Revises: 0003_timeline_milestones
Create Date: 2026-11-10
"""

from alembic import op
import sqlalchemy as sa

revision = "0004_timeline_private_images"
down_revision = "0003_timeline_milestones"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("timeline_milestones") as batch:
        batch.add_column(sa.Column("source_id", sa.String(length=255), nullable=True))
        batch.create_index("ix_timeline_milestones_source_id", ["source_id"], unique=True)

    op.create_table(
        "timeline_images",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("storage_key", sa.String(length=40), nullable=False),
        sa.Column("original_name", sa.String(length=255), nullable=False),
        sa.Column("mime_type", sa.String(length=32), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("width", sa.Integer(), nullable=False),
        sa.Column("height", sa.Integer(), nullable=False),
        sa.Column("sha256", sa.String(length=64), nullable=False),
        sa.Column("uploaded_by", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint("size_bytes > 0", name="ck_timeline_image_size_positive"),
        sa.CheckConstraint("width > 0 AND height > 0", name="ck_timeline_image_dimensions_positive"),
        sa.ForeignKeyConstraint(["uploaded_by"], ["timeline_admins.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("storage_key"),
    )
    op.create_index("ix_timeline_images_uploaded_by", "timeline_images", ["uploaded_by"], unique=False)


def downgrade():
    op.drop_index("ix_timeline_images_uploaded_by", table_name="timeline_images")
    op.drop_table("timeline_images")
    with op.batch_alter_table("timeline_milestones") as batch:
        batch.drop_index("ix_timeline_milestones_source_id")
        batch.drop_column("source_id")
