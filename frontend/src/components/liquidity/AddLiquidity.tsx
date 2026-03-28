import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import { Sheet } from "../common/Sheet";
import { TokenIcon } from "../common/TokenIcon";
import { PoolPairIcon } from "./PoolPairIcon";
import { ProvisionTypeSelector, ProvisionType } from "./ProvisionTypeSelector";
import { SimulationResult } from "./SimulationResult";
import { PoolData, SimulationResponse } from "../../store/liquidityStore";
import { useLiquidity } from "../../hooks/useLiquidity";
import { useTelegram } from "../../hooks/useTelegram";
import { formatTokenAmount } from "../../utils/format";

interface AddLiquidityProps {
  pool: PoolData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddLiquidity({ pool, isOpen, onClose, onSuccess }: AddLiquidityProps) {
  const { t } = useTranslation();
  const { hapticImpact, hapticNotification } = useTelegram();
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const { simulateProvision, buildProvisionTransaction } = useLiquidity();

  const [provisionType, setProvisionType] = useState<ProvisionType>("balanced");
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [simulation, setSimulation] = useState<SimulationResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [balanceA, setBalanceA] = useState<string | null>(null);
  const [balanceB, setBalanceB] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setProvisionType("balanced");
      setAmountA("");
      setAmountB("");
      setSimulation(null);
      setIsSimulating(false);
      setIsConfirming(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!pool || !walletAddress || !isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const { api } = await import("../../services/api");
        const result = await api.get<{
          balance_a: string;
          balance_b: string;
        }>(
          `/liquidity/balances?wallet=${encodeURIComponent(walletAddress)}&pool=${encodeURIComponent(pool.address)}`
        );
        if (!cancelled) {
          setBalanceA(result.balance_a);
          setBalanceB(result.balance_b);
        }
      } catch {
        if (!cancelled) {
          setBalanceA(null);
          setBalanceB(null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pool, walletAddress, isOpen]);

  const computeBalancedAmountB = useCallback(
    (inputA: string): string => {
      if (!pool || !inputA || parseFloat(inputA) <= 0) return "";
      const reserveA = parseFloat(pool.token_a_reserve);
      const reserveB = parseFloat(pool.token_b_reserve);
      if (reserveA <= 0) return "";
      const ratio = reserveB / reserveA;
      return (parseFloat(inputA) * ratio).toFixed(
        Math.min(pool.token_b.decimals, 9)
      );
    },
    [pool]
  );

  const computeBalancedAmountA = useCallback(
    (inputB: string): string => {
      if (!pool || !inputB || parseFloat(inputB) <= 0) return "";
      const reserveA = parseFloat(pool.token_a_reserve);
      const reserveB = parseFloat(pool.token_b_reserve);
      if (reserveB <= 0) return "";
      const ratio = reserveA / reserveB;
      return (parseFloat(inputB) * ratio).toFixed(
        Math.min(pool.token_a.decimals, 9)
      );
    },
    [pool]
  );

  const handleAmountAChange = (raw: string) => {
    if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;
    setAmountA(raw);
    setSimulation(null);
    if (provisionType === "balanced" && raw) {
      setAmountB(computeBalancedAmountB(raw));
    }
    if (provisionType === "single") {
      setAmountB("");
    }
  };

  const handleAmountBChange = (raw: string) => {
    if (raw !== "" && !/^\d*\.?\d*$/.test(raw)) return;
    setAmountB(raw);
    setSimulation(null);
    if (provisionType === "balanced" && raw) {
      setAmountA(computeBalancedAmountA(raw));
    }
    if (provisionType === "single") {
      setAmountA("");
    }
  };

  const handleMaxA = () => {
    if (!balanceA) return;
    hapticImpact("light");
    handleAmountAChange(balanceA);
  };

  const handleMaxB = () => {
    if (!balanceB) return;
    hapticImpact("light");
    handleAmountBChange(balanceB);
  };

  const handleProvisionTypeChange = (type: ProvisionType) => {
    setProvisionType(type);
    setAmountA("");
    setAmountB("");
    setSimulation(null);
  };

  const handleSimulate = useCallback(async () => {
    if (!pool || !walletAddress) return;
    const currentA = amountA;
    const currentB = amountB;
    if (
      (!currentA || parseFloat(currentA) <= 0) &&
      (!currentB || parseFloat(currentB) <= 0)
    ) {
      return;
    }

    setIsSimulating(true);
    const result = await simulateProvision({
      pool_address: pool.address,
      provision_type: provisionType,
      token_a_amount: currentA || "0",
      token_b_amount: currentB || "0",
      slippage: 1,
      sender_address: walletAddress,
    });

    if (result) {
      setSimulation(result);
      hapticNotification("success");
    } else {
      hapticNotification("error");
    }
    setIsSimulating(false);
  }, [
    pool,
    walletAddress,
    amountA,
    amountB,
    provisionType,
    simulateProvision,
    hapticNotification,
  ]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSimulation(null);
  }, [amountA, amountB, provisionType]);

  const handleConfirm = async () => {
    if (!pool || !walletAddress || !simulation) return;

    setIsConfirming(true);
    hapticImpact("medium");

    const txData = await buildProvisionTransaction({
      pool_address: pool.address,
      provision_type: provisionType,
      token_a_amount: amountA || "0",
      token_b_amount: amountB || "0",
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

  if (!pool) return null;

  const hasValidAmount =
    (amountA && parseFloat(amountA) > 0) ||
    (amountB && parseFloat(amountB) > 0);

  const showTokenB = provisionType !== "single";

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={t("liquidity.add_liquidity")}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-md)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "var(--spacing-sm)",
            paddingBottom: "var(--spacing-xs)",
          }}
        >
          <PoolPairIcon
            tokenAIcon={pool.token_a.icon_url}
            tokenASymbol={pool.token_a.symbol}
            tokenBIcon={pool.token_b.icon_url}
            tokenBSymbol={pool.token_b.symbol}
            size={28}
          />
          <div
            style={{
              fontSize: "var(--font-size-md)",
              fontWeight: 600,
              color: "var(--color-text-primary)",
            }}
          >
            {pool.token_a.symbol} / {pool.token_b.symbol}
          </div>
        </div>

        <ProvisionTypeSelector
          value={provisionType}
          onChange={handleProvisionTypeChange}
        />

        <div
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
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-sm)",
              }}
            >
              <TokenIcon
                src={pool.token_a.icon_url}
                symbol={pool.token_a.symbol}
                size={24}
                address={pool.token_a.address}
              />
              <div
                style={{
                  fontSize: "var(--font-size-md)",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                {pool.token_a.symbol}
              </div>
            </div>
            {balanceA !== null && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-xs)",
                }}
              >
                <div
                  style={{
                    fontSize: "var(--font-size-xs)",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  {t("liquidity.balance")}: {formatTokenAmount(balanceA, 4)}
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleMaxA}
                  style={{
                    padding: "2px 6px",
                    borderRadius: "var(--radius-xs)",
                    background: "var(--color-accent-dim)",
                    border: "none",
                    fontSize: "var(--font-size-xs)",
                    fontWeight: 700,
                    fontFamily: "var(--font-sans)",
                    color: "var(--color-accent)",
                    cursor: "pointer",
                  }}
                >
                  MAX
                </motion.button>
              </div>
            )}
          </div>
          <input
            type="text"
            inputMode="decimal"
            value={amountA}
            onChange={(e) => handleAmountAChange(e.target.value)}
            placeholder="0.0"
            style={{
              width: "100%",
              padding: "10px 0",
              fontSize: "var(--font-size-xl)",
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              color: amountA
                ? "var(--color-text-primary)"
                : "var(--color-text-tertiary)",
              background: "transparent",
              border: "none",
              outline: "none",
            }}
          />
        </div>

        <AnimatePresence>
          {showTokenB && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
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
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "var(--spacing-sm)",
                  }}
                >
                  <TokenIcon
                    src={pool.token_b.icon_url}
                    symbol={pool.token_b.symbol}
                    size={24}
                    address={pool.token_b.address}
                  />
                  <div
                    style={{
                      fontSize: "var(--font-size-md)",
                      fontWeight: 600,
                      color: "var(--color-text-primary)",
                    }}
                  >
                    {pool.token_b.symbol}
                  </div>
                </div>
                {balanceB !== null && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--spacing-xs)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-tertiary)",
                      }}
                    >
                      {t("liquidity.balance")}: {formatTokenAmount(balanceB, 4)}
                    </div>
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={handleMaxB}
                      style={{
                        padding: "2px 6px",
                        borderRadius: "var(--radius-xs)",
                        background: "var(--color-accent-dim)",
                        border: "none",
                        fontSize: "var(--font-size-xs)",
                        fontWeight: 700,
                        fontFamily: "var(--font-sans)",
                        color: "var(--color-accent)",
                        cursor: "pointer",
                      }}
                    >
                      MAX
                    </motion.button>
                  </div>
                )}
              </div>
              <input
                type="text"
                inputMode="decimal"
                value={amountB}
                onChange={(e) => handleAmountBChange(e.target.value)}
                placeholder="0.0"
                disabled={provisionType === "balanced" && !!amountA}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  fontSize: "var(--font-size-xl)",
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  color: amountB
                    ? "var(--color-text-primary)"
                    : "var(--color-text-tertiary)",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  opacity: provisionType === "balanced" && !!amountA ? 0.6 : 1,
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {simulation && (
            <SimulationResult
              simulation={simulation}
              tokenASymbol={pool.token_a.symbol}
              tokenBSymbol={pool.token_b.symbol}
            />
          )}
        </AnimatePresence>

        {!simulation ? (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSimulate}
            disabled={!hasValidAmount || isSimulating || !walletAddress}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "var(--radius-sm)",
              background:
                hasValidAmount && !isSimulating && walletAddress
                  ? "var(--color-bg-tertiary)"
                  : "var(--color-bg-tertiary)",
              border: `1px solid ${
                hasValidAmount && !isSimulating && walletAddress
                  ? "var(--color-accent)"
                  : "var(--color-border)"
              }`,
              fontSize: "var(--font-size-md)",
              fontWeight: 700,
              fontFamily: "var(--font-sans)",
              color:
                hasValidAmount && !isSimulating && walletAddress
                  ? "var(--color-accent)"
                  : "var(--color-text-tertiary)",
              cursor:
                hasValidAmount && !isSimulating && walletAddress
                  ? "pointer"
                  : "default",
              opacity: hasValidAmount && walletAddress ? 1 : 0.5,
            }}
          >
            {isSimulating
              ? t("liquidity.simulating")
              : !walletAddress
                ? t("liquidity.connect_wallet")
                : t("liquidity.simulate")}
          </motion.button>
        ) : (
          <motion.button
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleConfirm}
            disabled={isConfirming}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: "var(--radius-sm)",
              background: isConfirming
                ? "var(--color-bg-tertiary)"
                : "var(--gradient-accent)",
              border: "none",
              fontSize: "var(--font-size-md)",
              fontWeight: 700,
              fontFamily: "var(--font-sans)",
              color: isConfirming
                ? "var(--color-text-tertiary)"
                : "var(--color-bg-primary)",
              cursor: isConfirming ? "default" : "pointer",
              boxShadow: isConfirming ? "none" : "var(--shadow-glow-accent)",
            }}
          >
            {isConfirming
              ? t("liquidity.confirming")
              : t("liquidity.confirm_add")}
          </motion.button>
        )}

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
