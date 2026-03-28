import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTonAddress, useTonConnectUI } from "@tonconnect/ui-react";
import { IoLink, IoCardOutline, IoWallet, IoEllipse } from "react-icons/io5";

export function ChatContextBar() {
  const { t } = useTranslation();
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();

  const hasWallet = !!walletAddress;

  const handleConnect = useCallback(() => {
    tonConnectUI.openModal();
  }, [tonConnectUI]);

  const shortenAddr = (addr: string) =>
    addr.length <= 11 ? addr : `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  if (!hasWallet) {
    return (
      <div
        onClick={handleConnect}
        style={{
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "0 16px",
          background: "rgba(124, 92, 252, 0.08)",
          borderBottom: "1px solid rgba(124, 92, 252, 0.15)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <IoLink size={14} color="#7C5CFC" />
        <span style={{ fontSize: 12, fontWeight: 500, color: "#7C5CFC" }}>
          {t("ai.wallet_not_connected")}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        height: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "0 16px",
        background: "rgba(0, 212, 170, 0.04)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        flexShrink: 0,
      }}
    >
      <IoWallet size={14} color="var(--color-text-secondary, #8A94A6)" />
      <IoEllipse size={6} color="#00D4AA" />
      <span style={{ fontSize: 11, color: "var(--color-text-tertiary, #5A6478)" }}>
        {shortenAddr(walletAddress)}
      </span>
    </div>
  );
}
