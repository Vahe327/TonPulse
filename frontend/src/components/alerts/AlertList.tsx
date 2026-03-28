import { useTranslation } from "react-i18next";
import { AlertRow } from "./AlertRow";

interface Alert {
  id: string;
  token_symbol: string;
  token_address: string;
  condition: string;
  target_price: string;
  is_active: boolean;
  triggered_at: string | null;
}

interface AlertListProps {
  alerts: Alert[];
  onDelete: (id: string) => void;
}

export function AlertList({ alerts, onDelete }: AlertListProps) {
  const { t } = useTranslation();

  if (alerts.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--spacing-xxl) var(--spacing-md)",
          textAlign: "center",
        }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          fill="none"
          style={{ marginBottom: "var(--spacing-md)", opacity: 0.3 }}
        >
          <circle cx="32" cy="32" r="28" stroke="var(--color-text-tertiary)" strokeWidth="2" />
          <path
            d="M32 18v16l10 6"
            stroke="var(--color-text-tertiary)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            fontSize: "var(--font-size-lg)",
            fontWeight: 600,
            color: "var(--color-text-secondary)",
            marginBottom: 4,
          }}
        >
          {t("alerts.no_alerts")}
        </div>
        <div
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-tertiary)",
            maxWidth: 240,
          }}
        >
          {t("alerts.no_alerts_desc")}
        </div>
      </div>
    );
  }

  return (
    <div>
      {alerts.map((alert, i) => (
        <AlertRow
          key={alert.id}
          id={alert.id}
          tokenSymbol={alert.token_symbol}
          tokenAddress={alert.token_address}
          condition={alert.condition}
          targetPrice={alert.target_price}
          isActive={alert.is_active}
          triggeredAt={alert.triggered_at}
          onDelete={onDelete}
          index={i}
        />
      ))}
    </div>
  );
}
