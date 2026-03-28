import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PageTransition } from "../components/layout/PageTransition";
import { AlertList } from "../components/alerts/AlertList";
import { CreateAlert } from "../components/alerts/CreateAlert";
import { useAlerts } from "../hooks/useAlerts";
import { useTelegram } from "../hooks/useTelegram";
import toast from "react-hot-toast";

export function AlertsPage() {
  const { t } = useTranslation();
  const { hapticImpact, hapticNotification } = useTelegram();
  const { alerts, createAlert, deleteAlert } = useAlerts();
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreate = async (params: {
    token_address: string;
    token_symbol: string;
    condition: "above" | "below";
    target_price: number;
    current_price_at_creation: number;
  }) => {
    try {
      await createAlert(params);
      hapticNotification("success");
      toast.success(t("alerts.alert_created"));
    } catch (err) {
      hapticNotification("error");
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(msg);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAlert(id);
      hapticNotification("success");
      toast.success(t("alerts.alert_deleted"));
    } catch {
      hapticNotification("error");
      toast.error(t("common.error"));
    }
  };

  return (
    <PageTransition>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--spacing-md)",
        }}
      >
        <h1 style={{ fontSize: "var(--font-size-xl)", fontWeight: 700 }}>
          {t("alerts.title")}
        </h1>
        <button
          onClick={() => {
            hapticImpact("light");
            setCreateOpen(true);
          }}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--gradient-accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 3v12m-6-6h12" stroke="#0A0E14" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <AlertList alerts={alerts} onDelete={handleDelete} />

      <CreateAlert
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </PageTransition>
  );
}
