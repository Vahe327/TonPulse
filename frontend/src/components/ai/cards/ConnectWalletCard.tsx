import { useTranslation } from "react-i18next";
import { TonConnectButton } from "@tonconnect/ui-react";
import { IoLink, IoShieldCheckmark } from "react-icons/io5";
import { motion } from "framer-motion";

const cardStyle: React.CSSProperties = {
  background: "rgba(20, 25, 34, 0.9)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(124, 92, 252, 0.3)",
  borderRadius: 16,
  padding: 16,
  marginTop: 8,
  width: "100%",
};

export function ConnectWalletCard() {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={cardStyle}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, rgba(124, 92, 252, 0.2), rgba(124, 92, 252, 0.1))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IoLink size={18} color="#7C5CFC" />
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-text-primary, #EAEEF3)",
          }}
        >
          {t("ai.connect_wallet_title")}
        </div>
      </div>

      <div
        style={{
          fontSize: 13,
          color: "var(--color-text-secondary, #8A94A6)",
          lineHeight: 1.5,
          marginBottom: 16,
        }}
      >
        {t("ai.connect_description")}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: 12,
        }}
      >
        <TonConnectButton />
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontSize: 11,
          color: "var(--color-text-tertiary, #5A6478)",
        }}
      >
        <IoShieldCheckmark size={12} color="#7C5CFC" />
        {t("ai.supported_wallets")}
      </div>
    </motion.div>
  );
}
