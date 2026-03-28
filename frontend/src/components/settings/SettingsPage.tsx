import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { WalletInfo } from "./WalletInfo";
import { SlippageDefault } from "./SlippageDefault";
import { LanguageSwitch } from "../common/LanguageSwitch";
import { useTelegram } from "../../hooks/useTelegram";

export function SettingsContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hapticImpact } = useTelegram();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--spacing-md)",
        padding: "var(--spacing-md)",
      }}
    >
      <WalletInfo />

      <div
        style={{
          padding: "var(--spacing-md)",
          background: "var(--color-bg-card)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
          {t("settings.language")}
        </span>
        <LanguageSwitch />
      </div>

      <SlippageDefault />

      <button
        onClick={() => {
          hapticImpact("light");
          navigate("/alerts");
        }}
        style={{
          padding: "var(--spacing-md)",
          background: "var(--color-bg-card)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          textAlign: "left",
        }}
      >
        <span>{t("alerts.title")}</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M6 4l4 4-4 4" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      <div
        style={{
          textAlign: "center",
          padding: "var(--spacing-lg) 0",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 4,
        }}
      >
        <div
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-tertiary)",
          }}
        >
          {t("settings.about")}
        </div>
        <div
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-tertiary)",
          }}
        >
          {t("settings.version")} 1.0.0
        </div>
        <div
          style={{
            fontSize: "var(--font-size-xs)",
            color: "var(--color-accent)",
            marginTop: 4,
          }}
        >
          {t("swap.powered_by")}
        </div>
      </div>
    </motion.div>
  );
}
