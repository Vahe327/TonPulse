import asyncio
import base64
import httpx
import logging
import time
from decimal import Decimal
from typing import Optional

from pytoniq import LiteBalancer
from stonfi import RouterV1

from app.config import settings
from app.utils.constants import (
    STONFI_API_BASE,
    STONFI_ASSETS_ENDPOINT,
    STONFI_POOLS_ENDPOINT,
    STONFI_SWAP_SIMULATE_ENDPOINT,
    TON_NATIVE_ADDRESS,
)
from app.utils.formatting import amount_to_nano, nano_to_amount

logger = logging.getLogger(__name__)


class StonfiService:
    def __init__(self):
        self.base_url = settings.stonfi_api_url or STONFI_API_BASE
        self.router_address = settings.stonfi_router_address
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                timeout=httpx.Timeout(30.0),
                headers={"Accept": "application/json"},
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def get_assets(self) -> list[dict]:
        client = await self._get_client()
        response = await client.get(STONFI_ASSETS_ENDPOINT)
        response.raise_for_status()
        data = response.json()
        return data.get("asset_list", [])

    async def get_pools(self) -> list[dict]:
        client = await self._get_client()
        response = await client.get(STONFI_POOLS_ENDPOINT)
        response.raise_for_status()
        data = response.json()
        return data.get("pool_list", [])

    async def simulate_swap(
        self,
        offer_address: str,
        ask_address: str,
        amount: str,
        slippage_tolerance: Decimal = Decimal("0.01"),
    ) -> dict:
        client = await self._get_client()
        params = {
            "offer_address": offer_address,
            "ask_address": ask_address,
            "units": amount,
            "slippage_tolerance": str(slippage_tolerance / 100),
        }
        response = await client.post(STONFI_SWAP_SIMULATE_ENDPOINT, params=params)
        response.raise_for_status()
        data = response.json()
        return data

    async def get_swap_quote(
        self,
        from_address: str,
        to_address: str,
        amount: str,
        slippage: Decimal = Decimal("1.0"),
    ) -> dict:
        simulation = await self.simulate_swap(
            offer_address=from_address,
            ask_address=to_address,
            amount=amount,
            slippage_tolerance=slippage,
        )

        offer_units = simulation.get("offer_units", amount)
        ask_units = simulation.get("ask_units", "0")
        min_ask_units = simulation.get("min_ask_units", "0")
        swap_rate = simulation.get("swap_rate", "0")
        price_impact = simulation.get("price_impact", "0")
        fee = simulation.get("fee_units", "0")
        route = simulation.get("route", [])

        route_symbols = []
        for step in route:
            if isinstance(step, dict):
                route_symbols.append(step.get("symbol", step.get("address", "")))
            elif isinstance(step, str):
                route_symbols.append(step)

        if not route_symbols:
            route_symbols = [from_address, to_address]

        return {
            "from_amount": offer_units,
            "to_amount": ask_units,
            "min_to_amount": min_ask_units,
            "price_impact": price_impact,
            "route": route_symbols,
            "swap_rate": swap_rate,
            "fee": fee,
            "provider": "STON.fi",
        }

    async def _get_lite_client(self) -> LiteBalancer:
        provider = LiteBalancer.from_mainnet_config(trust_level=1)
        await provider.start_up()
        return provider

    async def build_swap_transaction(
        self,
        from_address: str,
        to_address: str,
        amount: str,
        slippage: Decimal,
        sender_address: str,
    ) -> dict:
        simulation = await self.simulate_swap(
            offer_address=from_address,
            ask_address=to_address,
            amount=amount,
            slippage_tolerance=slippage,
        )

        min_ask_units = int(simulation.get("min_ask_units", "0"))
        offer_amount = int(amount)
        valid_until = int(time.time()) + 600

        provider = None
        try:
            provider = await self._get_lite_client()
            router = RouterV1(self.router_address)

            if from_address == TON_NATIVE_ADDRESS:
                tx_params = await router.build_swap_ton_to_jetton_tx_params(
                    user_wallet_address=sender_address,
                    ask_jetton_address=to_address,
                    offer_amount=offer_amount,
                    min_ask_amount=min_ask_units,
                    provider=provider,
                )
            elif to_address == TON_NATIVE_ADDRESS:
                tx_params = await router.build_swap_jetton_to_ton_tx_params(
                    user_wallet_address=sender_address,
                    offer_jetton_address=from_address,
                    offer_amount=offer_amount,
                    min_ask_amount=min_ask_units,
                    provider=provider,
                )
            else:
                tx_params = await router.build_swap_jetton_to_jetton_tx_params(
                    user_wallet_address=sender_address,
                    offer_jetton_address=from_address,
                    ask_jetton_address=to_address,
                    offer_amount=offer_amount,
                    min_ask_amount=min_ask_units,
                    provider=provider,
                )

            messages = []
            if isinstance(tx_params, dict):
                tx_params = [tx_params]
            elif not isinstance(tx_params, list):
                tx_params = [tx_params]

            for tx in tx_params:
                to_addr = str(tx.get("to", tx.get("address", "")))
                amt = str(tx.get("value", tx.get("amount", "0")))
                body = tx.get("body")
                payload = ""
                if body is not None:
                    if hasattr(body, "to_boc"):
                        payload = base64.b64encode(body.to_boc()).decode("ascii")
                    elif isinstance(body, bytes):
                        payload = base64.b64encode(body).decode("ascii")
                    elif isinstance(body, str):
                        payload = body

                messages.append({
                    "address": to_addr,
                    "amount": amt,
                    "payload": payload,
                })

            return {"messages": messages, "valid_until": valid_until}

        except Exception as e:
            logger.error("SDK build_swap failed: %s, falling back to simulate data", e)
            return self._build_swap_fallback(
                from_address, to_address, amount, min_ask_units, sender_address, simulation, valid_until
            )
        finally:
            if provider:
                try:
                    await provider.close_all()
                except Exception:
                    pass

    def _build_swap_fallback(
        self, from_address, to_address, amount, min_ask_units, sender_address, simulation, valid_until
    ) -> dict:
        router_address = simulation.get("router_address", self.router_address)
        gas = simulation.get("gas_params", {})
        forward_gas = int(gas.get("forward_gas", "300000000"))

        if from_address == TON_NATIVE_ADDRESS:
            total_amount = str(int(amount) + forward_gas)
            target = simulation.get("offer_jetton_wallet", router_address)
        else:
            total_amount = str(forward_gas)
            target = router_address

        op_code = 0x25938561
        query_id = int(time.time())
        payload_parts = [
            op_code.to_bytes(4, "big"),
            query_id.to_bytes(8, "big"),
            int(amount).to_bytes(16, "big"),
            from_address.encode("utf-8")[:48].ljust(48, b"\x00"),
            to_address.encode("utf-8")[:48].ljust(48, b"\x00"),
            int(min_ask_units).to_bytes(16, "big"),
            sender_address.encode("utf-8")[:48].ljust(48, b"\x00"),
        ]
        payload = base64.b64encode(b"".join(payload_parts)).decode("ascii")

        return {
            "messages": [{"address": target, "amount": total_amount, "payload": payload}],
            "valid_until": valid_until,
        }

    async def get_pool_for_pair(self, token0: str, token1: str) -> Optional[dict]:
        pools = await self.get_pools()
        for pool in pools:
            pool_token0 = pool.get("token0_address", "")
            pool_token1 = pool.get("token1_address", "")
            if (pool_token0 == token0 and pool_token1 == token1) or \
               (pool_token0 == token1 and pool_token1 == token0):
                return pool
        return None


stonfi_service = StonfiService()
