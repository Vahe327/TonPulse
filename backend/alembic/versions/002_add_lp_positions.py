"""add lp_positions table

Revision ID: 002
Revises: 001
Create Date: 2026-03-27
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "lp_positions",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.BigInteger, sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("pool_address", sa.String(128), nullable=False, index=True),
        sa.Column("token_a_address", sa.String(128), nullable=False),
        sa.Column("token_a_symbol", sa.String(32), nullable=False),
        sa.Column("token_b_address", sa.String(128), nullable=False),
        sa.Column("token_b_symbol", sa.String(32), nullable=False),
        sa.Column("lp_amount", sa.Numeric(precision=40, scale=0), nullable=False, server_default="0"),
        sa.Column("token_a_deposited", sa.Numeric(precision=40, scale=0), nullable=False, server_default="0"),
        sa.Column("token_b_deposited", sa.Numeric(precision=40, scale=0), nullable=False, server_default="0"),
        sa.Column("value_usd_at_deposit", sa.Numeric(precision=20, scale=2), nullable=True),
        sa.Column("provision_type", sa.String(32), nullable=False, server_default="Balanced"),
        sa.Column("tx_hash", sa.String(128), nullable=True),
        sa.Column("status", sa.String(16), nullable=False, server_default="active", index=True),
        sa.Column("withdrawn_at", sa.DateTime, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("lp_positions")
