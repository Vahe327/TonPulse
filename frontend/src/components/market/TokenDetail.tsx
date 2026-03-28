import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TokenIcon } from "../common/TokenIcon";
import { PriceChange } from "../common/PriceChange";
import { PriceChart } from "./PriceChart";
import { TokenStats } from "./TokenStats";
import { formatPrice } from "../../utils/format";
import { api } from "../../services/api";
import { useTelegram } from "../../hooks/useTelegram";
import { AIAnalysis } from "../ai/AIAnalysis";

interface TokenDetailProps {
  address: string;
}

interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon_url: string | null;
  price_usd: string | null;
  price_ton: string | null;
  change_24h: string | null;
  volume_24h: string | null;
  liquidity: string | null;
  market_cap: string | null;
  is_verified: boolean;
  description_en: string | null;
  description_ru: string | null;
}

export function TokenDetail({ address }: TokenDetailProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { hapticImpact } = useTelegram();
  const [token, setToken] = useState<TokenInfo | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await api.get<TokenInfo>(`/tokens/${address}`);
        setToken(data);
      } catch (err) {
        console.error("Failed to load token:", address, err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: 300,
          color: "var(--color-text-tertiary)",
        }}
      >
        {t("common.loading")}
      </div>
    );
  }

  if (!token) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: 300,
          gap: 12,
          color: "var(--color-text-tertiary)",
        }}
      >
        <div style={{ fontSize: "var(--font-size-lg)" }}>{t("common.error")}</div>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "10px 24px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-bg-tertiary)",
            color: "var(--color-text-primary)",
            fontWeight: 600,
          }}
        >
          {t("common.retry")}
        </button>
      </div>
    );
  }

  const description =
    i18n.language === "ru" ? token.description_ru : token.description_en;


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-sm)",
          padding: "var(--spacing-md)",
        }}
      >
        <TokenIcon src={token.icon_url} symbol={token.symbol} size={48} address={token.address} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: "var(--font-size-xl)" }}>
            {token.symbol}
          </div>
          <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
            {token.name}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--font-size-xl)", fontWeight: 700 }}>
            {formatPrice(token.price_usd || "0")}
          </div>
          <PriceChange value={token.change_24h} fontSize="var(--font-size-md)" />
        </div>
      </div>

      <PriceChart tokenAddress={token.address} tokenSymbol={token.symbol} height={250} />

      <TokenStats
        marketCap={token.market_cap}
        volume24h={token.volume_24h}
        liquidity={token.liquidity}
      />

      <div
        style={{
          margin: "0 var(--spacing-md) var(--spacing-sm)",
          padding: "12px var(--spacing-md)",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-bg-card)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0088CC 0%, #00AAFF 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 10,
              color: "#fff",
            }}
          >
            S
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>STON.fi DEX</div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
              {t("token.dex_provider")}
            </div>
          </div>
        </div>
        {token.price_ton && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--font-size-sm)", fontWeight: 500 }}>
              {parseFloat(token.price_ton).toFixed(6)} TON
            </div>
            <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
              {t("token.price_in_ton")}
            </div>
          </div>
        )}
      </div>

      {description && (
        <div
          style={{
            padding: "0 var(--spacing-md) var(--spacing-md)",
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-secondary)",
            lineHeight: 1.6,
          }}
        >
          {description}
        </div>
      )}

      <div
        style={{
          display: "flex",
          gap: "var(--spacing-sm)",
          padding: "var(--spacing-md)",
        }}
      >
        <button
          onClick={() => {
            hapticImpact("medium");
            navigate(`/swap?to=${token.address}`);
          }}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "var(--radius-sm)",
            background: "var(--gradient-accent)",
            color: "#0A0E14",
            fontWeight: 700,
            fontSize: "var(--font-size-md)",
          }}
        >
          {t("token.buy")}
        </button>
        <button
          onClick={() => {
            hapticImpact("medium");
            navigate(`/swap?from=${token.address}`);
          }}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-negative-dim)",
            border: "1px solid var(--color-negative)",
            color: "var(--color-negative)",
            fontWeight: 700,
            fontSize: "var(--font-size-md)",
          }}
        >
          {t("token.sell")}
        </button>
      </div>

      <div style={{ padding: "0 var(--spacing-md) var(--spacing-md)" }}>
        <AIAnalysis
          token={{
            address: token.address,
            symbol: token.symbol,
            name: token.name,
            price_usd: token.price_usd,
            change_24h: token.change_24h,
            volume_24h: token.volume_24h,
            liquidity: token.liquidity,
            market_cap: token.market_cap,
          }}
        />
      </div>
    </motion.div>
  );
}
