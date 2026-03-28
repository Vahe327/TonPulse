import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { PoolData } from "../../store/liquidityStore";
import { formatLargeNumber } from "../../utils/format";
import { useTelegram } from "../../hooks/useTelegram";
import { PoolPairIcon } from "./PoolPairIcon";

interface PoolRowProps {
  pool: PoolData;
  index: number;
  onSelect: (pool: PoolData) => void;
}

export function PoolRow({ pool, index, onSelect }: PoolRowProps) {
  const { t } = useTranslation();
  const { hapticImpact } = useTelegram();

  const handleClick = () => {
    hapticImpact("light");
    onSelect(pool);
  };

  const aprDisplay = pool.apr_24h >= 0.01 ? pool.apr_24h.toFixed(2) : "<0.01";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: index * 0.04,
      }}
      onClick={handleClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-md)",
        padding: "var(--spacing-md)",
        background: "var(--color-bg-card)",
        backdropFilter: "blur(var(--blur-md))",
        WebkitBackdropFilter: "blur(var(--blur-md))",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
        cursor: "pointer",
        transition: "background var(--duration-fast) ease",
      }}
      whileTap={{ scale: 0.98 }}
    >
      <PoolPairIcon
        tokenAIcon={pool.token_a.icon_url}
        tokenASymbol={pool.token_a.symbol}
        tokenBIcon={pool.token_b.icon_url}
        tokenBSymbol={pool.token_b.symbol}
        size={32}
      />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: "var(--font-size-md)",
            fontWeight: 600,
            color: "var(--color-text-primary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {pool.token_a.symbol} / {pool.token_b.symbol}
        </div>
        <div
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-tertiary)",
            marginTop: 2,
          }}
        >
          {t("liquidity.tvl")}: {formatLargeNumber(pool.tvl_usd)}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "3px 8px",
            borderRadius: "var(--radius-full)",
            background: "var(--color-accent-dim)",
            fontSize: "var(--font-size-xs)",
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            color: "var(--color-accent)",
          }}
        >
          {aprDisplay}% APR
        </div>
        <div
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-secondary)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {t("liquidity.vol_24h")}: {formatLargeNumber(pool.volume_24h_usd)}
        </div>
      </div>
    </motion.div>
  );
}
