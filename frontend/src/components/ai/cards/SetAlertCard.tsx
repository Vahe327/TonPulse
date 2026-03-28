import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { IoNotifications, IoCheckmarkCircle, IoChevronDown } from "react-icons/io5";
import { motion } from "framer-motion";
import { api } from "../../../services/api";
import { useTelegram } from "../../../hooks/useTelegram";
import { useTokenStore, TokenData } from "../../../store/tokenStore";
import { TokenIcon } from "../../common/TokenIcon";
import { Sheet } from "../../common/Sheet";

const cardStyle: React.CSSProperties = {
  background: "rgba(20, 25, 34, 0.9)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(124, 92, 252, 0.2)",
  borderRadius: 16,
  padding: 16,
  marginTop: 8,
  width: "100%",
};

interface SetAlertCardProps {
  data: Record<string, any>;
  onComplete: () => void;
}

export function SetAlertCard({ data, onComplete }: SetAlertCardProps) {
  const { t } = useTranslation();
  const { hapticNotification } = useTelegram();

  const tokens = useTokenStore((s) => s.tokens);

  const initSymbol: string = data.token_symbol || data.symbol || "TON";
  const initAddress: string = data.token_address || data.address || "";
  const initPrice: number = parseFloat(data.current_price || "0");
  const suggestedTarget: string = data.target_price || "";
  const suggestedCondition: "above" | "below" = data.condition || "above";

  const [selectedToken, setSelectedToken] = useState<{ symbol: string; address: string; price: number }>({
    symbol: initSymbol, address: initAddress, price: initPrice,
  });
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [condition, setCondition] = useState<"above" | "below">(suggestedCondition);
  const [targetPrice, setTargetPrice] = useState(suggestedTarget);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const userId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

  const handleCreateAlert = useCallback(async () => {
    if (!targetPrice || parseFloat(targetPrice) <= 0 || !selectedToken.address || !userId) return;

    setIsSubmitting(true);
    try {
      await api.post(`/alerts?user_id=${userId}`, {
        token_address: selectedToken.address,
        token_symbol: selectedToken.symbol,
        condition,
        target_price: parseFloat(targetPrice),
        current_price_at_creation: selectedToken.price,
        is_repeating: false,
      });
      setIsCreated(true);
      hapticNotification("success");
      onComplete();
    } catch {
      hapticNotification("error");
    } finally {
      setIsSubmitting(false);
    }
  }, [targetPrice, selectedToken, condition, userId, hapticNotification, onComplete]);

  if (isCreated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={cardStyle}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            padding: "8px 0",
          }}
        >
          <IoCheckmarkCircle size={36} color="#00D4AA" />
          <div style={{ fontSize: 14, fontWeight: 600, color: "#00D4AA" }}>
            {t("alerts.alert_created")}
          </div>
          <div style={{ fontSize: 12, color: "var(--color-text-secondary, #8A94A6)", textAlign: "center" }}>
            {selectedToken.symbol} {condition === "above" ? t("alerts.above") : t("alerts.below")} ${targetPrice}
          </div>
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
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, rgba(255, 165, 0, 0.2), rgba(255, 165, 0, 0.1))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IoNotifications size={18} color="#FFA500" />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--color-text-primary, #EAEEF3)",
            }}
          >
            {t("ai.price_alert")}
          </div>
        </div>
      </div>

      <button
        onClick={() => setSelectorOpen(true)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 10,
          padding: "10px 12px", borderRadius: 10, marginBottom: 12,
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.08)", cursor: "pointer",
        }}
      >
        <TokenIcon src={null} symbol={selectedToken.symbol} size={28} address={selectedToken.address} />
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary, #EAEEF3)" }}>
            {selectedToken.symbol}
          </div>
          {selectedToken.price > 0 && (
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5A6478)", fontFamily: "'JetBrains Mono', monospace" }}>
              ${selectedToken.price.toFixed(selectedToken.price < 1 ? 6 : 2)}
            </div>
          )}
        </div>
        <IoChevronDown size={14} color="var(--color-text-tertiary, #5A6478)" />
      </button>

      {selectedToken.price > 0 && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 12px",
            borderRadius: 10,
            background: "rgba(255, 255, 255, 0.04)",
            marginBottom: 12,
            fontSize: 13,
          }}
        >
          <span style={{ color: "var(--color-text-secondary, #8A94A6)" }}>
            {t("ai.current_price")}
          </span>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              color: "var(--color-text-primary, #EAEEF3)",
            }}
          >
            ${selectedToken.price.toFixed(selectedToken.price < 1 ? 6 : 2)}
          </span>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <label
          style={{
            fontSize: 11,
            color: "var(--color-text-tertiary, #5A6478)",
            marginBottom: 6,
            display: "block",
          }}
        >
          {t("ai.notify_when")}
        </label>
        <div style={{ display: "flex", gap: 6 }}>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setCondition("above")}
            style={{
              flex: 1,
              padding: "9px 12px",
              borderRadius: 10,
              background: condition === "above" ? "rgba(0, 212, 170, 0.15)" : "rgba(255, 255, 255, 0.04)",
              border: condition === "above" ? "1px solid rgba(0, 212, 170, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
              color: condition === "above" ? "#00D4AA" : "var(--color-text-secondary, #8A94A6)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("alerts.above")}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setCondition("below")}
            style={{
              flex: 1,
              padding: "9px 12px",
              borderRadius: 10,
              background: condition === "below" ? "rgba(255, 71, 87, 0.15)" : "rgba(255, 255, 255, 0.04)",
              border: condition === "below" ? "1px solid rgba(255, 71, 87, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
              color: condition === "below" ? "#FF4757" : "var(--color-text-secondary, #8A94A6)",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("alerts.below")}
          </motion.button>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <label
          style={{
            fontSize: 11,
            color: "var(--color-text-tertiary, #5A6478)",
            marginBottom: 4,
            display: "block",
          }}
        >
          {t("ai.target_price")} (USD)
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={targetPrice}
          onChange={(e) => setTargetPrice(e.target.value)}
          placeholder="0.00"
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: 10,
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "var(--color-text-primary, #EAEEF3)",
            fontSize: 16,
            fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
            fontWeight: 600,
            boxSizing: "border-box",
          }}
        />
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={handleCreateAlert}
        disabled={isSubmitting || !targetPrice || parseFloat(targetPrice) <= 0}
        style={{
          width: "100%",
          padding: "11px 16px",
          borderRadius: 12,
          background:
            isSubmitting || !targetPrice || parseFloat(targetPrice) <= 0
              ? "rgba(255, 165, 0, 0.3)"
              : "linear-gradient(135deg, #FFA500, #FF8C00)",
          border: "none",
          color: "#0A0E14",
          fontSize: 14,
          fontWeight: 600,
          cursor: isSubmitting ? "not-allowed" : "pointer",
          opacity: !targetPrice || parseFloat(targetPrice) <= 0 ? 0.5 : 1,
        }}
      >
        {isSubmitting ? t("common.loading") : t("alerts.create")}
      </motion.button>

      <Sheet isOpen={selectorOpen} onClose={() => setSelectorOpen(false)} title={t("swap.select_token")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, maxHeight: "50vh", overflow: "auto" }}>
          {tokens.map((token, i) => (
            <motion.button
              key={`${token.address}-${i}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              onClick={() => {
                setSelectedToken({
                  symbol: token.symbol,
                  address: token.address,
                  price: parseFloat(token.price_usd || "0"),
                });
                setSelectorOpen(false);
              }}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 8px", borderRadius: 8,
                background: "transparent", width: "100%", textAlign: "left",
                cursor: "pointer",
              }}
            >
              <TokenIcon src={token.icon_url} symbol={token.symbol} size={32} address={token.address} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary, #EAEEF3)" }}>{token.symbol}</div>
                <div style={{ fontSize: 11, color: "var(--color-text-secondary, #8A94A6)" }}>{token.name}</div>
              </div>
              <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "var(--color-text-secondary, #8A94A6)" }}>
                ${parseFloat(token.price_usd || "0").toFixed(parseFloat(token.price_usd || "0") < 1 ? 4 : 2)}
              </div>
            </motion.button>
          ))}
        </div>
      </Sheet>
    </motion.div>
  );
}
