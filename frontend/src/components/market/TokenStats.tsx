import { useTranslation } from "react-i18next";
import { formatLargeNumber } from "../../utils/format";

interface TokenStatsProps {
  marketCap: string | null;
  volume24h: string | null;
  liquidity: string | null;
}

export function TokenStats({ marketCap, volume24h, liquidity }: TokenStatsProps) {
  const { t } = useTranslation();

  const stats = [
    { label: t("market.market_cap"), value: marketCap },
    { label: t("market.volume_24h"), value: volume24h },
    { label: t("token.liquidity"), value: liquidity },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "var(--spacing-sm)",
        padding: "var(--spacing-md)",
      }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            padding: "var(--spacing-sm)",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-bg-card)",
            border: "1px solid var(--color-border)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "var(--font-size-xs)",
              color: "var(--color-text-secondary)",
              marginBottom: 4,
            }}
          >
            {stat.label}
          </div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
            }}
          >
            {stat.value ? formatLargeNumber(stat.value) : "—"}
          </div>
        </div>
      ))}
    </div>
  );
}
