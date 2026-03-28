import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { IoWallet, IoChevronForward } from "react-icons/io5";
import { motion } from "framer-motion";
import { formatPrice } from "../../../utils/format";

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

interface PortfolioToken {
  symbol: string;
  amount: string | number;
  value_usd: string | number;
  change_24h?: string | number | null;
  icon_url?: string | null;
}

interface PortfolioCardProps {
  data: Record<string, any>;
}

export function PortfolioCard({ data }: PortfolioCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const totalUsd: string = data.total_usd || data.total || "0";
  const tokens: PortfolioToken[] = data.tokens || data.positions || [];
  const topTokens = tokens.slice(0, 4);

  const handleViewFull = useCallback(() => {
    navigate("/portfolio");
  }, [navigate]);

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
            background: "linear-gradient(135deg, rgba(124, 92, 252, 0.2), rgba(124, 92, 252, 0.1))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IoWallet size={18} color="#7C5CFC" />
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-text-primary, #EAEEF3)",
          }}
        >
          {t("ai.your_portfolio")}
        </div>
      </div>

      <div
        style={{
          marginBottom: 14,
          padding: "12px 14px",
          borderRadius: 12,
          background: "linear-gradient(135deg, rgba(124, 92, 252, 0.08), rgba(0, 212, 170, 0.05))",
          border: "1px solid rgba(124, 92, 252, 0.12)",
        }}
      >
        <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5A6478)", marginBottom: 4 }}>
          {t("ai.total_balance")}
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "var(--color-text-primary, #EAEEF3)",
            fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
            letterSpacing: "-0.5px",
          }}
        >
          ${parseFloat(totalUsd).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      {topTokens.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {topTokens.map((token, idx) => {
            const valueNum = parseFloat(String(token.value_usd));
            const changeNum = token.change_24h ? parseFloat(String(token.change_24h)) : 0;
            const isPositive = changeNum >= 0;

            return (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: "rgba(255, 255, 255, 0.03)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {token.icon_url ? (
                    <img
                      src={token.icon_url}
                      alt={token.symbol}
                      style={{ width: 24, height: 24, borderRadius: "50%" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #7C5CFC, #00D4AA)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 9,
                        fontWeight: 700,
                        color: "#fff",
                      }}
                    >
                      {token.symbol.slice(0, 2)}
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary, #EAEEF3)" }}>
                      {token.symbol}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5A6478)" }}>
                      {parseFloat(String(token.amount)).toFixed(4)}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--color-text-primary, #EAEEF3)",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {formatPrice(valueNum)}
                  </div>
                  {token.change_24h !== undefined && token.change_24h !== null && (
                    <div
                      style={{
                        fontSize: 11,
                        color: isPositive ? "#00D4AA" : "#FF4757",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      {isPositive ? "+" : ""}{changeNum.toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleViewFull}
        style={{
          width: "100%",
          padding: "10px 16px",
          borderRadius: 12,
          background: "rgba(124, 92, 252, 0.12)",
          border: "1px solid rgba(124, 92, 252, 0.2)",
          color: "#7C5CFC",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {t("ai.full_portfolio")}
        <IoChevronForward size={14} />
      </motion.button>
    </motion.div>
  );
}
