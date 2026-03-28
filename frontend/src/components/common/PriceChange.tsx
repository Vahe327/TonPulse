import { formatPercent } from "../../utils/format";

interface PriceChangeProps {
  value: string | number | null;
  fontSize?: string;
}

export function PriceChange({
  value,
  fontSize = "var(--font-size-sm)",
}: PriceChangeProps) {
  if (value === null || value === undefined) {
    return (
      <span style={{ fontSize, color: "var(--color-text-tertiary)" }}>—</span>
    );
  }

  const num = typeof value === "string" ? parseFloat(value) : value;
  const isPositive = num >= 0;

  return (
    <span
      style={{
        fontSize,
        fontWeight: 500,
        fontFamily: "var(--font-mono)",
        color: isPositive ? "var(--color-accent)" : "var(--color-negative)",
      }}
    >
      {formatPercent(num)}
    </span>
  );
}
