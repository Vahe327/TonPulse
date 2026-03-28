import json
import logging
import time
import base64
from decimal import Decimal
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.redis_client import get_redis
from app.services.stonfi_service import stonfi_service
from app.services.price_service import price_service
from app.models.lp_position import LPPosition
from app.schemas.liquidity import (
    PoolTokenInfo,
    PoolResponse,
    PoolListResponse,
    LiquiditySimulateRequest,
    LiquiditySimulateResponse,
    LiquidityBuildRequest,
    LiquidityBuildResponse,
    RefundBuildRequest,
    LPPositionResponse,
    LPPositionsResponse,
)

logger = logging.getLogger(__name__)

POOLS_CACHE_KEY = "pools:list"
POOLS_CACHE_TTL = 60
POOL_DETAIL_CACHE_PREFIX = "pool:"
POOL_DETAIL_CACHE_TTL = 60
MIN_TVL_USD = 100.0


class LiquidityService:
    async def _build_asset_lookup(self) -> dict[str, dict]:
        r = get_redis()
        cached = await r.get("liquidity:asset_lookup")
        if cached:
            return json.loads(cached)

        try:
            assets = await stonfi_service.get_assets()
        except Exception as e:
            logger.error("Failed to fetch STON.fi assets for lookup: %s", e)
            return {}

        lookup: dict[str, dict] = {}
        for asset in assets:
            address = asset.get("contract_address", "")
            if not address:
                continue
            lookup[address] = {
                "symbol": asset.get("symbol", ""),
                "name": asset.get("display_name", asset.get("name", "")),
                "icon_url": asset.get("image_url", ""),
                "decimals": int(asset.get("decimals", 9)),
            }

        await r.setex("liquidity:asset_lookup", 120, json.dumps(lookup))
        return lookup

    def _token_info_from_lookup(
        self, address: str, lookup: dict[str, dict]
    ) -> PoolTokenInfo:
        meta = lookup.get(address, {})
        return PoolTokenInfo(
            address=address,
            symbol=meta.get("symbol", address[:8]),
            name=meta.get("name", "Unknown"),
            icon_url=meta.get("icon_url") or None,
            decimals=meta.get("decimals", 9),
        )

    def _calculate_apr_24h(self, volume_24h_usd: float, fee_rate: float, tvl_usd: float) -> float:
        if tvl_usd <= 0:
            return 0.0
        daily_fees = volume_24h_usd * fee_rate
        apr = (daily_fees * 365) / tvl_usd * 100
        return round(apr, 2)

    def _parse_pool(self, raw_pool: dict, lookup: dict[str, dict]) -> Optional[PoolResponse]:
        address = raw_pool.get("address", "")
        if not address:
            return None

        token0_addr = raw_pool.get("token0_address", "")
        token1_addr = raw_pool.get("token1_address", "")
        if not token0_addr or not token1_addr:
            return None

        tvl_usd_raw = raw_pool.get("lp_total_supply_usd")
        tvl_usd = float(tvl_usd_raw) if tvl_usd_raw else 0.0
        if tvl_usd < MIN_TVL_USD:
            return None

        volume_24h_raw = raw_pool.get("volume_24h_usd")
        volume_24h_usd = float(volume_24h_raw) if volume_24h_raw else 0.0

        lp_fee_raw = raw_pool.get("lp_fee", "30")
        lp_fee_bps = float(lp_fee_raw) if lp_fee_raw else 30
        fee_rate = lp_fee_bps / 10000
        fee_rate_str = f"{fee_rate:.4f}"

        apy_1d = raw_pool.get("apy_1d")
        apy_7d = raw_pool.get("apy_7d")
        apy_30d = raw_pool.get("apy_30d")

        apr_24h = round(float(apy_1d) * 100, 2) if apy_1d is not None else self._calculate_apr_24h(
            volume_24h_usd, fee_rate, tvl_usd
        )
        apr_7d = round(float(apy_7d) * 100, 2) if apy_7d is not None else None
        apr_30d = round(float(apy_30d) * 100, 2) if apy_30d is not None else None

        reserve0 = raw_pool.get("reserve0", "0")
        reserve1 = raw_pool.get("reserve1", "0")
        lp_total_supply = raw_pool.get("lp_total_supply", "0")
        deprecated = bool(raw_pool.get("deprecated", False))

        token_a = self._token_info_from_lookup(token0_addr, lookup)
        token_b = self._token_info_from_lookup(token1_addr, lookup)

        return PoolResponse(
            address=address,
            token_a=token_a,
            token_b=token_b,
            tvl_usd=tvl_usd,
            volume_24h_usd=volume_24h_usd,
            volume_7d_usd=None,
            fee_rate=fee_rate_str,
            apr_24h=apr_24h,
            apr_7d=apr_7d,
            apr_30d=apr_30d,
            token_a_reserve=str(reserve0),
            token_b_reserve=str(reserve1),
            lp_total_supply=str(lp_total_supply),
            pool_type="constant_product",
            deprecated=deprecated,
        )

    async def get_pools(
        self,
        search: Optional[str] = None,
        sort_by: str = "tvl_usd",
        sort_order: str = "desc",
        limit: int = 50,
        offset: int = 0,
    ) -> PoolListResponse:
        r = get_redis()

        cached_raw = await r.get(POOLS_CACHE_KEY)
        if cached_raw:
            all_pools_data = json.loads(cached_raw)
        else:
            all_pools_data = await self._fetch_and_cache_pools(r)

        pools = [PoolResponse(**p) for p in all_pools_data]

        if search:
            search_lower = search.lower().strip()
            filtered = []
            for pool in pools:
                token_a_match = (
                    search_lower in pool.token_a.symbol.lower()
                    or search_lower in pool.token_a.name.lower()
                    or search_lower in pool.token_a.address.lower()
                )
                token_b_match = (
                    search_lower in pool.token_b.symbol.lower()
                    or search_lower in pool.token_b.name.lower()
                    or search_lower in pool.token_b.address.lower()
                )
                pair_match = search_lower in f"{pool.token_a.symbol}/{pool.token_b.symbol}".lower()
                if token_a_match or token_b_match or pair_match:
                    filtered.append(pool)
            pools = filtered

        sort_key_map = {
            "tvl_usd": lambda p: p.tvl_usd,
            "volume_24h_usd": lambda p: p.volume_24h_usd,
            "apr_24h": lambda p: p.apr_24h,
            "fee_rate": lambda p: float(p.fee_rate) if p.fee_rate else 0.0,
        }
        key_fn = sort_key_map.get(sort_by, sort_key_map["tvl_usd"])
        reverse = sort_order.lower() == "desc"
        pools.sort(key=key_fn, reverse=reverse)

        total = len(pools)
        paginated = pools[offset : offset + limit]

        return PoolListResponse(
            pools=paginated,
            total=total,
            offset=offset,
            limit=limit,
        )

    async def _fetch_and_cache_pools(self, r) -> list[dict]:
        lookup = await self._build_asset_lookup()

        try:
            raw_pools = await stonfi_service.get_pools()
        except Exception as e:
            logger.error("Failed to fetch STON.fi pools: %s", e)
            return []

        parsed: list[PoolResponse] = []
        for raw_pool in raw_pools:
            pool_response = self._parse_pool(raw_pool, lookup)
            if pool_response is not None:
                parsed.append(pool_response)

        parsed.sort(key=lambda p: p.tvl_usd, reverse=True)

        serialized = [p.model_dump() for p in parsed]
        await r.setex(POOLS_CACHE_KEY, POOLS_CACHE_TTL, json.dumps(serialized))

        return serialized

    async def get_pool(self, address: str) -> Optional[PoolResponse]:
        r = get_redis()

        cached = await r.get(f"{POOL_DETAIL_CACHE_PREFIX}{address}")
        if cached:
            return PoolResponse(**json.loads(cached))

        cached_list_raw = await r.get(POOLS_CACHE_KEY)
        if cached_list_raw:
            all_pools_data = json.loads(cached_list_raw)
            for pool_data in all_pools_data:
                if pool_data.get("address") == address:
                    pool = PoolResponse(**pool_data)
                    await r.setex(
                        f"{POOL_DETAIL_CACHE_PREFIX}{address}",
                        POOL_DETAIL_CACHE_TTL,
                        json.dumps(pool.model_dump()),
                    )
                    return pool

        lookup = await self._build_asset_lookup()
        try:
            raw_pools = await stonfi_service.get_pools()
        except Exception as e:
            logger.error("Failed to fetch STON.fi pools for detail: %s", e)
            return None

        for raw_pool in raw_pools:
            if raw_pool.get("address") == address:
                pool = self._parse_pool(raw_pool, lookup)
                if pool is not None:
                    await r.setex(
                        f"{POOL_DETAIL_CACHE_PREFIX}{address}",
                        POOL_DETAIL_CACHE_TTL,
                        json.dumps(pool.model_dump()),
                    )
                return pool

        return None

    async def simulate_provision(
        self, request: LiquiditySimulateRequest
    ) -> LiquiditySimulateResponse:
        client = await stonfi_service._get_client()

        slippage_decimal = Decimal(request.slippage)
        if slippage_decimal >= 1:
            slippage_tolerance = str(slippage_decimal / 100)
        else:
            slippage_tolerance = str(slippage_decimal)

        params = {
            "offer_address": request.token_a_address,
            "ask_address": request.token_b_address,
            "units": request.token_a_amount,
            "slippage_tolerance": slippage_tolerance,
        }

        response = await client.post("/v1/liquidity/provide/simulate", params=params)
        response.raise_for_status()
        data = response.json()

        token_a_units = data.get("offer_units", request.token_a_amount)
        token_b_units = data.get("ask_units", request.token_b_amount)
        estimated_lp = data.get("lp_units", "0")
        min_lp = data.get("min_lp_units", "0")
        price_impact = data.get("price_impact", "0")
        pool_address = data.get("pool_address", request.pool_address)

        token_a_price_data = await price_service.get_token_price(request.token_a_address)
        token_b_price_data = await price_service.get_token_price(request.token_b_address)

        token_a_price_usd = float(token_a_price_data.get("price_usd", "0")) if token_a_price_data else 0.0
        token_b_price_usd = float(token_b_price_data.get("price_usd", "0")) if token_b_price_data else 0.0

        token_a_decimals = 9
        token_b_decimals = 9
        if token_a_price_data:
            token_a_decimals = int(token_a_price_data.get("decimals", 9))
        if token_b_price_data:
            token_b_decimals = int(token_b_price_data.get("decimals", 9))

        token_a_human = int(token_a_units) / (10 ** token_a_decimals) if token_a_units != "0" else 0.0
        token_b_human = int(token_b_units) / (10 ** token_b_decimals) if token_b_units != "0" else 0.0

        token_a_value_usd = round(token_a_human * token_a_price_usd, 2)
        token_b_value_usd = round(token_b_human * token_b_price_usd, 2)
        total_value_usd = round(token_a_value_usd + token_b_value_usd, 2)

        share_of_pool = data.get("share_of_pool", "0")
        if not share_of_pool or share_of_pool == "0":
            lp_total_str = data.get("lp_total_supply", "0")
            lp_total = int(lp_total_str) if lp_total_str and lp_total_str != "0" else 0
            est_lp = int(estimated_lp) if estimated_lp and estimated_lp != "0" else 0
            if lp_total > 0 and est_lp > 0:
                share = (est_lp / (lp_total + est_lp)) * 100
                share_of_pool = f"{share:.4f}"
            else:
                share_of_pool = "0"

        return LiquiditySimulateResponse(
            provision_type=request.provision_type,
            pool_address=pool_address,
            token_a_units=str(token_a_units),
            token_b_units=str(token_b_units),
            estimated_lp_tokens=str(estimated_lp),
            min_lp_tokens=str(min_lp),
            price_impact=str(price_impact),
            share_of_pool=str(share_of_pool),
            token_a_value_usd=token_a_value_usd,
            token_b_value_usd=token_b_value_usd,
            total_value_usd=total_value_usd,
        )

    async def build_provision_transaction(
        self, request: LiquidityBuildRequest
    ) -> LiquidityBuildResponse:
        simulate_request = LiquiditySimulateRequest(
            token_a_address=request.token_a_address,
            token_b_address=request.token_b_address,
            token_a_amount=request.token_a_amount,
            token_b_amount=request.token_b_amount,
            provision_type=request.provision_type,
            pool_address=request.pool_address,
            slippage=request.slippage,
            sender_address=request.sender_address,
        )
        simulation = await self.simulate_provision(simulate_request)

        router_address = stonfi_service.router_address
        valid_until = int(time.time()) + 600

        forward_amount = "300000000"
        from app.utils.constants import TON_NATIVE_ADDRESS

        token_a_is_ton = request.token_a_address == TON_NATIVE_ADDRESS
        token_b_is_ton = request.token_b_address == TON_NATIVE_ADDRESS

        messages = []

        if token_a_is_ton:
            total_amount_a = str(int(request.token_a_amount) + int(forward_amount))
        else:
            total_amount_a = forward_amount

        payload_a = self._build_provide_payload(
            token_address=request.token_a_address,
            amount=request.token_a_amount,
            min_lp_out=simulation.min_lp_tokens,
            sender_address=request.sender_address,
            is_token_a=True,
        )
        messages.append({
            "address": router_address,
            "amount": total_amount_a,
            "payload": payload_a,
        })

        if simulation.token_b_units != "0" and int(simulation.token_b_units) > 0:
            if token_b_is_ton:
                total_amount_b = str(int(simulation.token_b_units) + int(forward_amount))
            else:
                total_amount_b = forward_amount

            payload_b = self._build_provide_payload(
                token_address=request.token_b_address,
                amount=simulation.token_b_units,
                min_lp_out="0",
                sender_address=request.sender_address,
                is_token_a=False,
            )
            messages.append({
                "address": router_address,
                "amount": total_amount_b,
                "payload": payload_b,
            })

        return LiquidityBuildResponse(
            messages=messages,
            valid_until=valid_until,
        )

    def _build_provide_payload(
        self,
        token_address: str,
        amount: str,
        min_lp_out: str,
        sender_address: str,
        is_token_a: bool,
    ) -> str:
        op_code = 0x37C096DF
        query_id = int(time.time())

        payload_parts = [
            op_code.to_bytes(4, "big"),
            query_id.to_bytes(8, "big"),
            int(amount).to_bytes(16, "big"),
            token_address.encode("utf-8")[:48].ljust(48, b"\x00"),
            int(min_lp_out).to_bytes(16, "big"),
            sender_address.encode("utf-8")[:48].ljust(48, b"\x00"),
            (1 if is_token_a else 0).to_bytes(1, "big"),
        ]

        payload_bytes = b"".join(payload_parts)
        return base64.b64encode(payload_bytes).decode("ascii")

    async def build_refund_transaction(
        self, request: RefundBuildRequest
    ) -> LiquidityBuildResponse:
        router_address = stonfi_service.router_address
        valid_until = int(time.time()) + 600
        forward_amount = "300000000"

        payload = self._build_burn_payload(
            pool_address=request.pool_address,
            lp_amount=request.lp_amount,
            min_token_a_out=request.min_token_a_out,
            min_token_b_out=request.min_token_b_out,
            sender_address=request.sender_address,
        )

        messages = [
            {
                "address": router_address,
                "amount": forward_amount,
                "payload": payload,
            }
        ]

        return LiquidityBuildResponse(
            messages=messages,
            valid_until=valid_until,
        )

    def _build_burn_payload(
        self,
        pool_address: str,
        lp_amount: str,
        min_token_a_out: str,
        min_token_b_out: str,
        sender_address: str,
    ) -> str:
        op_code = 0x595F07BC
        query_id = int(time.time())

        payload_parts = [
            op_code.to_bytes(4, "big"),
            query_id.to_bytes(8, "big"),
            int(lp_amount).to_bytes(16, "big"),
            pool_address.encode("utf-8")[:48].ljust(48, b"\x00"),
            int(min_token_a_out).to_bytes(16, "big"),
            int(min_token_b_out).to_bytes(16, "big"),
            sender_address.encode("utf-8")[:48].ljust(48, b"\x00"),
        ]

        payload_bytes = b"".join(payload_parts)
        return base64.b64encode(payload_bytes).decode("ascii")

    async def get_user_positions(
        self, wallet_address: str, db: AsyncSession
    ) -> LPPositionsResponse:
        from app.models.user import User

        user_stmt = select(User).where(User.wallet_address == wallet_address)
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()

        if user is None:
            return LPPositionsResponse(
                positions=[],
                total_value_usd=0.0,
                total_fees_earned_usd=0.0,
            )

        positions_stmt = (
            select(LPPosition)
            .where(LPPosition.user_id == user.id)
            .where(LPPosition.status == "active")
            .order_by(LPPosition.created_at.desc())
        )
        result = await db.execute(positions_stmt)
        db_positions = result.scalars().all()

        if not db_positions:
            return LPPositionsResponse(
                positions=[],
                total_value_usd=0.0,
                total_fees_earned_usd=0.0,
            )

        pool_addresses = list({pos.pool_address for pos in db_positions})
        pool_data_map: dict[str, PoolResponse] = {}
        for pool_addr in pool_addresses:
            pool = await self.get_pool(pool_addr)
            if pool is not None:
                pool_data_map[pool_addr] = pool

        positions: list[LPPositionResponse] = []
        total_value_usd = 0.0
        total_fees_earned_usd = 0.0

        for db_pos in db_positions:
            pool = pool_data_map.get(db_pos.pool_address)

            if pool is not None:
                token_a = pool.token_a
                token_b = pool.token_b
                lp_total = int(pool.lp_total_supply) if pool.lp_total_supply and pool.lp_total_supply != "0" else 0
                user_lp = int(db_pos.lp_amount) if db_pos.lp_amount else 0

                if lp_total > 0 and user_lp > 0:
                    share = user_lp / lp_total
                    share_str = f"{share * 100:.6f}"

                    token_a_amount = str(int(float(pool.token_a_reserve) * share))
                    token_b_amount = str(int(float(pool.token_b_reserve) * share))

                    current_value_usd = round(pool.tvl_usd * share, 2)
                else:
                    share_str = "0"
                    token_a_amount = "0"
                    token_b_amount = "0"
                    current_value_usd = 0.0

                deposited_value = float(db_pos.value_usd_at_deposit) if db_pos.value_usd_at_deposit else 0.0
                if deposited_value > 0 and current_value_usd > 0:
                    pnl_usd = round(current_value_usd - deposited_value, 2)
                    pnl_percent = round((pnl_usd / deposited_value) * 100, 2)
                else:
                    pnl_usd = None
                    pnl_percent = None

                fees_earned_usd = None
                if pnl_usd is not None and pnl_usd > 0:
                    fees_earned_usd = round(pnl_usd * 0.5, 2)

                if fees_earned_usd is not None:
                    total_fees_earned_usd += fees_earned_usd
            else:
                token_a = PoolTokenInfo(
                    address=db_pos.token_a_address,
                    symbol=db_pos.token_a_symbol,
                    name=db_pos.token_a_symbol,
                )
                token_b = PoolTokenInfo(
                    address=db_pos.token_b_address,
                    symbol=db_pos.token_b_symbol,
                    name=db_pos.token_b_symbol,
                )
                share_str = "0"
                token_a_amount = "0"
                token_b_amount = "0"
                current_value_usd = float(db_pos.value_usd_at_deposit) if db_pos.value_usd_at_deposit else 0.0
                pnl_usd = None
                pnl_percent = None
                fees_earned_usd = None

            total_value_usd += current_value_usd

            position = LPPositionResponse(
                pool_address=db_pos.pool_address,
                token_a=token_a,
                token_b=token_b,
                lp_balance=str(db_pos.lp_amount),
                share_of_pool=share_str,
                token_a_amount=token_a_amount,
                token_b_amount=token_b_amount,
                total_value_usd=current_value_usd,
                pnl_usd=pnl_usd,
                pnl_percent=pnl_percent,
                fees_earned_usd=fees_earned_usd,
                provision_type=db_pos.provision_type,
                added_at=db_pos.created_at.isoformat() if db_pos.created_at else None,
            )
            positions.append(position)

        return LPPositionsResponse(
            positions=positions,
            total_value_usd=round(total_value_usd, 2),
            total_fees_earned_usd=round(total_fees_earned_usd, 2),
        )


liquidity_service = LiquidityService()
