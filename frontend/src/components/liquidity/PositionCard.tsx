import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { LPPosition } from "../../store/liquidityStore";
import { PoolPairIcon } from "./PoolPairIcon";
import { formatLargeNumber, formatTokenAmount } from "../../utils/format";
import { useTelegram } from "../../hooks/useTelegram";

interface PositionCardProps {
  position: LPPosition;
  index: number;
  onAddMore: (position: LPPosition) => void;
  onRemove: (position: LPPosition) => void;
}

export function PositionCard({
  position,
  index,
  onAddMore,
  onRemove,
}: PositionCardProps) {
  const { t } = useTranslation();
  const { hapticImpact } = useTelegram();

  const handleAddMore = () => {
    hapticImpact("light");
    onAddMore(position);
  };

  const handleRemove = () => {
    hapticImpact("light");
    onRemove(position);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        delay: index * 0.06,
      }}
      style={{
        padding: "var(--spacing-md)",
        background: "var(--color-bg-card)",
        backdropFilter: "blur(var(--blur-md))",
        WebkitBackdropFilter: "blur(var(--blur-md))",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-md)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-md)",
        }}
      >
        <PoolPairIcon
          tokenAIcon={position.token_a.icon_url}
          tokenASymbol={position.token_a.symbol}
          tokenBIcon={position.token_b.icon_url}
          tokenBSymbol={position.token_b.symbol}
          size={36}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: "var(--font-size-md)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {position.token_a.symbol} / {position.token_b.symbol}
          </div>
          <div
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-tertiary)",
              marginTop: 2,
            }}
          >
            {t("liquidity.your_share")}:{" "}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--color-accent)",
                fontWeight: 600,
              }}
            >
              {position.share_percent < 0.01
                ? "<0.01%"
                : `${position.share_percent.toFixed(2)}%`}
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "var(--font-size-lg)",
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: "var(--color-text-primary)",
            }}
          >
            {formatLargeNumber(position.value_usd)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "var(--spacing-sm)",
        }}
      >
        <div
          style={{
            padding: "10px var(--spacing-sm)",
            background: "var(--color-bg-primary)",
            borderRadius: "var(--radius-xs)",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <div
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-tertiary)",
            }}
          >
            {position.token_a.symbol}
          </div>
          <div
            style={{
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              color: "var(--color-text-primary)",
            }}
          >
            {formatTokenAmount(position.token_a_amount, 4)}
          </div>
        </div>
        <div
          style={{
            padding: "10px var(--spacing-sm)",
            background: "var(--color-bg-primary)",
            borderRadius: "var(--radius-xs)",
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <div
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-tertiary)",
            }}
          >
            {position.token_b.symbol}
          </div>
          <div
            style={{
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              color: "var(--color-text-primary)",
            }}
          >
            {formatTokenAmount(position.token_b_amount, 4)}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px var(--spacing-sm)",
          background: "var(--color-accent-dim)",
          borderRadius: "var(--radius-xs)",
        }}
      >
        <div
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-secondary)",
          }}
        >
          {t("liquidity.fees_earned")}
        </div>
        <div
          style={{
            fontSize: "var(--font-size-sm)",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color: "var(--color-accent)",
          }}
        >
          +{formatLargeNumber(position.fees_earned_usd)}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: "var(--spacing-sm)",
        }}
      >
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleAddMore}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-bg-tertiary)",
            border: "1px solid var(--color-accent)",
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            color: "var(--color-accent)",
            cursor: "pointer",
          }}
        >
          {t("liquidity.add_more")}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleRemove}
          style={{
            flex: 1,
            padding: "12px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-negative-dim)",
            border: "1px solid transparent",
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            color: "var(--color-negative)",
            cursor: "pointer",
          }}
        >
          {t("liquidity.remove")}
        </motion.button>
      </div>
    </motion.div>
  );
}
