import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Sheet } from "../common/Sheet";
import { SLIPPAGE_OPTIONS } from "../../utils/constants";
import { useTelegram } from "../../hooks/useTelegram";

interface SlippageSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  value: number;
  onChange: (value: number) => void;
}

export function SlippageSettings({
  isOpen,
  onClose,
  value,
  onChange,
}: SlippageSettingsProps) {
  const { t } = useTranslation();
  const { hapticImpact } = useTelegram();
  const [custom, setCustom] = useState("");

  const handlePreset = (v: number) => {
    hapticImpact("light");
    onChange(v);
    setCustom("");
  };

  const handleCustom = (val: string) => {
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setCustom(val);
      const num = parseFloat(val);
      if (!isNaN(num) && num > 0 && num <= 50) {
        onChange(num);
      }
    }
  };

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={t("swap.slippage")}>
      <div
        style={{
          display: "flex",
          gap: "var(--spacing-sm)",
          marginBottom: "var(--spacing-md)",
        }}
      >
        {SLIPPAGE_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => handlePreset(opt)}
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: "var(--radius-sm)",
              background:
                value === opt && !custom
                  ? "var(--color-accent-dim)"
                  : "var(--color-bg-tertiary)",
              border: `1px solid ${
                value === opt && !custom
                  ? "var(--color-accent)"
                  : "var(--color-border)"
              }`,
              color:
                value === opt && !custom
                  ? "var(--color-accent)"
                  : "var(--color-text-primary)",
              fontWeight: 600,
              fontSize: "var(--font-size-md)",
              fontFamily: "var(--font-mono)",
              transition: "all var(--duration-fast) ease",
            }}
          >
            {opt}%
          </button>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-sm)",
          padding: "12px var(--spacing-md)",
          borderRadius: "var(--radius-sm)",
          background: "var(--color-bg-tertiary)",
          border: `1px solid ${custom ? "var(--color-purple)" : "var(--color-border)"}`,
        }}
      >
        <input
          type="text"
          inputMode="decimal"
          value={custom}
          onChange={(e) => handleCustom(e.target.value)}
          placeholder="Custom"
          style={{
            flex: 1,
            background: "transparent",
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-mono)",
            fontSize: "var(--font-size-md)",
          }}
        />
        <span style={{ color: "var(--color-text-tertiary)" }}>%</span>
      </div>
    </Sheet>
  );
}
