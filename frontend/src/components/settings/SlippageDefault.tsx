import { useTranslation } from "react-i18next";
import { useUserStore } from "../../store/userStore";
import { api } from "../../services/api";
import { useTelegram } from "../../hooks/useTelegram";
import { SLIPPAGE_OPTIONS } from "../../utils/constants";

export function SlippageDefault() {
  const { t } = useTranslation();
  const { hapticImpact } = useTelegram();
  const user = useUserStore((s) => s.user);
  const updateUser = useUserStore((s) => s.updateUser);

  const current = user?.default_slippage || 1;

  const handleChange = async (value: number) => {
    hapticImpact("light");
    updateUser({ default_slippage: value });
    try {
      await api.patch("/user", { default_slippage: value });
    } catch {
      updateUser({ default_slippage: current });
    }
  };

  return (
    <div
      style={{
        padding: "var(--spacing-md)",
        background: "var(--color-bg-card)",
        borderRadius: "var(--radius-md)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          fontSize: "var(--font-size-sm)",
          color: "var(--color-text-secondary)",
          marginBottom: "var(--spacing-sm)",
        }}
      >
        {t("settings.default_slippage")}
      </div>
      <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
        {SLIPPAGE_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => handleChange(opt)}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "var(--radius-xs)",
              background:
                current === opt
                  ? "var(--color-accent-dim)"
                  : "var(--color-bg-tertiary)",
              border: `1px solid ${
                current === opt ? "var(--color-accent)" : "var(--color-border)"
              }`,
              color:
                current === opt
                  ? "var(--color-accent)"
                  : "var(--color-text-primary)",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              fontSize: "var(--font-size-sm)",
              transition: "all var(--duration-fast) ease",
            }}
          >
            {opt}%
          </button>
        ))}
      </div>
    </div>
  );
}
