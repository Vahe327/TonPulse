import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useLiquidityStore, PoolData, SortBy } from "../../store/liquidityStore";
import { useTelegram } from "../../hooks/useTelegram";
import { Skeleton } from "../common/Skeleton";
import { PoolRow } from "./PoolRow";

interface PoolListProps {
  onSelectPool: (pool: PoolData) => void;
}

const sortOptions: { key: SortBy; labelKey: string }[] = [
  { key: "tvl", labelKey: "liquidity.sort_tvl" },
  { key: "apr", labelKey: "liquidity.sort_apr" },
  { key: "volume", labelKey: "liquidity.sort_volume" },
];

export function PoolList({ onSelectPool }: PoolListProps) {
  const { t } = useTranslation();
  const { hapticSelection } = useTelegram();
  const {
    isLoadingPools,
    searchQuery,
    sortBy,
    setSearchQuery,
    setSortBy,
    getSortedPools,
  } = useLiquidityStore();

  const pools = getSortedPools();
  const [inputFocused, setInputFocused] = useState(false);

  const handleSortChange = (newSort: SortBy) => {
    hapticSelection();
    setSortBy(newSort);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setInputFocused(true)}
        onBlur={() => setInputFocused(false)}
        placeholder={t("liquidity.search_pools")}
        style={{
          width: "100%",
          padding: "12px var(--spacing-md)",
          fontSize: "var(--font-size-md)",
          fontFamily: "var(--font-sans)",
          color: "var(--color-text-primary)",
          background: "var(--color-bg-card)",
          backdropFilter: "blur(var(--blur-md))",
          border: `1px solid ${inputFocused ? "var(--color-accent)" : "var(--color-border)"}`,
          borderRadius: "var(--radius-sm)",
          outline: "none",
          transition: "border-color var(--duration-fast) ease",
        }}
      />

      <div
        style={{
          display: "flex",
          gap: "var(--spacing-sm)",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {sortOptions.map((opt) => {
          const isActive = sortBy === opt.key;
          return (
            <motion.button
              key={opt.key}
              onClick={() => handleSortChange(opt.key)}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                fontSize: "var(--font-size-sm)",
                fontWeight: 600,
                fontFamily: "var(--font-sans)",
                color: isActive
                  ? "var(--color-bg-primary)"
                  : "var(--color-text-secondary)",
                background: isActive
                  ? "var(--color-accent)"
                  : "var(--color-bg-tertiary)",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition:
                  "background var(--duration-fast) ease, color var(--duration-fast) ease",
                flexShrink: 0,
              }}
            >
              {t(opt.labelKey)}
            </motion.button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-sm)",
        }}
      >
        {isLoadingPools ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{
                padding: "var(--spacing-md)",
                background: "var(--color-bg-card)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-md)",
              }}
            >
              <Skeleton width={56} height={32} borderRadius="var(--radius-full)" />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <Skeleton width="60%" height={16} />
                <Skeleton width="40%" height={12} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                <Skeleton width={72} height={20} borderRadius="var(--radius-full)" />
                <Skeleton width={60} height={12} />
              </div>
            </div>
          ))
        ) : pools.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              textAlign: "center",
              padding: "var(--spacing-xxl) var(--spacing-md)",
              color: "var(--color-text-tertiary)",
              fontSize: "var(--font-size-md)",
            }}
          >
            {searchQuery.trim()
              ? t("liquidity.no_pools_found")
              : t("liquidity.no_pools")}
          </motion.div>
        ) : (
          pools.map((pool, index) => (
            <PoolRow
              key={pool.address}
              pool={pool}
              index={index}
              onSelect={onSelectPool}
            />
          ))
        )}
      </div>
    </div>
  );
}
