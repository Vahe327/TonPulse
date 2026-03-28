import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { IoWarningOutline } from "react-icons/io5";
import { SimulationResponse } from "../../store/liquidityStore";
import { formatLargeNumber, formatTokenAmount } from "../../utils/format";

interface SimulationResultProps {
  simulation: SimulationResponse;
  tokenASymbol: string;
  tokenBSymbol: string;
}

export function SimulationResult({
  simulation,
  tokenASymbol,
  tokenBSymbol,
}: SimulationResultProps) {
  const { t } = useTranslation();

  const priceImpactHigh = simulation.price_impact > 1;
  const priceImpactSevere = simulation.price_impact > 5;

  const impactColor = priceImpactSevere
    ? "var(--color-negative)"
    : priceImpactHigh
      ? "var(--color-warning)"
      : "var(--color-text-secondary)";

  const impactBg = priceImpactSevere
    ? "var(--color-negative-dim)"
    : priceImpactHigh
      ? "var(--color-warning-dim)"
      : "transparent";

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-sm)",
        padding: "var(--spacing-md)",
        background: "var(--color-bg-tertiary)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          fontSize: "var(--font-size-sm)",
          fontWeight: 600,
          color: "var(--color-text-secondary)",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: 4,
        }}
      >
        {t("liquidity.simulation_result")}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
          {t("liquidity.expected_lp")}
        </div>
        <div
          style={{
            fontSize: "var(--font-size-md)",
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            color: "var(--color-text-primary)",
          }}
        >
          {formatTokenAmount(simulation.expected_lp_tokens, 6)}
        </div>
      </div>

      <div
        style={{
          height: 1,
          background: "var(--color-border)",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
          {t("liquidity.share_of_pool")}
        </div>
        <div
          style={{
            fontSize: "var(--font-size-md)",
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            color: "var(--color-accent)",
          }}
        >
          {simulation.share_of_pool < 0.01
            ? "<0.01%"
            : `${simulation.share_of_pool.toFixed(2)}%`}
        </div>
      </div>

      <div
        style={{
          height: 1,
          background: "var(--color-border)",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
          {t("liquidity.price_impact")}
        </div>
        <div
          style={{
            fontSize: "var(--font-size-md)",
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            color: impactColor,
            padding: priceImpactHigh ? "2px 8px" : undefined,
            borderRadius: priceImpactHigh ? "var(--radius-xs)" : undefined,
            background: impactBg,
          }}
        >
          {simulation.price_impact.toFixed(3)}%
        </div>
      </div>

      <div
        style={{
          height: 1,
          background: "var(--color-border)",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
          {t("liquidity.total_value")}
        </div>
        <div
          style={{
            fontSize: "var(--font-size-md)",
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            color: "var(--color-text-primary)",
          }}
        >
          {formatLargeNumber(simulation.value_usd)}
        </div>
      </div>

      {parseFloat(simulation.token_a_actual) > 0 && (
        <>
          <div style={{ height: 1, background: "var(--color-border)" }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-secondary)",
              }}
            >
              {tokenASymbol}
            </div>
            <div
              style={{
                fontSize: "var(--font-size-md)",
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-primary)",
              }}
            >
              {formatTokenAmount(simulation.token_a_actual, 6)}
            </div>
          </div>
        </>
      )}

      {parseFloat(simulation.token_b_actual) > 0 && (
        <>
          <div style={{ height: 1, background: "var(--color-border)" }} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-secondary)",
              }}
            >
              {tokenBSymbol}
            </div>
            <div
              style={{
                fontSize: "var(--font-size-md)",
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-primary)",
              }}
            >
              {formatTokenAmount(simulation.token_b_actual, 6)}
            </div>
          </div>
        </>
      )}

      {priceImpactHigh && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            marginTop: "var(--spacing-xs)",
            padding: "10px var(--spacing-sm)",
            borderRadius: "var(--radius-xs)",
            background: priceImpactSevere
              ? "var(--color-negative-dim)"
              : "var(--color-warning-dim)",
            display: "flex",
            alignItems: "flex-start",
            gap: "var(--spacing-sm)",
          }}
        >
          <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>
            <IoWarningOutline size={14} />
          </span>
          <div
            style={{
              fontSize: "var(--font-size-xs)",
              color: priceImpactSevere
                ? "var(--color-negative)"
                : "var(--color-warning)",
              lineHeight: 1.4,
            }}
          >
            {priceImpactSevere
              ? t("liquidity.price_impact_severe")
              : t("liquidity.price_impact_warning")}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
