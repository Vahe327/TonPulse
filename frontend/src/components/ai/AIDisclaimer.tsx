import { useTranslation } from "react-i18next";
import { IoFlash } from "react-icons/io5";

export function AIDisclaimer() {
  const { t } = useTranslation();

  return (
    <div
      style={{
        fontSize: "var(--font-size-xs)",
        color: "var(--color-text-tertiary)",
        textAlign: "center",
        padding: "var(--spacing-sm) var(--spacing-md)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
      }}
    >
      <IoFlash size={10} />
      {t("ai.disclaimer")}
    </div>
  );
}
