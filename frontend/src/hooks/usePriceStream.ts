import { useEffect, useRef } from "react";
import { useTokenStore } from "../store/tokenStore";
import { WS_BASE_URL } from "../utils/constants";

export function usePriceStream() {
  const wsRef = useRef<WebSocket | null>(null);
  const updateTokenPrice = useTokenStore((s) => s.updateTokenPrice);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function connect() {
      const initData = window.Telegram?.WebApp?.initData || "";
      const url = `${WS_BASE_URL}/prices?initData=${encodeURIComponent(initData)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === "price_update" && Array.isArray(msg.data)) {
            for (const update of msg.data) {
              updateTokenPrice(
                update.address,
                update.price_usd,
                update.change_24h
              );
            }
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };

      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "ping" }));
        }
      }, 30000);

      ws.addEventListener("close", () => clearInterval(pingInterval));
    }

    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [updateTokenPrice]);
}
