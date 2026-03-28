import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import { Sheet } from "../common/Sheet";
import { TokenIcon } from "../common/TokenIcon";
import { useLiquidity } from "../../hooks/useLiquidity";
import { useTelegram } from "../../hooks/useTelegram";
import { api } from "../../services/api";
import { IoAdd, IoSwapVertical, IoWarningOutline, IoCheckmarkCircleOutline, IoChevronDown } from "react-icons/io5";
import toast from "react-hot-toast";

interface WalletToken {
  address: string;
  symbol: string;
  name: string;
  icon_url: string | null;
  decimals: number;
  balance: string;
}

interface CreatePoolProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreatePool({ isOpen, onClose, onSuccess }: CreatePoolProps) {
  const { t } = useTranslation();
  const { hapticImpact, hapticNotification } = useTelegram();
  const walletAddress = useTonAddress();
  const [tonConnectUI] = useTonConnectUI();
  const { buildProvisionTransaction } = useLiquidity();

  const [walletTokens, setWalletTokens] = useState<WalletToken[]>([]);
  const [tokenA, setTokenA] = useState<WalletToken | null>(null);
  const [tokenB, setTokenB] = useState<WalletToken | null>(null);
  const [amountA, setAmountA] = useState("");
  const [amountB, setAmountB] = useState("");
  const [selectorFor, setSelectorFor] = useState<"a" | "b" | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(false);

  useEffect(() => {
    if (!isOpen || !walletAddress) return;
    setLoadingTokens(true);
    api
      .get<{ positions: Array<{
        token_address: string;
        token_symbol: string;
        token_name: string;
        icon_url: string | null;
        balance_formatted: string;
      }> }>(`/portfolio?wallet=${encodeURIComponent(walletAddress)}`)
      .then((data) => {
        setWalletTokens(
          data.positions.map((p) => ({
            address: p.token_address,
            symbol: p.token_symbol,
            name: p.token_name,
            icon_url: p.icon_url,
            decimals: 9,
            balance: p.balance_formatted,
          }))
        );
      })
      .catch(() => setWalletTokens([]))
      .finally(() => setLoadingTokens(false));
  }, [isOpen, walletAddress]);

