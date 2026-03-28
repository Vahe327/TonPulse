import { TonConnectButton } from "@tonconnect/ui-react";
import { LanguageSwitch } from "../common/LanguageSwitch";

export function Header() {
  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px var(--spacing-md)",
        height: "var(--header-height)",
        background: "rgba(10, 14, 20, 0.9)",
        backdropFilter: "blur(var(--blur-sm))",
        borderBottom: "1px solid var(--color-border)",
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-sm)",
        }}
      >
        <img
          src="/icons/TP.png"
          alt="TonPulse"
          style={{
            width: 176,
            height: 176,
            borderRadius: "var(--radius-xs)",
            objectFit: "contain",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-sm)",
        }}
      >
        <LanguageSwitch />
        <TonConnectButton />
      </div>
    </header>
  );
}
