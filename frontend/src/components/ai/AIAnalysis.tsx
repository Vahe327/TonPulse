import { useState, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { IoSparkles, IoTrendingUpOutline, IoWaterOutline, IoBarChartOutline } from "react-icons/io5";
import { Sheet } from "../common/Sheet";
import { AILoading } from "./AILoading";
import { AIDisclaimer } from "./AIDisclaimer";
import { useAI } from "../../hooks/useAI";
import { useTelegram } from "../../hooks/useTelegram";

interface TokenData {
  address: string;
  symbol: string;
  name: string;
  price_usd: string | null;
  change_24h: string | null;
  volume_24h: string | null;
  liquidity: string | null;
  market_cap: string | null;
}

interface AIAnalysisProps {
  token: TokenData;
}

interface Analysis {
  summary: string;
  risk_score: number;
  risk_factors: string[];
  strengths: string[];
  price_analysis: string;
  liquidity_assessment: string;
  volume_analysis: string;
  outlook: string;
  confidence: string;
  cached: boolean;
}

function RiskGauge({ score }: { score: number }) {
  const angle = -90 + (score - 1) * 20;
  const color = score <= 3 ? "#00D4AA" : score <= 6 ? "#FFA502" : "#FF4757";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "var(--spacing-md) 0" }}>
      <svg width="160" height="90" viewBox="0 0 160 90">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#00D4AA" />
            <stop offset="50%" stopColor="#FFA502" />
            <stop offset="100%" stopColor="#FF4757" />
          </linearGradient>
        </defs>
        <path
          d="M 15 80 A 65 65 0 0 1 145 80"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 15 80 A 65 65 0 0 1 145 80"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="204"
          strokeDashoffset={204 - (score / 10) * 204}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <line
          x1="80"
          y1="80"
          x2={80 + 45 * Math.cos((angle * Math.PI) / 180)}
          y2={80 + 45 * Math.sin((angle * Math.PI) / 180)}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transition: "all 1s ease" }}
        />
        <circle cx="80" cy="80" r="4" fill={color} />
      </svg>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--font-size-xxl)",
          fontWeight: 700,
          color,
          marginTop: -8,
        }}
      >
        {score}/10
      </div>
      <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
        {score <= 3 ? "Low Risk" : score <= 6 ? "Moderate Risk" : score <= 8 ? "High Risk" : "Very High Risk"}
      </div>
    </div>
  );
}

