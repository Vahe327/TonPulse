import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { TokenIcon } from "../common/TokenIcon";
import { PriceChange } from "../common/PriceChange";
import { formatPrice, formatLargeNumber } from "../../utils/format";
import { TokenData } from "../../store/tokenStore";
import { useTelegram } from "../../hooks/useTelegram";

interface TrendingTokensProps {
  tokens: TokenData[];
}

export function TrendingTokens({ tokens }: TrendingTokensProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hapticImpact } = useTelegram();

  const scored = tokens
    .filter((tk) => tk.is_verified && parseFloat(tk.price_usd || "0") > 0 && parseFloat(tk.liquidity || "0") >= 1000)
    .map((tk) => {
      const change = Math.abs(parseFloat(tk.change_24h || "0"));
      const price = parseFloat(tk.price_usd || "0");
      const liq = parseFloat(tk.liquidity || "0");
      const score = change * 10 + price * 0.01 + Math.log10(Math.max(liq, 1)) * 2;
      return { ...tk, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  if (scored.length === 0) return null;

  return (
    <div style={{ padding: "var(--spacing-md) 0" }}>
      <div
        style={{
          padding: "0 var(--spacing-md)",
          marginBottom: "var(--spacing-sm)",
          fontSize: "var(--font-size-lg)",
          fontWeight: 600,
        }}
      >
        {t("market.hot")}
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          overflowX: "auto",
          padding: "0 var(--spacing-md)",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
        }}
      >
        {scored.map((token, i) => {
          const change = parseFloat(token.change_24h || "0");
          const isPositive = change >= 0;
          return (
            <motion.button
              key={token.address}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => {
                hapticImpact("light");
                navigate(`/token/${encodeURIComponent(token.address)}`);
              }}
              style={{
                minWidth: 130,
                padding: 14,
                borderRadius: 16,
                background: "linear-gradient(180deg, rgba(19,24,32,0.9) 0%, rgba(10,14,20,0.95) 100%)",
                backdropFilter: "blur(8px)",
                border: `1px solid ${isPositive ? "rgba(0,212,170,0.12)" : "rgba(255,71,87,0.12)"}`,
                scrollSnapAlign: "start",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                flexShrink: 0,
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TokenIcon src={token.icon_url} symbol={token.symbol} size={28} address={token.address} />
                <span style={{ fontWeight: 700, fontSize: 14 }}>{token.symbol}</span>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                {formatPrice(token.price_usd || "0")}
              </div>
              <PriceChange value={token.change_24h} />
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 2 }}>
                {token.liquidity && parseFloat(token.liquidity) > 0 && (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-tertiary)" }}>
                    TVL {formatLargeNumber(token.liquidity)}
                  </div>
                )}
                {token.volume_24h && parseFloat(token.volume_24h) > 0 && (
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-text-tertiary)" }}>
                    Vol {formatLargeNumber(token.volume_24h)}
                  </div>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
