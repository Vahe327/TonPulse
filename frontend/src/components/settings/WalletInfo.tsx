import { useTranslation } from "react-i18next";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { shortenAddress } from "../../utils/format";
import { useTelegram } from "../../hooks/useTelegram";
import toast from "react-hot-toast";

export function WalletInfo() {
  const { t } = useTranslation();
  const address = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const { hapticImpact } = useTelegram();

  if (!address) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    hapticImpact("light");
    toast.success(t("common.copied"));
  };

  const handleDisconnect = () => {
    hapticImpact("medium");
    tonConnectUI.disconnect();
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
          marginBottom: 8,
        }}
      >
        {t("settings.wallet")}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          onClick={handleCopy}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--font-size-md)",
            color: "var(--color-accent)",
          }}
        >
          {shortenAddress(address, 6)}
        </button>
        <button
          onClick={handleDisconnect}
          style={{
            padding: "6px 12px",
            borderRadius: "var(--radius-xs)",
            background: "var(--color-negative-dim)",
            color: "var(--color-negative)",
            fontSize: "var(--font-size-sm)",
            fontWeight: 600,
          }}
        >
          {t("settings.disconnect")}
        </button>
      </div>
    </div>
  );
}
