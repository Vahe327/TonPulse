import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { IoSparkles, IoClose } from "react-icons/io5";
import { api } from "../../services/api";
import { useTelegram } from "../../hooks/useTelegram";
import { PoolData } from "../../store/liquidityStore";

interface PoolAIInsightProps {
  pool: PoolData;
}

interface PoolInsight {
  tvl_assessment: string;
  apr_sustainability: string;
  il_risk: string;
  overall: string;
  sentiment: "positive" | "neutral" | "negative";
  cached: boolean;
}

const sentimentConfig = {
  positive: { border: "var(--color-accent)", bg: "var(--color-accent-dim)" },
  neutral: { border: "var(--color-purple)", bg: "var(--color-purple-dim)" },
  negative: { border: "var(--color-negative)", bg: "var(--color-negative-dim)" },
};

export function PoolAIInsight({ pool }: PoolAIInsightProps) {
  const { t, i18n } = useTranslation();
  const { hapticImpact, hapticNotification } = useTelegram();
  const [insight, setInsight] = useState<PoolInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchInsight = useCallback(async () => {
    setLoading(true);
    setError(false);
    hapticImpact("light");
    try {
      const result = await api.post<PoolInsight>(`/ai/analyze-token?lang=${i18n.language}`, {
        token_address: pool.address,
        token_symbol: `${pool.token_a.symbol}/${pool.token_b.symbol}`,
        token_name: `${pool.token_a.name}/${pool.token_b.name} Pool`,
        price_usd: pool.tvl_usd,
        volume_24h: pool.volume_24h_usd,
        liquidity: pool.tvl_usd,
        market_cap: pool.tvl_usd,
        context: "liquidity_pool",
        apr_24h: pool.apr_24h,
        fee_rate: pool.fee_rate,
      });

      const mapped: PoolInsight = {
        tvl_assessment:
          (result as unknown as Record<string, string>).liquidity_assessment ||
          (result as unknown as Record<string, string>).tvl_assessment ||
          "",
        apr_sustainability:
          (result as unknown as Record<string, string>).price_analysis ||
          (result as unknown as Record<string, string>).apr_sustainability ||
          "",
        il_risk:
          (result as unknown as Record<string, string>).volume_analysis ||
          (result as unknown as Record<string, string>).il_risk ||
          "",
        overall:
          (result as unknown as Record<string, string>).summary ||
          (result as unknown as Record<string, string>).overall ||
          "",
        sentiment:
          ((result as unknown as Record<string, string>).outlook || "")
            .toLowerCase()
            .includes("bearish")
            ? "negative"
            : ((result as unknown as Record<string, string>).outlook || "")
                  .toLowerCase()
                  .includes("bullish")
              ? "positive"
              : "neutral",
        cached: (result as unknown as Record<string, boolean>).cached || false,
      };

      setInsight(mapped);
      setExpanded(true);
      hapticNotification("success");
    } catch {
      setError(true);
      hapticNotification("error");
    } finally {
      setLoading(false);
    }
  }, [pool, hapticImpact, hapticNotification]);

  const colors =
    sentimentConfig[insight?.sentiment || "neutral"];

  const insightSections = insight
    ? [
        {
          label: t("liquidity.ai_tvl_depth"),
          text: insight.tvl_assessment,
        },
        {
          label: t("liquidity.ai_apr_sustainability"),
          text: insight.apr_sustainability,
        },
        {
          label: t("liquidity.ai_il_risk"),
          text: insight.il_risk,
        },
      ].filter((s) => s.text)
    : [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-sm)",
      }}
    >
      {!insight && !loading && (
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={fetchInsight}
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-purple-dim)",
            border: "1px solid rgba(124, 92, 252, 0.2)",
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            color: "var(--color-purple)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing-sm)",
          }}
        >
          <IoSparkles size={14} />
          {t("liquidity.ai_pool_analysis")}
        </motion.button>
      )}

      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: "var(--spacing-md)",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-purple-dim)",
            border: "1px solid rgba(124, 92, 252, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: "var(--spacing-sm)",
          }}
        >
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: "50%",
              border: "2px solid var(--color-purple)",
              borderTopColor: "transparent",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <div
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-purple)",
              fontWeight: 500,
            }}
          >
            {t("liquidity.ai_analyzing")}
          </div>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: "var(--spacing-md)",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-negative-dim)",
            border: "1px solid rgba(255, 71, 87, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: "var(--font-size-sm)",
              color: "var(--color-negative)",
            }}
          >
            {t("ai.error_ai")}
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={fetchInsight}
            style={{
              padding: "4px 10px",
              borderRadius: "var(--radius-xs)",
              background: "transparent",
              border: "1px solid var(--color-negative)",
              fontSize: "var(--font-size-xs)",
              fontWeight: 600,
              fontFamily: "var(--font-sans)",
              color: "var(--color-negative)",
              cursor: "pointer",
            }}
          >
            {t("common.retry")}
          </motion.button>
        </motion.div>
      )}

      <AnimatePresence>
        {insight && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              padding: "var(--spacing-md)",
              borderRadius: "var(--radius-sm)",
              background: colors.bg,
              border: `1px solid ${colors.border}33`,
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-md)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-sm)",
                }}
              >
                <IoSparkles size={14} />
                <div
                  style={{
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 700,
                    color: colors.border,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  {t("liquidity.ai_pool_analysis")}
                </div>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setExpanded(false)}
                style={{
                  padding: "2px 8px",
                  borderRadius: "var(--radius-xs)",
                  background: "transparent",
                  border: "none",
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-text-tertiary)",
                  cursor: "pointer",
                }}
              >
                <IoClose size={14} />
              </motion.button>
            </div>

            {insight.overall && (
              <div
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-primary)",
                  lineHeight: 1.5,
                  fontWeight: 500,
                }}
              >
                {insight.overall}
              </div>
            )}

            {insightSections.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--spacing-sm)",
                }}
              >
                {insightSections.map((section) => (
                  <div
                    key={section.label}
                    style={{
                      padding: "10px var(--spacing-sm)",
                      background: "rgba(0,0,0,0.15)",
                      borderRadius: "var(--radius-xs)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "var(--font-size-xs)",
                        fontWeight: 600,
                        color: colors.border,
                        marginBottom: 4,
                      }}
                    >
                      {section.label}
                    </div>
                    <div
                      style={{
                        fontSize: "var(--font-size-sm)",
                        color: "var(--color-text-secondary)",
                        lineHeight: 1.4,
                      }}
                    >
                      {section.text}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div
              style={{
                fontSize: "var(--font-size-xs)",
                color: "var(--color-text-tertiary)",
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              {t("ai.disclaimer")}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {insight && !expanded && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setExpanded(true)}
          style={{
            width: "100%",
            padding: "10px",
            borderRadius: "var(--radius-sm)",
            background: colors.bg,
            border: `1px solid ${colors.border}33`,
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            color: colors.border,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing-sm)",
          }}
        >
          <IoSparkles size={14} />
          {t("liquidity.ai_show_analysis")}
        </motion.button>
      )}
    </div>
  );
}
