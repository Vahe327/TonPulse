import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import { Sheet } from "../common/Sheet";
import { PoolPairIcon } from "./PoolPairIcon";
import { LPPosition } from "../../store/liquidityStore";
import { useLiquidity } from "../../hooks/useLiquidity";
import { useTelegram } from "../../hooks/useTelegram";
import { formatTokenAmount, formatLargeNumber } from "../../utils/format";

interface RemoveLiquidityProps {
  position: LPPosition | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const presets = [25, 50, 75, 100] as const;

export function RemoveLiquidity({
  position,
  isOpen,
  onClose,
  onSuccess,
}: RemoveLiquidityProps) {
  const { t } = useTranslation();
  const { hapticImpact, hapticNotification, hapticSelection } = useTelegram();
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const { buildRemoveTransaction } = useLiquidity();

  const [percent, setPercent] = useState(50);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPercent(50);
      setIsConfirming(false);
    }
  }, [isOpen]);

  const computeReceiveA = useCallback((): string => {
    if (!position) return "0";
    const total = parseFloat(position.token_a_amount);
    return (total * (percent / 100)).toFixed(
      Math.min(position.token_a.decimals, 9)
    );
  }, [position, percent]);

  const computeReceiveB = useCallback((): string => {
    if (!position) return "0";
    const total = parseFloat(position.token_b_amount);
    return (total * (percent / 100)).toFixed(
      Math.min(position.token_b.decimals, 9)
    );
  }, [position, percent]);

  const computeRemoveValue = useCallback((): number => {
    if (!position) return 0;
    return position.value_usd * (percent / 100);
  }, [position, percent]);

  const computeLpAmount = useCallback((): string => {
    if (!position) return "0";
    const total = parseFloat(position.lp_balance);
    return (total * (percent / 100)).toFixed(9);
  }, [position, percent]);

  const handlePreset = (val: number) => {
    hapticSelection();
    setPercent(val);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPercent(parseInt(e.target.value, 10));
  };

  const handleConfirm = async () => {
    if (!position || !walletAddress || percent <= 0) return;

    setIsConfirming(true);
    hapticImpact("medium");

    const txData = await buildRemoveTransaction({
      pool_address: position.pool_address,
      lp_amount: computeLpAmount(),
      slippage: 1,
      sender_address: walletAddress,
    });

    if (!txData) {
      hapticNotification("error");
      setIsConfirming(false);
      return;
    }

    try {
      await tonConnectUI.sendTransaction({
        validUntil: txData.valid_until,
        messages: txData.messages.map((m) => ({
          address: m.address,
          amount: m.amount,
          payload: m.payload,
        })),
      });
      hapticNotification("success");
      onSuccess();
      onClose();
    } catch {
      hapticNotification("error");
    } finally {
      setIsConfirming(false);
    }
  };

  if (!position) return null;

  const receiveA = computeReceiveA();
  const receiveB = computeReceiveB();
  const removeValue = computeRemoveValue();

  const sliderGradient = `linear-gradient(to right, var(--color-negative) 0%, var(--color-negative) ${percent}%, var(--color-bg-primary) ${percent}%, var(--color-bg-primary) 100%)`;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={t("liquidity.remove_liquidity")}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-lg)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing-sm)",
          }}
        >
          <PoolPairIcon
            tokenAIcon={position.token_a.icon_url}
            tokenASymbol={position.token_a.symbol}
            tokenBIcon={position.token_b.icon_url}
            tokenBSymbol={position.token_b.symbol}
            size={28}
          />
          <div
            style={{
              fontSize: "var(--font-size-md)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {position.token_a.symbol} / {position.token_b.symbol}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--spacing-md)",
          }}
        >
          <div
            style={{
              fontSize: 48,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color:
                percent === 0
                  ? "var(--color-text-tertiary)"
                  : "var(--color-negative)",
              lineHeight: 1,
            }}
          >
            {percent}%
          </div>

          <div
            style={{
              width: "100%",
              position: "relative",
            }}
          >
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={percent}
              onChange={handleSliderChange}
              style={{
                width: "100%",
                height: 6,
                borderRadius: 3,
                appearance: "none",
                WebkitAppearance: "none",
                background: sliderGradient,
                outline: "none",
                cursor: "pointer",
              }}
            />
            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: var(--color-negative);
                border: 3px solid var(--color-bg-secondary);
                cursor: pointer;
                box-shadow: 0 0 12px rgba(255, 71, 87, 0.4);
              }
              input[type="range"]::-moz-range-thumb {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: var(--color-negative);
                border: 3px solid var(--color-bg-secondary);
                cursor: pointer;
                box-shadow: 0 0 12px rgba(255, 71, 87, 0.4);
              }
            `}</style>
          </div>

          <div
            style={{
              display: "flex",
              gap: "var(--spacing-sm)",
              width: "100%",
            }}
          >
            {presets.map((val) => {
              const isActive = percent === val;
              const label = val === 100 ? "MAX" : `${val}%`;
              return (
                <motion.button
                  key={val}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePreset(val)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "var(--font-size-sm)",
                    fontWeight: 600,
                    fontFamily: "var(--font-sans)",
                    color: isActive
                      ? "var(--color-bg-primary)"
                      : "var(--color-negative)",
                    background: isActive
                      ? "var(--color-negative)"
                      : "var(--color-negative-dim)",
                    border: "none",
                    cursor: "pointer",
                    transition:
                      "background var(--duration-fast) ease, color var(--duration-fast) ease",
                  }}
                >
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            padding: "var(--spacing-md)",
            background: "var(--color-bg-tertiary)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-sm)",
          }}
        >
          <div
            style={{
              fontSize: "var(--font-size-sm)",
              fontWeight: 600,
              color: "var(--color-text-secondary)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 4,
            }}
          >
            {t("liquidity.you_will_receive")}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "var(--font-size-md)",
                color: "var(--color-text-secondary)",
              }}
            >
              {position.token_a.symbol}
            </div>
            <div
              style={{
                fontSize: "var(--font-size-lg)",
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-primary)",
              }}
            >
              {formatTokenAmount(receiveA, 6)}
            </div>
          </div>

          <div style={{ height: 1, background: "var(--color-border)" }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "var(--font-size-md)",
                color: "var(--color-text-secondary)",
              }}
            >
              {position.token_b.symbol}
            </div>
            <div
              style={{
                fontSize: "var(--font-size-lg)",
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-primary)",
              }}
            >
              {formatTokenAmount(receiveB, 6)}
            </div>
          </div>

          <div style={{ height: 1, background: "var(--color-border)" }} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-tertiary)",
              }}
            >
              {t("liquidity.total_value")}
            </div>
            <div
              style={{
                fontSize: "var(--font-size-md)",
                fontWeight: 600,
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-primary)",
              }}
            >
              {formatLargeNumber(removeValue)}
            </div>
          </div>
        </motion.div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleConfirm}
          disabled={isConfirming || percent <= 0}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: "var(--radius-sm)",
            background:
              isConfirming || percent <= 0
                ? "var(--color-bg-tertiary)"
                : "var(--color-negative)",
            border: "none",
            fontSize: "var(--font-size-md)",
            fontWeight: 700,
            fontFamily: "var(--font-sans)",
            color:
              isConfirming || percent <= 0
                ? "var(--color-text-tertiary)"
                : "#ffffff",
            cursor: isConfirming || percent <= 0 ? "default" : "pointer",
            boxShadow:
              isConfirming || percent <= 0
                ? "none"
                : "var(--shadow-glow-negative)",
          }}
        >
          {isConfirming
            ? t("liquidity.confirming")
            : percent <= 0
              ? t("liquidity.select_amount")
              : t("liquidity.confirm_remove")}
        </motion.button>

        <div
          style={{
            textAlign: "center",
            fontSize: "var(--font-size-xs)",
            color: "var(--color-text-tertiary)",
          }}
        >
          {t("swap.powered_by")}
        </div>
      </div>
    </Sheet>
  );
}
