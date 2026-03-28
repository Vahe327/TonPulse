"""add chat_messages table

Revision ID: 003
Revises: 002
Create Date: 2026-03-27
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "chat_messages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.BigInteger, sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("role", sa.String(16), nullable=False),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("actions", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("chat_messages")
