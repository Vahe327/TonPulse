import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { IoTrendingUp, IoTrendingDown, IoBarChart, IoShieldCheckmark } from "react-icons/io5";
import { motion } from "framer-motion";
import { formatPrice, formatLargeNumber } from "../../../utils/format";

const cardStyle: React.CSSProperties = {
  background: "rgba(20, 25, 34, 0.9)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(124, 92, 252, 0.2)",
  borderRadius: 16,
  padding: 16,
  marginTop: 8,
  width: "100%",
};

interface TokenInfoCardProps {
  data: Record<string, any>;
}

export function TokenInfoCard({ data }: TokenInfoCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const symbol: string = data.symbol || "???";
  const name: string = data.name || symbol;
  const address: string = data.address || data.token_address || "";
  const price: number = parseFloat(data.price_usd || data.price || "0");
  const change24h: number = parseFloat(data.change_24h || "0");
  const volume24h: number = parseFloat(data.volume_24h || data.volume || "0");
  const riskScore: number = parseInt(data.risk_score || "0", 10);
  const iconUrl: string | null = data.icon_url || null;
  const isPositive = change24h >= 0;

  const handleBuy = useCallback(() => {
    navigate(`/swap?to=${address}`);
  }, [navigate, address]);

  const handleSell = useCallback(() => {
    navigate(`/swap?from=${address}`);
  }, [navigate, address]);

  const getRiskColor = (score: number): string => {
    if (score <= 3) return "#00D4AA";
    if (score <= 6) return "#FFA500";
    return "#FF4757";
  };

  const getRiskLabel = (score: number): string => {
    if (score <= 3) return "Low";
    if (score <= 6) return "Medium";
    return "High";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={cardStyle}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        {iconUrl ? (
          <img
            src={iconUrl}
            alt={symbol}
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7C5CFC, #00D4AA)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 13,
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {symbol.slice(0, 2)}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--color-text-primary, #EAEEF3)",
            }}
          >
            {symbol}
          </div>
          <div
            style={{
              fontSize: 12,
              color: "var(--color-text-secondary, #8A94A6)",
            }}
          >
            {name}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(255, 255, 255, 0.04)",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5A6478)", marginBottom: 3 }}>
            {t("token.price")}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--color-text-primary, #EAEEF3)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {formatPrice(price)}
          </div>
        </div>

        <div
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            background: isPositive ? "rgba(0, 212, 170, 0.06)" : "rgba(255, 71, 87, 0.06)",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5A6478)", marginBottom: 3 }}>
            24h
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: isPositive ? "#00D4AA" : "#FF4757",
              fontFamily: "'JetBrains Mono', monospace",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {isPositive ? <IoTrendingUp size={13} /> : <IoTrendingDown size={13} />}
            {isPositive ? "+" : ""}
            {change24h.toFixed(2)}%
          </div>
        </div>

        <div
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(255, 255, 255, 0.04)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--color-text-tertiary, #5A6478)",
              marginBottom: 3,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <IoBarChart size={10} />
            {t("token.volume")}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-text-primary, #EAEEF3)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            {formatLargeNumber(volume24h)}
          </div>
        </div>

        {riskScore > 0 && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: `${getRiskColor(riskScore)}08`,
              border: `1px solid ${getRiskColor(riskScore)}15`,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "var(--color-text-tertiary, #5A6478)",
                marginBottom: 3,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <IoShieldCheckmark size={10} />
              {t("ai.risk_score")}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: getRiskColor(riskScore),
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {riskScore}/10 <span style={{ fontSize: 11, fontWeight: 500 }}>{getRiskLabel(riskScore)}</span>
            </div>
          </div>
        )}

        {riskScore === 0 && (
          <div
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              background: "rgba(255, 255, 255, 0.04)",
            }}
          >
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5A6478)", marginBottom: 3 }}>
              {t("ai.risk_score")}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--color-text-secondary, #8A94A6)",
              }}
            >
              N/A
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleBuy}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: 12,
            background: "linear-gradient(135deg, #00D4AA, #00B894)",
            border: "none",
            color: "#0A0E14",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("ai.buy")} {symbol}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSell}
          style={{
            flex: 1,
            padding: "10px 16px",
            borderRadius: 12,
            background: "rgba(255, 71, 87, 0.12)",
            border: "1px solid rgba(255, 71, 87, 0.25)",
            color: "#FF4757",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {t("ai.sell")} {symbol}
        </motion.button>
      </div>
    </motion.div>
  );
}