export function AIAnalysis({ token }: AIAnalysisProps) {
  const { t } = useTranslation();
  const { hapticImpact } = useTelegram();
  const { analyzeToken, isLoading, error } = useAI();
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const handleOpen = async () => {
    hapticImpact("medium");
    setIsOpen(true);
    if (analysis) return;

    const result = await analyzeToken({
      token_address: token.address,
      token_symbol: token.symbol,
      token_name: token.name,
      price_usd: parseFloat(token.price_usd || "0"),
      price_change_24h: token.change_24h ? parseFloat(token.change_24h) : undefined,
      volume_24h: token.volume_24h ? parseFloat(token.volume_24h) : undefined,
      liquidity: token.liquidity ? parseFloat(token.liquidity) : undefined,
      market_cap: token.market_cap ? parseFloat(token.market_cap) : undefined,
    });
    if (result) setAnalysis(result);
  };

  const handleRefresh = async () => {
    hapticImpact("light");
    setAnalysis(null);
    const result = await analyzeToken({
      token_address: token.address,
      token_symbol: token.symbol,
      token_name: token.name,
      price_usd: parseFloat(token.price_usd || "0"),
      price_change_24h: token.change_24h ? parseFloat(token.change_24h) : undefined,
      volume_24h: token.volume_24h ? parseFloat(token.volume_24h) : undefined,
      liquidity: token.liquidity ? parseFloat(token.liquidity) : undefined,
      market_cap: token.market_cap ? parseFloat(token.market_cap) : undefined,
    });
    if (result) setAnalysis(result);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        style={{
          flex: 1,
          padding: "14px",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-purple-dim)",
          border: "1px solid var(--color-purple)",
          color: "var(--color-purple)",
          fontWeight: 700,
          fontSize: "var(--font-size-md)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <IoSparkles size={16} />
        {t("ai.analysis")}
      </button>

      <Sheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={`${t("ai.analysis")} — ${token.symbol}`}
      >
        {isLoading && !analysis && (
          <AILoading text={t("ai.analyzing", { symbol: token.symbol })} />
        )}

        {error && !analysis && (
          <div style={{ textAlign: "center", padding: "var(--spacing-xl)", color: "var(--color-negative)" }}>
            {t("ai.error_ai")}
            <button
              onClick={handleRefresh}
              style={{
                display: "block",
                margin: "var(--spacing-md) auto 0",
                padding: "8px 20px",
                borderRadius: "var(--radius-xs)",
                background: "var(--color-bg-tertiary)",
                color: "var(--color-text-primary)",
                fontWeight: 600,
              }}
            >
              {t("common.retry")}
            </button>
          </div>
        )}

        {analysis && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}
          >
            <RiskGauge score={analysis.risk_score} />

            <div
              style={{
                fontSize: "var(--font-size-md)",
                lineHeight: 1.5,
                color: "var(--color-text-primary)",
                padding: "0 var(--spacing-xs)",
              }}
            >
              {analysis.summary}
            </div>

            {analysis.risk_factors.length > 0 && (
              <div>
                <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: 6, color: "var(--color-negative)" }}>
                  {t("ai.risk_factors")}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {analysis.risk_factors.map((f, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "var(--radius-full)",
                        background: "var(--color-negative-dim)",
                        border: "1px solid rgba(255,71,87,0.3)",
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-negative)",
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.strengths.length > 0 && (
              <div>
                <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: 6, color: "var(--color-accent)" }}>
                  {t("ai.strengths")}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {analysis.strengths.map((s, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "var(--radius-full)",
                        background: "var(--color-accent-dim)",
                        border: "1px solid rgba(0,212,170,0.3)",
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-accent)",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {([
              { key: "price_analysis", icon: <IoTrendingUpOutline size={16} />, label: t("ai.price_analysis") },
              { key: "liquidity_assessment", icon: <IoWaterOutline size={16} />, label: t("ai.liquidity_assessment") },
              { key: "volume_analysis", icon: <IoBarChartOutline size={16} />, label: t("ai.volume_analysis") },
            ] as { key: string; icon: ReactNode; label: string }[]).map(({ key, icon, label }) => (
              <div key={key}>
                <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                  <span>{icon}</span> {label}
                </div>
                <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                  {(analysis as any)[key]}
                </div>
              </div>
            ))}

            <div
              style={{
                padding: "var(--spacing-md)",
                borderRadius: "var(--radius-sm)",
                background: "linear-gradient(135deg, rgba(124,92,252,0.1), rgba(0,212,170,0.1))",
                border: "1px solid rgba(124,92,252,0.2)",
              }}
            >
              <div style={{ fontSize: "var(--font-size-sm)", fontWeight: 600, marginBottom: 4 }}>
                {t("ai.outlook")}
              </div>
              <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-primary)", lineHeight: 1.5 }}>
                {analysis.outlook}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>
                {t("ai.confidence")}: {t(`ai.confidence_${analysis.confidence.toLowerCase()}`)}
                {analysis.cached && " (cached)"}
              </span>
              <button
                onClick={handleRefresh}
                style={{
                  fontSize: "var(--font-size-xs)",
                  color: "var(--color-purple)",
                  fontWeight: 600,
                }}
              >
                {t("ai.refresh")}
              </button>
            </div>

            <AIDisclaimer />
          </motion.div>
        )}
      </Sheet>
    </>
  );
}
