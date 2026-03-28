import { useTranslation } from "react-i18next";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { motion } from "framer-motion";
import { PageTransition } from "../components/layout/PageTransition";
import { PullToRefresh } from "../components/common/PullToRefresh";
import { PortfolioSummary } from "../components/portfolio/PortfolioSummary";
import { TokenList } from "../components/portfolio/TokenList";
import { PnLChart } from "../components/portfolio/PnLChart";
import { Skeleton } from "../components/common/Skeleton";
import { usePortfolio } from "../hooks/usePortfolio";

export function PortfolioPage() {
  const { t } = useTranslation();
  const address = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const { portfolio, isLoading, refetch } = usePortfolio(address || "");

  if (!address) {
    return (
      <PageTransition>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "60vh",
            gap: "var(--spacing-md)",
            padding: "var(--spacing-md)",
            textAlign: "center",
          }}
        >
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ opacity: 0.3 }}>
            <rect x="12" y="24" width="56" height="36" rx="8" stroke="var(--color-text-tertiary)" strokeWidth="2" />
            <circle cx="56" cy="42" r="6" stroke="var(--color-text-tertiary)" strokeWidth="2" />
            <path d="M12 36h56" stroke="var(--color-text-tertiary)" strokeWidth="2" />
          </svg>
          <div style={{ fontSize: "var(--font-size-lg)", fontWeight: 600, color: "var(--color-text-secondary)" }}>
            {t("portfolio.connect_to_view")}
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => tonConnectUI.openModal()}
            style={{
              padding: "14px 32px",
              borderRadius: "var(--radius-sm)",
              background: "var(--gradient-accent)",
              color: "#0A0E14",
              fontWeight: 700,
              fontSize: "var(--font-size-md)",
            }}
          >
            {t("swap.connect_wallet")}
          </motion.button>
        </div>
      </PageTransition>
    );
  }

  if (isLoading && !portfolio) {
    return (
      <PageTransition>
        <div style={{ padding: "var(--spacing-lg) var(--spacing-md)", display: "flex", flexDirection: "column", gap: 16 }}>
          <Skeleton width="50%" height={20} />
          <Skeleton width="70%" height={36} />
          <Skeleton width="30%" height={16} />
          <div style={{ marginTop: 16 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <Skeleton width={40} height={40} borderRadius="50%" />
                <div style={{ flex: 1 }}>
                  <Skeleton width="60%" height={16} />
                  <Skeleton width="40%" height={12} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <PullToRefresh onRefresh={refetch}>
        {portfolio && (
          <>
            <PortfolioSummary
              totalUsd={portfolio.total_usd}
              pnl24hUsd={portfolio.pnl_24h_usd}
              pnl24hPercent={portfolio.pnl_24h_percent}
            />
            {portfolio.pnl_24h_usd && parseFloat(portfolio.pnl_24h_usd) !== 0 && (
              <PnLChart positive={parseFloat(portfolio.pnl_24h_usd) >= 0} />
            )}
            <TokenList positions={portfolio.positions} />
          </>
        )}
      </PullToRefresh>
    </PageTransition>
  );
}
