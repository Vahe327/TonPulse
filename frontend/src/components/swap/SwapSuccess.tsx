import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Sheet } from "../common/Sheet";

interface SwapSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  fromSymbol: string;
  toSymbol: string;
  fromAmount: string;
  toAmount: string;
}

export function SwapSuccess({
  isOpen,
  onClose,
  fromSymbol,
  toSymbol,
  fromAmount,
  toAmount,
}: SwapSuccessProps) {
  const { t } = useTranslation();

  return (
    <Sheet isOpen={isOpen} onClose={onClose}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "var(--spacing-xl) 0",
          gap: "var(--spacing-md)",
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
        >
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="40" fill="var(--color-accent-dim)" />
            <circle cx="40" cy="40" r="30" fill="var(--color-accent)" opacity="0.2" />
            <motion.path
              d="M25 40L35 50L55 30"
              stroke="var(--color-accent)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            />
          </svg>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{ textAlign: "center" }}
        >
          <div style={{ fontSize: "var(--font-size-xl)", fontWeight: 700, marginBottom: 8 }}>
            {t("swap.swap_success")}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--font-size-md)",
              color: "var(--color-text-secondary)",
            }}
          >
            {fromAmount} {fromSymbol} → {toAmount} {toSymbol}
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          onClick={onClose}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-bg-tertiary)",
            fontWeight: 600,
            fontSize: "var(--font-size-md)",
            marginTop: "var(--spacing-md)",
          }}
        >
          {t("common.done")}
        </motion.button>
      </div>
    </Sheet>
  );
}
