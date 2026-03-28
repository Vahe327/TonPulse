export const API_BASE_URL = "/api/v1";
export const WS_BASE_URL = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/v1/ws`;

export const TON_NATIVE_ADDRESS =
  "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c";
export const USDT_ADDRESS =
  "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs";

export const KNOWN_TOKEN_ICONS: Record<string, string> = {
  [TON_NATIVE_ADDRESS]:
    "https://asset.ston.fi/img/EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c/c8d21a3d93f9b574381e0a8d8f16d48b325dd8f54ce172f599c1e9d6c62f03f7",
  [USDT_ADDRESS]:
    "https://asset.ston.fi/img/EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs/1a87edfee9a28b05578853952e5effb8cc30af1e0fb90043aa2ce19dce490849",
};

export const SLIPPAGE_OPTIONS = [0.5, 1, 3];
export const DEFAULT_SLIPPAGE = 1;

export const PRICE_UPDATE_INTERVAL = 15000;
export const PORTFOLIO_REFRESH_INTERVAL = 30000;
