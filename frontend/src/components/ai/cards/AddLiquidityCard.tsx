import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { IoWater, IoHelpCircle, IoTrendingUp } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

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

interface AddLiquidityCardProps {
  data: Record<string, any>;
}

export function AddLiquidityCard({ data }: AddLiquidityCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showExplainer, setShowExplainer] = useState(false);

  const tokenA: string = data.token_a_symbol || data.token_a || "TON";
  const tokenB: string = data.token_b_symbol || data.token_b || "USDT";
  const apr: string = data.apr || "0";
  const tvl: string = data.tvl || "0";
  const poolAddress: string = data.pool_address || "";
  const monthlyEstimate: string = data.monthly_estimate || "";

  const handleProvideLiquidity = useCallback(() => {
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
            background: "linear-gradient(135deg, rgba(0, 212, 170, 0.2), rgba(0, 184, 148, 0.15))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IoWater size={18} color="#00D4AA" />
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-text-primary, #EAEEF3)",
          }}
        >
          {t("ai.earn_yield")}
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
              width: 30,
              height: 30,
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
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #26A17B, #1A8F6E)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 10,
              fontWeight: 700,
              color: "#fff",
              border: "2px solid rgba(20, 25, 34, 0.9)",
              marginLeft: -8,
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

      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(0, 212, 170, 0.08)",
            border: "1px solid rgba(0, 212, 170, 0.15)",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5A6478)", marginBottom: 2 }}>
            {t("liquidity.apr")}
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#00D4AA",
              fontFamily: "'JetBrains Mono', monospace",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <IoTrendingUp size={14} />
            {apr}%
          </div>
        </div>
        <div
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(255, 255, 255, 0.04)",
          }}
        >
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5A6478)", marginBottom: 2 }}>
            {t("liquidity.tvl")}
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: "var(--color-text-primary, #EAEEF3)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ${tvl}
          </div>
        </div>
      </div>

      {monthlyEstimate && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 12,
            color: "var(--color-text-secondary, #8A94A6)",
            marginBottom: 12,
            padding: "6px 0",
          }}
        >
          <span>{t("ai.potential_earnings")}</span>
          <span style={{ color: "#00D4AA", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
            ~${monthlyEstimate}{t("ai.per_month")}
          </span>
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleProvideLiquidity}
        style={{
          width: "100%",
          padding: "11px 16px",
          borderRadius: 12,
          background: "linear-gradient(135deg, #00D4AA, #00B894)",
          border: "none",
          color: "#0A0E14",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 8,
        }}
      >
        {t("ai.provide_liquidity")}
      </motion.button>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => setShowExplainer(!showExplainer)}
        style={{
          width: "100%",
          padding: "8px 16px",
          borderRadius: 10,
          background: "transparent",
          border: "none",
          color: "var(--color-text-secondary, #8A94A6)",
          fontSize: 12,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <IoHelpCircle size={14} />
        {t("ai.what_is_this")}
      </motion.button>

      <AnimatePresence>
        {showExplainer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden" }}
          >
            <div
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                background: "rgba(124, 92, 252, 0.06)",
                border: "1px solid rgba(124, 92, 252, 0.12)",
                fontSize: 12,
                color: "var(--color-text-secondary, #8A94A6)",
                lineHeight: 1.5,
                marginTop: 8,
              }}
            >
              {t("liquidity.il_what_is_body")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
