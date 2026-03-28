import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import { IoSwapHorizontal, IoFlash, IoChevronForward } from "react-icons/io5";
import { motion } from "framer-motion";
import { api } from "../../../services/api";
import { useTelegram } from "../../../hooks/useTelegram";

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

interface SwapActionCardProps {
  data: Record<string, any>;
  onComplete: () => void;
}

export function SwapActionCard({ data, onComplete }: SwapActionCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hapticImpact, hapticNotification } = useTelegram();
  const [tonConnectUI] = useTonConnectUI();
  const walletAddress = useTonAddress();

  const fromSymbol: string = data.from_token_symbol || data.from_symbol || "TON";
  const toSymbol: string = data.to_token_symbol || data.to_symbol || "USDT";
  const fromAddress: string = data.from_token_address || data.from_address || "";
  const toAddress: string = data.to_token_address || data.to_address || "";
  const suggestedAmount: string = data.amount || data.from_amount || "";
  const estimatedReceive: string = data.estimated || data.to_amount || "";
  const rate: string = data.rate || "";

  const [amount, setAmount] = useState(suggestedAmount);
  const [isExecuting, setIsExecuting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleExecuteSwap = useCallback(async () => {
    if (!walletAddress || !amount || parseFloat(amount) <= 0) {
      navigate(`/swap?from=${fromAddress}&to=${toAddress}`);
      return;
    }

    hapticImpact("medium");
    setIsExecuting(true);
    setStatus("idle");

    try {
      const decimals = data.from_decimals || 9;
      const nano = Math.floor(parseFloat(amount) * 10 ** decimals).toString();

      const txData = await api.post<{
        messages: { address: string; amount: string; payload: string }[];
        valid_until: number;
      }>("/swap/build-transaction", {
        from_token: fromAddress,
        to_token: toAddress,
        amount: nano,
        slippage: data.slippage || 1,
        sender_address: walletAddress,
      });

      await tonConnectUI.sendTransaction({
        validUntil: txData.valid_until,
        messages: txData.messages.map((m) => ({
          address: m.address,
          amount: m.amount,
          payload: m.payload,
        })),
      });

      setStatus("success");
      hapticNotification("success");
      onComplete();
    } catch {
      setStatus("error");
      hapticNotification("error");
    } finally {
      setIsExecuting(false);
    }
  }, [walletAddress, amount, fromAddress, toAddress, data, tonConnectUI, hapticImpact, hapticNotification, navigate, onComplete]);

  const handleNavigateToSwap = useCallback(() => {
    navigate(`/swap?from=${fromAddress}&to=${toAddress}`);
  }, [navigate, fromAddress, toAddress]);

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
            background: "linear-gradient(135deg, rgba(124, 92, 252, 0.2), rgba(0, 212, 170, 0.15))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IoSwapHorizontal size={18} color="#7C5CFC" />
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-text-primary, #EAEEF3)",
          }}
        >
          {t("ai.swap_suggestion")}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 12px",
          borderRadius: 10,
          background: "rgba(255, 255, 255, 0.04)",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #0088CC, #0098DB)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {fromSymbol.slice(0, 2)}
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary, #EAEEF3)" }}>
            {fromSymbol}
          </span>
        </div>
        <IoChevronForward size={14} color="var(--color-text-tertiary, #5A6478)" />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-primary, #EAEEF3)" }}>
            {toSymbol}
          </span>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #26A17B, #1A8F6E)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
            }}
          >
            {toSymbol.slice(0, 2)}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <label
          style={{
            fontSize: 11,
            color: "var(--color-text-tertiary, #5A6478)",
            marginBottom: 4,
            display: "block",
          }}
        >
          {t("swap.from")} ({fromSymbol})
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.0"
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

      {estimatedReceive && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "var(--color-text-secondary, #8A94A6)",
            marginBottom: 6,
          }}
        >
          <span>{t("ai.estimated_value")}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
            ~{estimatedReceive} {toSymbol}
          </span>
        </div>
      )}

      {rate && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "var(--color-text-secondary, #8A94A6)",
            marginBottom: 12,
          }}
        >
          <span>{t("ai.rate")}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{rate}</span>
        </div>
      )}

      {status === "success" && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(0, 212, 170, 0.1)",
            border: "1px solid rgba(0, 212, 170, 0.2)",
            color: "#00D4AA",
            fontSize: 13,
            fontWeight: 500,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          {t("swap.swap_success")}
        </div>
      )}

      {status === "error" && (
        <div
          style={{
            padding: "8px 12px",
            borderRadius: 8,
            background: "rgba(255, 71, 87, 0.1)",
            border: "1px solid rgba(255, 71, 87, 0.2)",
            color: "#FF4757",
            fontSize: 13,
            fontWeight: 500,
            textAlign: "center",
            marginBottom: 10,
          }}
        >
          {t("swap.swap_failed")}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleExecuteSwap}
          disabled={isExecuting || !amount || parseFloat(amount) <= 0}
          style={{
            flex: 1,
            padding: "11px 16px",
            borderRadius: 12,
            background:
              isExecuting || !amount || parseFloat(amount) <= 0
                ? "rgba(124, 92, 252, 0.3)"
                : "linear-gradient(135deg, #7C5CFC, #00D4AA)",
            border: "none",
            color: isExecuting ? "rgba(255,255,255,0.6)" : "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: isExecuting ? "not-allowed" : "pointer",
            opacity: !amount || parseFloat(amount) <= 0 ? 0.5 : 1,
          }}
        >
          {isExecuting ? t("swap.swapping") : t("swap.confirm_swap")}
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNavigateToSwap}
          style={{
            padding: "11px 14px",
            borderRadius: 12,
            background: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            color: "var(--color-text-secondary, #8A94A6)",
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <IoSwapHorizontal size={14} />
          {t("swap.select_token")}
        </motion.button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          marginTop: 10,
          fontSize: 11,
          color: "var(--color-text-tertiary, #5A6478)",
        }}
      >
        <IoFlash size={10} color="#00D4AA" />
        {t("ai.via_stonfi")}
      </div>
    </motion.div>
  );
}
