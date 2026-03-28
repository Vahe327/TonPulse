import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { formatPrice, formatPercent } from "../../utils/format";

interface PortfolioSummaryProps {
  totalUsd: string;
  pnl24hUsd: string | null;
  pnl24hPercent: string | null;
}

export function PortfolioSummary({
  totalUsd,
  pnl24hUsd,
  pnl24hPercent,
}: PortfolioSummaryProps) {
  const { t } = useTranslation();
  const pnlNum = pnl24hUsd ? parseFloat(pnl24hUsd) : 0;
  const isPositive = pnlNum >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: "var(--spacing-lg) var(--spacing-md)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-secondary)",
          marginBottom: 4,
        }}
      >
        {t("portfolio.total_balance")}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--font-size-display)",
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        {formatPrice(totalUsd)}
      </div>
      {pnl24hUsd !== null && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            borderRadius: "var(--radius-full)",
            background: isPositive ? "var(--color-accent-dim)" : "var(--color-negative-dim)",
            marginTop: 8,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
              color: isPositive ? "var(--color-accent)" : "var(--color-negative)",
            }}
          >
            {isPositive ? "+" : ""}
            {formatPrice(pnl24hUsd)}
          </span>
          {pnl24hPercent && (
            <span
              style={{
                fontSize: "var(--font-size-xs)",
                color: isPositive ? "var(--color-accent)" : "var(--color-negative)",
              }}
            >
              ({formatPercent(pnl24hPercent)})
            </span>
          )}
        </div>
      )}
    </motion.div>
  );
}
