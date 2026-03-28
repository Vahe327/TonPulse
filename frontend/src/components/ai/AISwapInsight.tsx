import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { IoBulbOutline } from "react-icons/io5";
import { useAI } from "../../hooks/useAI";

interface AISwapInsightProps {
  fromAddress: string | null;
  toAddress: string | null;
  amount: string;
  pairUnavailable?: boolean;
}

const sentimentConfig = {
  positive: { border: "var(--color-accent)", bg: "var(--color-accent-dim)" },
  neutral: { border: "var(--color-purple)", bg: "var(--color-purple-dim)" },
  negative: { border: "var(--color-negative)", bg: "var(--color-negative-dim)" },
};

export function AISwapInsight({ fromAddress, toAddress, amount, pairUnavailable }: AISwapInsightProps) {
  const { t } = useTranslation();
  const { getSwapInsight } = useAI();
  const [insight, setInsight] = useState<{ insight: string; sentiment: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fromAddress || !toAddress) {
      setInsight(null);
      return;
    }

    const hasValidAmount = amount && parseFloat(amount) > 0;
    if (!hasValidAmount && !pairUnavailable) {
      setInsight(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const effectiveAmount = hasValidAmount ? amount : "0";
      const result = await getSwapInsight(fromAddress, toAddress, effectiveAmount);
      if (!cancelled && result) {
        setInsight(result);
      }
      if (!cancelled) setLoading(false);
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [fromAddress, toAddress, amount, pairUnavailable, getSwapInsight]);

  if (!fromAddress || !toAddress || (!insight && !loading)) return null;

  const colors = sentimentConfig[(insight?.sentiment as keyof typeof sentimentConfig) || "neutral"];

  return (
    <AnimatePresence>
      {(loading || insight) && (
        <motion.div
          initial={{ opacity: 0, y: 8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: "auto" }}
          exit={{ opacity: 0, y: 8, height: 0 }}
          style={{
            margin: "0 var(--spacing-md)",
            padding: "10px var(--spacing-md)",
            borderRadius: "var(--radius-sm)",
            background: colors.bg,
            border: `1px solid ${colors.border}33`,
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--spacing-sm)",
          }}
        >
          <IoBulbOutline size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "var(--font-size-xs)",
                fontWeight: 600,
                color: colors.border,
                marginBottom: 2,
              }}
            >
              {t("ai.swap_insight")}
            </div>
            {loading ? (
              <div
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-secondary)",
                  animation: "pulse 1.5s infinite",
                }}
              >
                ...
              </div>
            ) : (
              <div
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-primary)",
                  lineHeight: 1.4,
                }}
              >
                {insight?.insight}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
