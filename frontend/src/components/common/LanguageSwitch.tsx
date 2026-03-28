import { useTranslation } from "react-i18next";
import { api } from "../../services/api";
import { useTelegram } from "../../hooks/useTelegram";

export function LanguageSwitch() {
  const { i18n } = useTranslation();
  const { hapticImpact } = useTelegram();
  const currentLang = i18n.language;

  const toggle = async () => {
    hapticImpact("light");
    const newLang = currentLang === "en" ? "ru" : "en";
    await i18n.changeLanguage(newLang);
    try {
      await api.patch("/user", { language: newLang });
    } catch {
      // silent
    }
  };

  return (
    <button
      onClick={toggle}
      style={{
        padding: "6px 10px",
        borderRadius: "var(--radius-xs)",
        background: "var(--color-bg-tertiary)",
        border: "1px solid var(--color-border)",
        fontSize: "var(--font-size-xs)",
        fontWeight: 600,
        color: "var(--color-text-secondary)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        transition: "all var(--duration-fast) ease",
      }}
    >
      {currentLang === "en" ? "RU" : "EN"}
    </button>
  );
}
