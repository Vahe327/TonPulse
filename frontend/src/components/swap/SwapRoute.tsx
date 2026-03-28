import { useTranslation } from "react-i18next";

interface SwapRouteProps {
  route: string[];
}

export function SwapRoute({ route }: SwapRouteProps) {
  const { t } = useTranslation();

  if (route.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-xs)",
        padding: "var(--spacing-sm) var(--spacing-md)",
        background: "var(--color-bg-tertiary)",
        borderRadius: "var(--radius-xs)",
        fontSize: "var(--font-size-xs)",
        color: "var(--color-text-secondary)",
        overflowX: "auto",
      }}
    >
      <span style={{ color: "var(--color-text-tertiary)", flexShrink: 0 }}>
        {t("swap.route")}:
      </span>
      {route.map((step, i) => (
        <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>
            {step}
          </span>
          {i < route.length - 1 && (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M4.5 2.5L8 6L4.5 9.5"
                stroke="var(--color-text-tertiary)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      ))}
    </div>
  );
}
