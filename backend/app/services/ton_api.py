import base64
import logging
import struct

import httpx
from decimal import Decimal
from typing import Optional

from app.config import settings
from app.utils.formatting import nano_to_amount
from app.utils.constants import TON_NATIVE_ADDRESS, TON_DECIMALS

logger = logging.getLogger(__name__)

IPFS_GATEWAY = "https://cloudflare-ipfs.com/ipfs/"


def _resolve_image_url(url: str) -> str:
    if not url:
        return ""
    if url.startswith("ipfs://"):
        return IPFS_GATEWAY + url[7:]
    return url


def raw_to_friendly(raw_address: str, bounceable: bool = True) -> str:
    if not raw_address or ":" not in raw_address:
        return raw_address
    workchain_str, hex_part = raw_address.split(":", 1)
    workchain = int(workchain_str)
    addr_bytes = bytes.fromhex(hex_part)
    tag = 0x11 if bounceable else 0x51
    payload = struct.pack("b", workchain) + addr_bytes
    crc_data = bytes([tag]) + payload
    crc = _crc16(crc_data)
    result = bytes([tag]) + payload + struct.pack(">H", crc)
    return base64.urlsafe_b64encode(result).decode("ascii")


def _crc16(data: bytes) -> int:
    crc = 0
    for byte in data:
        crc ^= byte << 8
        for _ in range(8):
            if crc & 0x8000:
                crc = (crc << 1) ^ 0x1021
            else:
                crc <<= 1
            crc &= 0xFFFF
    return crc


class TonApiService:
    def __init__(self):
        self.base_url = settings.ton_api_url
        self.api_key = settings.ton_api_key
        self._client: Optional[httpx.AsyncClient] = None

    async def _get_client(self) -> httpx.AsyncClient:
        if self._client is None or self._client.is_closed:
            headers = {}
            if self.api_key:
                headers["X-API-Key"] = self.api_key
            self._client = httpx.AsyncClient(
                base_url=self.base_url,
                headers=headers,
                timeout=httpx.Timeout(30.0),
            )
        return self._client

    async def close(self):
        if self._client and not self._client.is_closed:
            await self._client.aclose()

    async def get_address_balance(self, address: str) -> Decimal:
        client = await self._get_client()
        response = await client.get(
            "/getAddressBalance",
            params={"address": address},
        )
        response.raise_for_status()
        data = response.json()
        if data.get("ok"):
            return nano_to_amount(int(data["result"]), TON_DECIMALS)
        return Decimal("0")

    async def get_jetton_wallets(self, owner_address: str) -> list[dict]:
        try:
            async with httpx.AsyncClient(
                base_url="https://toncenter.com/api/v3",
                headers={"X-API-Key": self.api_key} if self.api_key else {},
                timeout=httpx.Timeout(30.0),
            ) as v3_client:
                response = await v3_client.get(
                    "/jetton/wallets",
                    params={"owner_address": owner_address, "limit": 100},
                )
                response.raise_for_status()
                data = response.json()
        except Exception:
            return []

        jetton_wallets = data.get("jetton_wallets", [])
        if not jetton_wallets:
            return []

        jetton_addresses = []
        for w in jetton_wallets:
            bal = int(w.get("balance", "0") or "0")
            if bal > 0:
                jetton_addr = w.get("jetton", "")
                if isinstance(jetton_addr, str) and jetton_addr:
                    jetton_addresses.append(jetton_addr)

        metadata_map: dict[str, dict] = {}
        if jetton_addresses:
            try:
                async with httpx.AsyncClient(
                    base_url="https://toncenter.com/api/v3",
                    headers={"X-API-Key": self.api_key} if self.api_key else {},
                    timeout=httpx.Timeout(30.0),
                ) as v3_client:
                    for i in range(0, len(jetton_addresses), 10):
                        batch = jetton_addresses[i:i+10]
                        for addr in batch:
                            try:
                                resp = await v3_client.get(
                                    "/jetton/masters",
                                    params={"address": addr, "limit": 1},
                                )
                                if resp.status_code == 200:
                                    masters = resp.json().get("jetton_masters", [])
                                    if masters:
                                        content = masters[0].get("jetton_content", {})
                                        if not content.get("image") and content.get("uri"):
                                            uri = content["uri"]
                                            if uri.startswith("ipfs://"):
                                                uri = IPFS_GATEWAY + uri[7:]
                                            if uri.startswith("http"):
                                                try:
                                                    uri_resp = await v3_client.get(uri)
                                                    if uri_resp.status_code == 200:
                                                        offchain = uri_resp.json()
                                                        if offchain.get("image"):
                                                            content["image"] = offchain["image"]
                                                        if not content.get("symbol") and offchain.get("symbol"):
                                                            content["symbol"] = offchain["symbol"]
                                                        if not content.get("name") and offchain.get("name"):
                                                            content["name"] = offchain["name"]
                                                        if not content.get("decimals") and offchain.get("decimals"):
                                                            content["decimals"] = offchain["decimals"]
                                                except Exception:
                                                    pass
                                        metadata_map[addr] = content
                            except Exception as e:
                                logger.debug("Failed to fetch metadata for %s: %s", addr, e)
            except Exception:
                pass

        wallets = []
        for wallet in jetton_wallets:
            balance_raw = wallet.get("balance", "0")
            bal_int = int(balance_raw or "0")
            if bal_int <= 0:
                continue

            jetton_addr_raw = wallet.get("jetton", "")
            meta = metadata_map.get(jetton_addr_raw, {})
            decimals = int(meta.get("decimals", 9))
            balance = nano_to_amount(bal_int, decimals)

            jetton_addr_friendly = raw_to_friendly(jetton_addr_raw) if ":" in jetton_addr_raw else jetton_addr_raw

            wallets.append({
                "jetton_address": jetton_addr_friendly,
                "wallet_address": wallet.get("address", ""),
                "balance_raw": balance_raw,
                "balance": balance,
                "symbol": meta.get("symbol", "???"),
                "name": meta.get("name", "Unknown"),
                "decimals": decimals,
                "icon_url": _resolve_image_url(meta.get("image", "")),
            })

        return wallets

    async def get_jetton_data(self, jetton_address: str) -> Optional[dict]:
        client = await self._get_client()
        response = await client.get(
            "/getJettonData",
            params={"address": jetton_address},
        )
        response.raise_for_status()
        data = response.json()

        if not data.get("ok"):
            return None

        result = data.get("result", {})
        content = result.get("jetton_content", {}).get("data", {})

        return {
            "address": jetton_address,
            "symbol": content.get("symbol", "???"),
            "name": content.get("name", "Unknown"),
            "decimals": int(content.get("decimals", 9)),
            "total_supply": result.get("total_supply", "0"),
            "icon_url": _resolve_image_url(content.get("image", "")),
            "description": content.get("description", ""),
        }

    async def get_transactions(
        self, address: str, limit: int = 20, lt: Optional[int] = None, hash_: Optional[str] = None
    ) -> list[dict]:
        client = await self._get_client()
        params = {"address": address, "limit": limit}
        if lt is not None:
            params["lt"] = lt
        if hash_ is not None:
            params["hash"] = hash_

        response = await client.get("/getTransactions", params=params)
        response.raise_for_status()
        data = response.json()

        if not data.get("ok"):
            return []

        return data.get("result", [])


ton_api_service = TonApiService()
