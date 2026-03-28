TON_NATIVE_ADDRESS = "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
TON_SYMBOL = "TON"
TON_NAME = "Toncoin"
TON_DECIMALS = 9

USDT_ADDRESS = "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs"
USDT_SYMBOL = "USDT"
USDT_NAME = "Tether USD"
USDT_DECIMALS = 6

STONFI_ROUTER_V2 = "EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTEAAPaiU71gc4TiUt"

STONFI_API_BASE = "https://api.ston.fi"
STONFI_ASSETS_ENDPOINT = "/v1/assets"
STONFI_POOLS_ENDPOINT = "/v1/pools"
STONFI_SWAP_SIMULATE_ENDPOINT = "/v1/swap/simulate"
STONFI_REVERSE_SWAP_SIMULATE_ENDPOINT = "/v1/reverse_swap/simulate"

TONCENTER_API_BASE = "https://toncenter.com/api/v2"

COINGECKO_TON_ID = "the-open-network"

DEFAULT_TOKENS = [
    {
        "address": TON_NATIVE_ADDRESS,
        "symbol": TON_SYMBOL,
        "name": TON_NAME,
        "decimals": TON_DECIMALS,
        "is_verified": True,
    },
    {
        "address": USDT_ADDRESS,
        "symbol": USDT_SYMBOL,
        "name": USDT_NAME,
        "decimals": USDT_DECIMALS,
        "is_verified": True,
    },
    {
        "address": "EQAvlWFDxGF2lXm67y4yzC17wYKD9A0guwPkMs1gOsM__NOT",
        "symbol": "NOT",
        "name": "Notcoin",
        "decimals": 9,
        "is_verified": True,
    },
    {
        "address": "EQCvxJy4eG8hyHBFsZ7DUdYCtPA_SRrf_94WoAdPJhbW34Dl",
        "symbol": "DOGS",
        "name": "DOGS",
        "decimals": 9,
        "is_verified": True,
    },
    {
        "address": "EQBlqsm144Dq6SjbPI4jjZvA1hqTIP3CvHovbIfW_t-SCALE",
        "symbol": "SCALE",
        "name": "SCALE",
        "decimals": 9,
        "is_verified": True,
    },
    {
        "address": "EQAJ8uWd7EBqsmpSWaRdf_I-8R8-XHwh3gsNKhy-UrdrPcUo",
        "symbol": "STON",
        "name": "STON.fi",
        "decimals": 9,
        "is_verified": True,
    },
]

NANO_MULTIPLIER = 10**9

KNOWN_TOKEN_ICONS: dict[str, str] = {
    TON_NATIVE_ADDRESS: "https://asset.ston.fi/img/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c/c8d21a3d93f9b574381e0a8d8f16d48b325dd8f54ce172f599c1e9d6c62f03f7",
    USDT_ADDRESS: "https://asset.ston.fi/img/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs/1a87edfee9a28b05578853952e5effb8cc30af1e0fb90043aa2ce19dce490849",
}
