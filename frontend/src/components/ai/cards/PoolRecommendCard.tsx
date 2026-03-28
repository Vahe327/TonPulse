import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { IoStar, IoTrendingUp, IoChevronForward } from "react-icons/io5";
import { motion } from "framer-motion";

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

interface PoolRecommendCardProps {
  data: Record<string, any>;
}

export function PoolRecommendCard({ data }: PoolRecommendCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const tokenA: string = data.token_a_symbol || data.token_a || "TON";
  const tokenB: string = data.token_b_symbol || data.token_b || "USDT";
  const apr: string = data.apr || "0";
  const tvl: string = data.tvl || "0";
  const poolAddress: string = data.pool_address || "";
  const reason: string = data.reason || data.why || "";

  const handleNavigate = useCallback(() => {
    if (poolAddress) {
      navigate(`/pools/${poolAddress}`);
    } else {
      navigate("/pools");
    }
  }, [navigate, poolAddress]);

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
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, rgba(255, 215, 0, 0.2), rgba(255, 165, 0, 0.15))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IoStar size={18} color="#FFD700" />
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-text-primary, #EAEEF3)",
          }}
        >
          {t("ai.recommended_pool")}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0088CC, #0098DB)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
              color: "#fff",
              border: "2px solid rgba(20, 25, 34, 0.9)",
              zIndex: 2,
              position: "relative",
            }}
          >
            {tokenA.slice(0, 2)}
          </div>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #26A17B, #1A8F6E)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
              color: "#fff",
              border: "2px solid rgba(20, 25, 34, 0.9)",
              marginLeft: -6,
              zIndex: 1,
              position: "relative",
            }}
          >
            {tokenB.slice(0, 2)}
          </div>
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-text-primary, #EAEEF3)",
          }}
        >
          {tokenA}/{tokenB}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
        <div
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 10,
            background: "rgba(0, 212, 170, 0.08)",
          }}
        >
          <div style={{ fontSize: 10, color: "var(--color-text-tertiary, #5A6478)", marginBottom: 2 }}>
            {t("liquidity.apr")}
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "#00D4AA",
              fontFamily: "'JetBrains Mono', monospace",
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <IoTrendingUp size={12} />
            {apr}%
          </div>
        </div>
        <div
          style={{
            flex: 1,
            padding: "8px 10px",
            borderRadius: 10,
            background: "rgba(255, 255, 255, 0.04)",
          }}
        >
          <div style={{ fontSize: 10, color: "var(--color-text-tertiary, #5A6478)", marginBottom: 2 }}>
            {t("liquidity.tvl")}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-text-primary, #EAEEF3)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ${tvl}
          </div>
        </div>
      </div>

      {reason && (
        <div
          style={{
            padding: "8px 10px",
            borderRadius: 8,
            background: "rgba(124, 92, 252, 0.06)",
            border: "1px solid rgba(124, 92, 252, 0.1)",
            fontSize: 12,
            color: "var(--color-text-secondary, #8A94A6)",
            lineHeight: 1.5,
            marginBottom: 12,
          }}
        >
          {reason}
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleNavigate}
        style={{
          width: "100%",
          padding: "10px 16px",
          borderRadius: 12,
          background: "linear-gradient(135deg, #7C5CFC, #5A3FD6)",
          border: "none",
          color: "#fff",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {t("ai.provide_liquidity")}
        <IoChevronForward size={14} />
      </motion.button>
    </motion.div>
  );
}
