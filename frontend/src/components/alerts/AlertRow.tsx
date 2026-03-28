import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { TokenIcon } from "../common/TokenIcon";
import { formatPrice } from "../../utils/format";
import { useTelegram } from "../../hooks/useTelegram";

interface AlertRowProps {
  id: string;
  tokenSymbol: string;
  tokenAddress: string;
  condition: string;
  targetPrice: string;
  isActive: boolean;
  triggeredAt: string | null;
  onDelete: (id: string) => void;
  index: number;
}

export function AlertRow({
  id,
  tokenSymbol,
  tokenAddress,
  condition,
  targetPrice,
  isActive,
  triggeredAt,
  onDelete,
  index,
}: AlertRowProps) {
  const { t } = useTranslation();
  const { hapticImpact } = useTelegram();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-sm)",
        padding: "12px var(--spacing-md)",
        borderBottom: "1px solid var(--color-border)",
        opacity: isActive ? 1 : 0.5,
      }}
    >
      <TokenIcon src={null} symbol={tokenSymbol} size={36} address={tokenAddress} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{tokenSymbol}</div>
        <div
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-secondary)",
          }}
        >
          {condition === "above" ? t("alerts.above") : t("alerts.below")}{" "}
          <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>
            {formatPrice(targetPrice)}
          </span>
        </div>
      </div>
      {triggeredAt && (
        <div
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-accent)",
            padding: "2px 8px",
            borderRadius: "var(--radius-full)",
            background: "var(--color-accent-dim)",
          }}
        >
          Triggered
        </div>
      )}
      <button
        onClick={() => {
          hapticImpact("medium");
          onDelete(id);
        }}
        style={{
          width: 32,
          height: 32,
          borderRadius: "50%",
          background: "var(--color-negative-dim)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3.5 3.5l7 7m-7 0l7-7" stroke="var(--color-negative)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </motion.div>
  );
}
