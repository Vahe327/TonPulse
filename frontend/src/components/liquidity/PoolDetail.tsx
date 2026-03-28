import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Sheet } from "../common/Sheet";
import { PoolPairIcon } from "./PoolPairIcon";
import { PoolAIInsight } from "./PoolAIInsight";
import { PoolData } from "../../store/liquidityStore";
import { formatLargeNumber, formatTokenAmount } from "../../utils/format";
import { useTelegram } from "../../hooks/useTelegram";

interface PoolDetailProps {
  pool: PoolData | null;
  isOpen: boolean;
  onClose: () => void;
  onAddLiquidity: (pool: PoolData) => void;
}

interface StatCardProps {
  label: string;
  value: string;
  accent?: boolean;
  delay?: number;
}

function StatCard({ label, value, accent, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay,
      }}
      style={{
        padding: "var(--spacing-md)",
        background: "var(--color-bg-tertiary)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: "var(--font-size-xs)",
          color: "var(--color-text-tertiary)",
          fontWeight: 500,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "var(--font-size-lg)",
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          color: accent ? "var(--color-accent)" : "var(--color-text-primary)",
        }}
      >
        {value}
      </div>
    </motion.div>
  );
}

export function PoolDetail({ pool, isOpen, onClose, onAddLiquidity }: PoolDetailProps) {
  const { t } = useTranslation();
  const { hapticImpact } = useTelegram();

  if (!pool) return null;

  const aprDisplay = pool.apr_24h >= 0.01 ? `${pool.apr_24h.toFixed(2)}%` : "<0.01%";
  const feeDisplay = `${(pool.fee_rate * 100).toFixed(2)}%`;

  const tokenAReserve = parseFloat(pool.token_a_reserve);
  const tokenBReserve = parseFloat(pool.token_b_reserve);
  const totalReserveValue = pool.tvl_usd;
  const tokenAPercent =
    totalReserveValue > 0
      ? (
          ((tokenAReserve * parseFloat(pool.token_a.price_usd || "0")) /
            totalReserveValue) *
          100
        ).toFixed(1)
      : "50.0";
  const tokenBPercent = (100 - parseFloat(tokenAPercent)).toFixed(1);

  const handleAddLiquidity = () => {
    hapticImpact("medium");
    onAddLiquidity(pool);
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-lg)" }}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--spacing-sm)",
            paddingTop: "var(--spacing-sm)",
          }}
        >
          <PoolPairIcon
            tokenAIcon={pool.token_a.icon_url}
            tokenASymbol={pool.token_a.symbol}
            tokenBIcon={pool.token_b.icon_url}
            tokenBSymbol={pool.token_b.symbol}
            size={44}
          />
          <div
            style={{
              fontSize: "var(--font-size-xl)",
              fontWeight: 700,
              color: "var(--color-text-primary)",
            }}
          >
            {pool.token_a.symbol} / {pool.token_b.symbol}
          </div>
          <div
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-tertiary)",
            }}
          >
            STON.fi Pool
          </div>
        </motion.div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--spacing-sm)",
          }}
        >
          <StatCard
            label={t("liquidity.tvl")}
            value={formatLargeNumber(pool.tvl_usd)}
            delay={0.05}
          />
          <StatCard
            label={t("liquidity.apr")}
            value={aprDisplay}
            accent
            delay={0.1}
          />
          <StatCard
            label={t("liquidity.vol_24h")}
            value={formatLargeNumber(pool.volume_24h_usd)}
            delay={0.15}
          />
          <StatCard
            label={t("liquidity.fee_rate")}
            value={feeDisplay}
            delay={0.2}
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "var(--spacing-sm)",
          }}
        >
          <StatCard
            label={t("liquidity.apr_7d")}
            value={`${pool.apr_7d.toFixed(2)}%`}
            delay={0.25}
          />
          <StatCard
            label={t("liquidity.apr_30d")}
            value={`${pool.apr_30d.toFixed(2)}%`}
            delay={0.3}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            padding: "var(--spacing-md)",
            background: "var(--color-bg-tertiary)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-md)",
          }}
        >
          <div
            style={{
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {t("liquidity.pool_composition")}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-sm)" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
                <div
                  style={{
                    fontSize: "var(--font-size-md)",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {pool.token_a.symbol}
                </div>
                <div
                  style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-tertiary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {tokenAPercent}%
                </div>
              </div>
              <div
                style={{
                  fontSize: "var(--font-size-md)",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-text-primary)",
                }}
              >
                {formatTokenAmount(tokenAReserve, 2)}
              </div>
            </div>

            <div
              style={{
                width: "100%",
                height: 6,
                borderRadius: 3,
                background: "var(--color-bg-primary)",
                overflow: "hidden",
                display: "flex",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tokenAPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
                style={{
                  height: "100%",
                  background: "var(--color-accent)",
                  borderRadius: 3,
                }}
              />
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tokenBPercent}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.35 }}
                style={{
                  height: "100%",
                  background: "var(--color-purple)",
                  borderRadius: 3,
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
                <div
                  style={{
                    fontSize: "var(--font-size-md)",
                    fontWeight: 600,
                    color: "var(--color-text-primary)",
                  }}
                >
                  {pool.token_b.symbol}
                </div>
                <div
                  style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-tertiary)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {tokenBPercent}%
                </div>
              </div>
              <div
                style={{
                  fontSize: "var(--font-size-md)",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-text-primary)",
                }}
              >
                {formatTokenAmount(tokenBReserve, 2)}
              </div>
            </div>
          </div>
        </motion.div>

        <PoolAIInsight pool={pool} />

        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleAddLiquidity}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "var(--radius-sm)",
            background: "var(--gradient-accent)",
            border: "none",
            fontSize: "var(--font-size-md)",
            fontWeight: 700,
            fontFamily: "var(--font-sans)",
            color: "var(--color-bg-primary)",
            cursor: "pointer",
            boxShadow: "var(--shadow-glow-accent)",
          }}
        >
          {t("liquidity.add_liquidity")}
        </motion.button>
      </div>
    </Sheet>
  );
}
