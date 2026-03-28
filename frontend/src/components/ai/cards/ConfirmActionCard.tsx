import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IoWarning } from "react-icons/io5";
import { motion } from "framer-motion";
import { useTelegram } from "../../../hooks/useTelegram";

const cardStyle: React.CSSProperties = {
  background: "rgba(20, 25, 34, 0.9)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(255, 165, 0, 0.3)",
  borderRadius: 16,
  padding: 16,
  marginTop: 8,
  width: "100%",
};

interface ConfirmActionCardProps {
  data: Record<string, any>;
  onComplete: () => void;
}

export function ConfirmActionCard({ data, onComplete }: ConfirmActionCardProps) {
  const { t } = useTranslation();
  const { hapticImpact } = useTelegram();
  const [confirmed, setConfirmed] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const description: string = data.description || data.text || "";
  const warning: string = data.warning || "";
  const confirmLabel: string = data.confirm_label || t("ai.confirm");
  const cancelLabel: string = data.cancel_label || t("common.cancel");

  const handleConfirm = () => {
    hapticImpact("medium");
    setConfirmed(true);
    onComplete();
  };

  const handleCancel = () => {
    hapticImpact("light");
    setCancelled(true);
  };

  if (confirmed) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          ...cardStyle,
          border: "1px solid rgba(0, 212, 170, 0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "8px 0",
            color: "#00D4AA",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          {t("ai.completed")}
        </div>
      </motion.div>
    );
  }

  if (cancelled) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={{
          ...cardStyle,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          opacity: 0.5,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "8px 0",
            color: "var(--color-text-secondary, #8A94A6)",
            fontSize: 13,
          }}
        >
          {t("common.cancel")}
        </div>
      </motion.div>
    );
  }

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
            background: "rgba(255, 165, 0, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IoWarning size={20} color="#FFA500" />
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-text-primary, #EAEEF3)",
          }}
        >
          {t("ai.confirm_action")}
        </div>
      </div>

      {description && (
        <div
          style={{
            fontSize: 13,
            color: "var(--color-text-secondary, #8A94A6)",
            lineHeight: 1.5,
            marginBottom: 12,
          }}
        >
          {description}
        </div>
      )}

      {warning && (
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(255, 71, 87, 0.08)",
            border: "1px solid rgba(255, 71, 87, 0.2)",
            fontSize: 12,
            color: "#FF4757",
            lineHeight: 1.5,
            marginBottom: 14,
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <IoWarning size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{warning}</span>
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleConfirm}
          style={{
            flex: 1,
            padding: "11px 16px",
            borderRadius: 12,
            background: "linear-gradient(135deg, #00D4AA, #00B894)",
            border: "none",
            color: "#0A0E14",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {confirmLabel}
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleCancel}
          style={{
            flex: 1,
            padding: "11px 16px",
            borderRadius: 12,
            background: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "var(--color-text-secondary, #8A94A6)",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {cancelLabel}
        </motion.button>
      </div>
    </motion.div>
  );
}
