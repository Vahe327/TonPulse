"""initial

Revision ID: 001
Revises:
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), nullable=False),
        sa.Column("username", sa.String(255), nullable=True),
        sa.Column("first_name", sa.String(255), nullable=False),
        sa.Column("last_name", sa.String(255), nullable=True),
        sa.Column("photo_url", sa.String(1024), nullable=True),
        sa.Column("wallet_address", sa.String(128), nullable=True),
        sa.Column("language", sa.String(5), server_default="en", nullable=False),
        sa.Column("default_slippage", sa.Numeric(5, 2), server_default="1.0", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_users_wallet_address", "users", ["wallet_address"])

    op.create_table(
        "alerts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("token_address", sa.String(128), nullable=False),
        sa.Column("token_symbol", sa.String(32), nullable=False),
        sa.Column("condition", sa.String(10), nullable=False),
        sa.Column("target_price", sa.Numeric(28, 10), nullable=False),
        sa.Column("current_price_at_creation", sa.Numeric(28, 10), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("is_repeating", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("triggered_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_alerts_user_id", "alerts", ["user_id"])

    op.create_table(
        "transactions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("from_token_address", sa.String(128), nullable=False),
        sa.Column("from_token_symbol", sa.String(32), nullable=False),
        sa.Column("from_amount", sa.Numeric(38, 18), nullable=False),
        sa.Column("to_token_address", sa.String(128), nullable=False),
        sa.Column("to_token_symbol", sa.String(32), nullable=False),
        sa.Column("to_amount", sa.Numeric(38, 18), nullable=False),
        sa.Column("price_impact", sa.Numeric(10, 4), nullable=True),
        sa.Column("tx_hash", sa.String(128), nullable=True),
        sa.Column("status", sa.String(20), server_default="pending", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_transactions_user_id", "transactions", ["user_id"])
    op.create_index("ix_transactions_tx_hash", "transactions", ["tx_hash"])

    op.create_table(
        "cached_tokens",
        sa.Column("address", sa.String(128), nullable=False),
        sa.Column("symbol", sa.String(32), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("decimals", sa.Integer(), nullable=False, server_default="9"),
        sa.Column("icon_url", sa.String(1024), nullable=True),
        sa.Column("description_en", sa.Text(), nullable=True),
        sa.Column("description_ru", sa.Text(), nullable=True),
        sa.Column("market_cap", sa.Numeric(28, 2), nullable=True),
        sa.Column("is_verified", sa.Boolean(), server_default="false", nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("address"),
    )


def downgrade() -> None:
    op.drop_table("cached_tokens")
    op.drop_table("transactions")
    op.drop_table("alerts")
    op.drop_table("users")