  const reset = () => {
    setTokenA(null);
    setTokenB(null);
    setAmountA("");
    setAmountB("");
    setIsConfirming(false);
    setSelectorFor(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const priceRatio =
    tokenA && tokenB && parseFloat(amountA) > 0 && parseFloat(amountB) > 0
      ? parseFloat(amountB) / parseFloat(amountA)
      : null;

  const canCreate =
    !!walletAddress && !!tokenA && !!tokenB &&
    tokenA.address !== tokenB.address &&
    parseFloat(amountA) > 0 && parseFloat(amountB) > 0;

  const handleConfirm = async () => {
    if (!canCreate || !tokenA || !tokenB || !walletAddress) return;
    setIsConfirming(true);
    hapticImpact("medium");
    try {
      const unitsA = BigInt(Math.floor(parseFloat(amountA) * 10 ** tokenA.decimals)).toString();
      const unitsB = BigInt(Math.floor(parseFloat(amountB) * 10 ** tokenB.decimals)).toString();
      const txData = await buildProvisionTransaction({
        token_a_address: tokenA.address,
        token_b_address: tokenB.address,
        token_a_amount: unitsA,
        token_b_amount: unitsB,
        provision_type: "balanced",
        slippage: 0.01,
        sender_address: walletAddress,
      });
      if (!txData) {
        hapticNotification("error");
        toast.error(t("liquidity.provide_failed"));
        setIsConfirming(false);
        return;
      }
      await tonConnectUI.sendTransaction({
        validUntil: txData.valid_until,
        messages: txData.messages.map((m: any) => ({
          address: m.address, amount: m.amount, payload: m.payload,
        })),
      });
      hapticNotification("success");
      toast.success(t("liquidity.pool_created"));
      reset(); onSuccess(); onClose();
    } catch {
      hapticNotification("error");
      toast.error(t("liquidity.provide_failed"));
    } finally {
      setIsConfirming(false);
    }
  };

  const availableTokens = walletTokens.filter((wt) => {
    if (selectorFor === "a" && tokenB) return wt.address !== tokenB.address;
    if (selectorFor === "b" && tokenA) return wt.address !== tokenA.address;
    return true;
  });

  if (selectorFor) {
    return (
      <Sheet isOpen onClose={() => setSelectorFor(null)} title={t("swap.select_token")}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {loadingTokens ? (
            <div style={{ textAlign: "center", padding: "var(--spacing-xl)", color: "var(--color-text-tertiary)" }}>
              {t("common.loading")}
            </div>
          ) : availableTokens.length === 0 ? (
            <div style={{ textAlign: "center", padding: "var(--spacing-xl)", color: "var(--color-text-tertiary)" }}>
              {t("portfolio.no_tokens")}
            </div>
          ) : (
            availableTokens.map((token, i) => (
              <motion.button
                key={`${token.address}-${i}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => {
                  if (selectorFor === "a") setTokenA(token);
                  else setTokenB(token);
                  setSelectorFor(null);
                }}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px var(--spacing-sm)", borderRadius: "var(--radius-sm)",
                  background: "transparent", width: "100%", textAlign: "left",
                }}
              >
                <TokenIcon src={token.icon_url} symbol={token.symbol} size={36} address={token.address} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{token.symbol}</div>
                  <div style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-secondary)" }}>{token.name}</div>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                  {token.balance}
                </div>
              </motion.button>
            ))
          )}
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet isOpen={isOpen} onClose={handleClose} title={t("liquidity.create_pool")}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <TokenField
          label="Token A"
          token={tokenA}
          amount={amountA}
          onAmountChange={setAmountA}
          onSelect={() => { hapticImpact("light"); setSelectorFor("a"); }}
          onMax={() => tokenA && setAmountA(tokenA.balance)}
          t={t}
        />

        <div style={{ display: "flex", justifyContent: "center", margin: "-4px 0", zIndex: 2 }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "var(--color-bg-secondary)", border: "2px solid var(--color-bg-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <IoAdd size={16} color="var(--color-accent)" />
          </div>
        </div>

        <TokenField
          label="Token B"
          token={tokenB}
          amount={amountB}
          onAmountChange={setAmountB}
          onSelect={() => { hapticImpact("light"); setSelectorFor("b"); }}
          onMax={() => tokenB && setAmountB(tokenB.balance)}
          t={t}
        />

        {priceRatio !== null && tokenA && tokenB && (
          <div style={{
            padding: "8px 12px", borderRadius: "var(--radius-xs)",
            background: "var(--color-accent-dim)", border: "1px solid rgba(0,212,170,0.2)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <IoSwapVertical size={14} color="var(--color-accent)" />
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-accent)" }}>
              1 {tokenA.symbol} = {priceRatio.toFixed(4)} {tokenB.symbol}
            </span>
          </div>
        )}

        {tokenA && tokenB && (
          <div style={{
            padding: "8px 12px", borderRadius: "var(--radius-xs)",
            background: "var(--color-warning-dim)", border: "1px solid rgba(255,165,2,0.2)",
            display: "flex", alignItems: "flex-start", gap: 6,
          }}>
            <IoWarningOutline size={14} color="var(--color-warning)" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-warning)", lineHeight: 1.3 }}>
              {t("liquidity.initial_warning")}
            </span>
          </div>
        )}

        <motion.button
          whileTap={canCreate ? { scale: 0.97 } : undefined}
          onClick={canCreate ? handleConfirm : undefined}
          disabled={!canCreate || isConfirming}
          style={{
            padding: "14px", borderRadius: "var(--radius-sm)",
            background: canCreate ? "var(--gradient-accent)" : "var(--color-bg-tertiary)",
            color: canCreate ? "#0A0E14" : "var(--color-text-tertiary)",
            fontWeight: 700, fontSize: "var(--font-size-md)",
            opacity: canCreate ? 1 : 0.6,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          {isConfirming ? t("liquidity.creating_pool") : !walletAddress ? t("liquidity.connect_wallet") : (
            <><IoCheckmarkCircleOutline size={18} />{t("liquidity.create_pool")}</>
          )}
        </motion.button>
      </div>
    </Sheet>
  );
}

function TokenField({ label, token, amount, onAmountChange, onSelect, onMax, t }: {
  label: string;
  token: WalletToken | null;
  amount: string;
  onAmountChange: (v: string) => void;
  onSelect: () => void;
  onMax: () => void;
  t: (k: string) => string;
}) {
  return (
    <div style={{
      background: "var(--color-bg-tertiary)", borderRadius: "var(--radius-sm)",
      border: "1px solid var(--color-border)", padding: "10px 12px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-tertiary)" }}>{label}</span>
        {token && (
          <button onClick={onMax} style={{ fontSize: "var(--font-size-xs)", color: "var(--color-accent)", fontWeight: 600 }}>
            {token.balance} {token.symbol}
          </button>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <button onClick={onSelect} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px", borderRadius: "var(--radius-xs)",
          background: "var(--color-bg-secondary)", flexShrink: 0,
        }}>
          {token ? (
            <>
              <TokenIcon src={token.icon_url} symbol={token.symbol} size={22} address={token.address} />
              <span style={{ fontWeight: 600, fontSize: "var(--font-size-sm)" }}>{token.symbol}</span>
            </>
          ) : (
            <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>
              {t("swap.select_token")}
            </span>
          )}
          <IoChevronDown size={10} color="var(--color-text-tertiary)" />
        </button>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          placeholder="0.0"
          style={{
            flex: 1, textAlign: "right", background: "transparent",
            color: "var(--color-text-primary)", fontFamily: "var(--font-mono)",
            fontSize: "var(--font-size-md)", fontWeight: 600, minWidth: 0,
          }}
        />
      </div>
    </div>
  );
}
