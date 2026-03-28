import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "../components/layout/PageTransition";
import { PullToRefresh } from "../components/common/PullToRefresh";
import { TrendingTokens } from "../components/market/TrendingTokens";
import { TokenIcon } from "../components/common/TokenIcon";
import { PriceChange } from "../components/common/PriceChange";
import { Skeleton } from "../components/common/Skeleton";
import { AIRiskBadge } from "../components/ai/AIRiskBadge";
import { useTokens } from "../hooks/useTokens";
import { useTokenStore } from "../store/tokenStore";
import { useAI } from "../hooks/useAI";
import { formatPrice, formatLargeNumber } from "../utils/format";
import { useTelegram } from "../hooks/useTelegram";
import { useState, useEffect, useRef, memo, useCallback, useMemo } from "react";
import { TokenData } from "../store/tokenStore";

const LOW_LIQUIDITY_THRESHOLD = 1000;

const TokenRow = memo(function TokenRow({
  token,
  riskScore,
  onPress,
}: {
  token: TokenData;
  riskScore: number | null;
  onPress: (address: string) => void;
}) {
  const liq = token.liquidity ? parseFloat(token.liquidity) : 0;
  const isLowLiquidity = liq < LOW_LIQUIDITY_THRESHOLD && !token.liquidity;
  const isDangerousLiquidity = token.liquidity !== null && liq < LOW_LIQUIDITY_THRESHOLD;
  const showWarning = isLowLiquidity || isDangerousLiquidity;

  const prevPriceRef = useRef(token.price_usd);
  const [flash, setFlash] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    const prev = prevPriceRef.current;
    const curr = token.price_usd;
    if (prev && curr && prev !== curr) {
      const diff = parseFloat(curr) - parseFloat(prev);
      if (diff !== 0) {
        setFlash(diff > 0 ? "up" : "down");
        const timer = setTimeout(() => setFlash(null), 1200);
        return () => clearTimeout(timer);
      }
    }
    prevPriceRef.current = curr;
  }, [token.price_usd]);

  const priceColor = flash === "up"
    ? "var(--color-accent)"
    : flash === "down"
      ? "var(--color-negative)"
      : "var(--color-text-primary)";

  return (
    <button
      onClick={() => onPress(token.address)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-sm)",
        padding: "12px var(--spacing-md)",
        width: "100%",
        textAlign: "left",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div style={{ position: "relative", flexShrink: 0 }}>
        <TokenIcon src={token.icon_url} symbol={token.symbol} size={40} address={token.address} />
        {showWarning && (
          <div
            title={isDangerousLiquidity ? "Low liquidity" : "No liquidity data"}
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 16,
              height: 16,
              borderRadius: "50%",
              background: isDangerousLiquidity ? "#FF4757" : "#FFA502",
              border: "2px solid var(--color-bg-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M4 1v3.5M4 6h.004" stroke="#fff" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontWeight: 600 }}>{token.symbol}</span>
          {token.is_verified && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--color-accent)">
              <path d="M6 0l1.5 1.5H9.5v2L11 5l-1 1.5v2H8L6 11 4 8.5H2v-2L.5 5 2 3.5v-2h2L6 0z" />
              <path d="M4 6l1.5 1.5L8 4.5" stroke="#0A0E14" strokeWidth="1.2" fill="none" />
            </svg>
          )}
        </div>
        <div style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--color-text-secondary)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {token.name}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "var(--font-size-sm)", fontWeight: 500,
            color: priceColor,
            transition: "color 0.6s ease",
          }}>
            {formatPrice(token.price_usd || "0")}
          </div>
          <PriceChange value={token.change_24h} />
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            marginTop: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 1,
          }}>
            {token.liquidity && liq > 0 ? (
              <div style={{ color: liq < LOW_LIQUIDITY_THRESHOLD ? "#FF4757" : "var(--color-text-tertiary)" }}>
                TVL {formatLargeNumber(token.liquidity)}{liq < LOW_LIQUIDITY_THRESHOLD ? " ⚠" : ""}
              </div>
            ) : (
              <div style={{ color: "#FFA502" }}>No TVL</div>
            )}
            {token.volume_24h && parseFloat(token.volume_24h) > 0 ? (
              <div style={{ color: "var(--color-text-tertiary)" }}>
                Vol {formatLargeNumber(token.volume_24h)}
              </div>
            ) : (
              <div style={{ color: "var(--color-text-tertiary)", opacity: 0.5 }}>No Vol</div>
            )}
          </div>
        </div>
        <AIRiskBadge score={riskScore} size={20} />
      </div>
    </button>
  );
});

export function MarketPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hapticImpact } = useTelegram();
  const { isLoading, refetch } = useTokens();
  const { searchQuery, setSearchQuery, getFilteredTokens } = useTokenStore();
  const { getRiskScores } = useAI();
  const [riskScores, setRiskScores] = useState<Record<string, number>>({});
  const filteredTokens = getFilteredTokens();
  const allTokens = useTokenStore((s) => s.tokens);

  const handleTokenPress = useCallback((address: string) => {
    hapticImpact("light");
    navigate(`/token/${encodeURIComponent(address)}`);
  }, [hapticImpact, navigate]);

  const riskLoadedRef = useRef(false);

  useEffect(() => {
    if (allTokens.length === 0 || riskLoadedRef.current) return;

    const addresses = allTokens.slice(0, 15).map((t) => t.address);
    getRiskScores(addresses).then((scores) => {
      if (scores.length > 0) {
        riskLoadedRef.current = true;
        const map: Record<string, number> = {};
        for (const s of scores) {
          map[s.address] = s.risk_score;
        }
        setRiskScores(map);
      }
    });
  }, [allTokens.length, getRiskScores]);

  return (
    <PageTransition>
      <PullToRefresh onRefresh={refetch}>
        <div style={{ padding: "var(--spacing-md)" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("market.search")}
            style={{
              width: "100%",
              padding: "12px var(--spacing-md)",
              borderRadius: "var(--radius-sm)",
              background: "var(--color-bg-tertiary)",
              border: "1px solid var(--color-border)",
              color: "var(--color-text-primary)",
              fontSize: "var(--font-size-md)",
            }}
          />
        </div>

        {!searchQuery && <TrendingTokens tokens={filteredTokens} />}

        <div style={{ padding: "0 var(--spacing-md)" }}>
          <div
            style={{
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              marginBottom: "var(--spacing-sm)",
            }}
          >
            {t("market.all_tokens")}
          </div>
        </div>

        {isLoading && filteredTokens.length === 0 ? (
          <div style={{ padding: "0 var(--spacing-md)", display: "flex", flexDirection: "column", gap: 12 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Skeleton width={40} height={40} borderRadius="50%" />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <Skeleton width="60%" height={16} />
                  <Skeleton width="40%" height={12} />
                </div>
                <Skeleton width={80} height={16} />
              </div>
            ))}
          </div>
        ) : (
          <div>
            {filteredTokens.map((token) => (
              <TokenRow
                key={token.address}
                token={token}
                riskScore={riskScores[token.address] ?? null}
                onPress={handleTokenPress}
              />
            ))}
            {filteredTokens.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "var(--spacing-xxl)",
                  color: "var(--color-text-tertiary)",
                }}
              >
                {t("market.no_results")}
              </div>
            )}
          </div>
        )}
      </PullToRefresh>
    </PageTransition>
  );
}
