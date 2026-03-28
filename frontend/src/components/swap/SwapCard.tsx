import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useTonAddress } from "@tonconnect/ui-react";
import { TokenIcon } from "../common/TokenIcon";
import { AmountInput } from "../common/AmountInput";
import { TokenSelector } from "./TokenSelector";
import { SwapRoute } from "./SwapRoute";
import { SlippageSettings } from "./SlippageSettings";
import { SwapConfirm } from "./SwapConfirm";
import { SwapSuccess } from "./SwapSuccess";
import { AISwapInsight } from "../ai/AISwapInsight";
import { useSwap } from "../../hooks/useSwap";
import { useTelegram } from "../../hooks/useTelegram";
import { useTokenStore } from "../../store/tokenStore";
import { usePortfolio } from "../../hooks/usePortfolio";
import { formatPrice } from "../../utils/format";
import { nanoToAmount } from "../../utils/ton";
import toast from "react-hot-toast";

export function SwapCard() {
  const { t } = useTranslation();
  const walletAddress = useTonAddress();
  const { hapticImpact, hapticNotification } = useTelegram();
  const swap = useSwap();
  const [searchParams] = useSearchParams();
  const tokens = useTokenStore((s) => s.tokens);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || tokens.length === 0) return;
    const fromAddr = searchParams.get("from");
    const toAddr = searchParams.get("to");
    if (fromAddr) {
      const found = tokens.find((t) => t.address === fromAddr);
      if (found) swap.setFromToken(found);
    }
    if (toAddr) {
      const found = tokens.find((t) => t.address === toAddr);
      if (found) swap.setToToken(found);
    }
    if (fromAddr || toAddr) initializedRef.current = true;
  }, [tokens, searchParams, swap.setFromToken, swap.setToToken]);

  const { portfolio } = usePortfolio(walletAddress || "");

  const balanceMap = useMemo(() => {
    const map: Record<string, string> = {};
    if (portfolio?.positions) {
      for (const pos of portfolio.positions) {
        map[pos.token_address] = pos.balance_formatted;
      }
    }
    return map;
  }, [portfolio]);

  const getBalance = useCallback((tokenAddress: string): string | null => {
    return balanceMap[tokenAddress] || null;
  }, [balanceMap]);

  const fromBalance = swap.fromToken ? getBalance(swap.fromToken.address) : null;
  const hasInsufficientBalance = fromBalance !== null && swap.fromAmount
    ? parseFloat(swap.fromAmount) > parseFloat(fromBalance)
    : false;

  const [fromSelectorOpen, setFromSelectorOpen] = useState(false);
  const [toSelectorOpen, setToSelectorOpen] = useState(false);
  const [slippageOpen, setSlippageOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastSwap, setLastSwap] = useState({ from: "", to: "", fromAmount: "", toAmount: "" });

  const handleReverse = () => {
    hapticImpact("medium");
    swap.reverseTokens();
  };

  const handleReview = () => {
    hapticImpact("light");
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    const success = await swap.executeSwap();
    setConfirmOpen(false);
    if (success) {
      hapticNotification("success");
      setLastSwap({
        from: swap.fromToken?.symbol || "",
        to: swap.toToken?.symbol || "",
        fromAmount: swap.fromAmount,
        toAmount: swap.quote
          ? nanoToAmount(swap.quote.to_amount, swap.toToken?.decimals || 9).toFixed(4)
          : "",
      });
      setSuccessOpen(true);
      swap.reset();
    } else {
      hapticNotification("error");
      toast.error(t("swap.swap_failed"));
    }
  };

  const canSwap =
    !!walletAddress &&
    !!swap.fromToken &&
    !!swap.toToken &&
    !!swap.quote &&
    parseFloat(swap.fromAmount) > 0 &&
    !swap.isLoadingQuote &&
    !hasInsufficientBalance;

  const pairUnavailable =
    !!swap.fromToken &&
    !!swap.toToken &&
    !!swap.fromAmount &&
    parseFloat(swap.fromAmount) > 0 &&
    !swap.isLoadingQuote &&
    !swap.quote;

  const buttonLabel = !walletAddress
    ? t("swap.connect_wallet")
    : !swap.fromToken || !swap.toToken
      ? t("swap.select_token")
      : !swap.fromAmount || parseFloat(swap.fromAmount) <= 0
        ? t("swap.enter_amount")
        : hasInsufficientBalance
          ? t("swap.insufficient_balance")
          : swap.isLoadingQuote
            ? t("common.loading")
            : pairUnavailable
              ? t("swap.pair_unavailable")
              : t("swap.review_swap");

  return (
    <div style={{ padding: "var(--spacing-md)", display: "flex", flexDirection: "column", gap: 10 }}>

      <div style={{
        background: "linear-gradient(180deg, rgba(19,24,32,0.95) 0%, rgba(10,14,20,0.98) 100%)",
        backdropFilter: "blur(var(--blur-lg))",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "18px 16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            {t("swap.from")}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {swap.fromToken?.price_usd && swap.fromAmount && parseFloat(swap.fromAmount) > 0 && (
              <span style={{ fontSize: 12, color: "var(--color-text-tertiary)", fontFamily: "var(--font-mono)" }}>
                ~{formatPrice(parseFloat(swap.fromAmount) * parseFloat(swap.fromToken.price_usd))}
              </span>
            )}
            {fromBalance !== null && (
              <button
                onClick={() => swap.setFromAmount(fromBalance)}
                style={{
                  fontSize: 11, color: "var(--color-accent)", fontFamily: "var(--font-mono)",
                  fontWeight: 600, background: "none", border: "none", cursor: "pointer", padding: 0,
                }}
              >
                {t("liquidity.balance")}: {fromBalance}
              </button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setFromSelectorOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", borderRadius: 14,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              flexShrink: 0, cursor: "pointer",
            }}
          >
            {swap.fromToken ? (
              <>
                <TokenIcon src={swap.fromToken.icon_url} symbol={swap.fromToken.symbol} size={28} address={swap.fromToken.address} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>{swap.fromToken.symbol}</span>
              </>
            ) : (
              <span style={{ color: "var(--color-accent)", fontWeight: 600, fontSize: 13 }}>{t("swap.select_token")}</span>
            )}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 4L5 6.5L7.5 4" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <AmountInput value={swap.fromAmount} onChange={swap.setFromAmount} autoFocus />
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", margin: "-6px 0", zIndex: 10 }}>
        <motion.button
          whileTap={{ rotate: 180, scale: 0.9 }}
          transition={{ duration: 0.3, type: "spring" }}
          onClick={handleReverse}
          style={{
            width: 42, height: 42, borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(0,212,170,0.15), rgba(124,92,252,0.15))",
            border: "3px solid var(--color-bg-primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 12px rgba(0,212,170,0.2)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M5 3v12m0 0l-3-3m3 3l3-3M13 15V3m0 0l3 3m-3-3l-3 3" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </div>

      <div style={{
        background: "linear-gradient(180deg, rgba(19,24,32,0.95) 0%, rgba(10,14,20,0.98) 100%)",
        backdropFilter: "blur(var(--blur-lg))",
        borderRadius: 20,
        border: "1px solid rgba(255,255,255,0.06)",
        padding: "18px 16px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
      }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-tertiary)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 10 }}>
          {t("swap.to")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={() => setToSelectorOpen(true)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px", borderRadius: 14,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.08)",
              flexShrink: 0, cursor: "pointer",
            }}
          >
            {swap.toToken ? (
              <>
                <TokenIcon src={swap.toToken.icon_url} symbol={swap.toToken.symbol} size={28} address={swap.toToken.address} />
                <span style={{ fontWeight: 700, fontSize: 15 }}>{swap.toToken.symbol}</span>
              </>
            ) : (
              <span style={{ color: "var(--color-purple)", fontWeight: 600, fontSize: 13 }}>{t("swap.select_token")}</span>
            )}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2.5 4L5 6.5L7.5 4" stroke="var(--color-text-tertiary)" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
          <AmountInput
            value={swap.quote ? nanoToAmount(swap.quote.to_amount, swap.toToken?.decimals || 9).toFixed(4) : ""}
            onChange={() => {}}
            disabled
          />
        </div>
      </div>

      {swap.quote && <SwapRoute route={swap.quote.route} />}

      {swap.quote && (
        <div style={{
          background: "rgba(255,255,255,0.03)", borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.04)", padding: "12px 14px",
          display: "flex", flexDirection: "column", gap: 8, fontSize: 13,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--color-text-secondary)" }}>{t("swap.price_impact")}</span>
            <span style={{
              color: parseFloat(swap.quote.price_impact) > 3 ? "var(--color-negative)" : parseFloat(swap.quote.price_impact) > 1 ? "var(--color-warning)" : "var(--color-accent)",
              fontWeight: 600, fontFamily: "var(--font-mono)",
            }}>
              {swap.quote.price_impact}%
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--color-text-secondary)" }}>{t("swap.fee")}</span>
            <span style={{ fontWeight: 500, fontFamily: "var(--font-mono)" }}>{swap.quote.fee}</span>
          </div>
          {swap.quote.pool_liquidity_usd && (
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>{t("swap.pool_liquidity")}</span>
              <span style={{
                fontWeight: 500, fontFamily: "var(--font-mono)",
                color: parseFloat(swap.quote.pool_liquidity_usd) < 1000 ? "var(--color-warning)" : "var(--color-text-primary)",
              }}>
                {formatPrice(parseFloat(swap.quote.pool_liquidity_usd))}
              </span>
            </div>
          )}
        </div>
      )}

      {pairUnavailable && (
        <div style={{
          background: "rgba(255,71,87,0.06)", borderRadius: 14,
          border: "1px solid rgba(255,71,87,0.15)", padding: "14px 16px",
          display: "flex", flexDirection: "column", gap: 6,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            fontSize: 14, fontWeight: 600, color: "var(--color-negative)",
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 5v3.5M8 10.5h.007" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {t("swap.no_liquidity_title")}
          </div>
          <div style={{
            fontSize: 12, lineHeight: 1.5, color: "var(--color-text-secondary)",
          }}>
            {t("swap.no_liquidity_desc")}
          </div>
        </div>
      )}

      <AISwapInsight
        fromAddress={swap.fromToken?.address || null}
        toAddress={swap.toToken?.address || null}
        amount={swap.fromAmount}
        pairUnavailable={pairUnavailable}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => setSlippageOpen(true)}
          style={{
            padding: "10px 14px", borderRadius: 14,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            fontSize: 12, color: "var(--color-text-secondary)",
            display: "flex", alignItems: "center", gap: 5, cursor: "pointer",
            fontFamily: "var(--font-mono)", fontWeight: 500,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v1.5m0 7V11M1 6h1.5m7 0H11M2.6 2.6l1.06 1.06m4.68 4.68l1.06 1.06M2.6 9.4l1.06-1.06m4.68-4.68l1.06-1.06" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
          {swap.slippage}%
        </button>
        <button
          onClick={canSwap ? handleReview : undefined}
          disabled={!canSwap}
          style={{
            flex: 1, padding: "16px", borderRadius: 14,
            background: hasInsufficientBalance
              ? "rgba(255,71,87,0.15)"
              : canSwap
                ? "linear-gradient(135deg, #00D4AA 0%, #00B4D8 100%)"
                : "rgba(255,255,255,0.04)",
            color: hasInsufficientBalance
              ? "var(--color-negative)"
              : canSwap ? "#0A0E14" : "var(--color-text-tertiary)",
            fontWeight: 700, fontSize: 15,
            opacity: canSwap ? 1 : 0.6,
            boxShadow: canSwap ? "0 4px 20px rgba(0,212,170,0.3)" : "none",
          }}
        >
          {buttonLabel}
        </button>
      </div>

      <div style={{ textAlign: "center", fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2, opacity: 0.6 }}>
        {t("swap.powered_by")}
      </div>

      <TokenSelector
        isOpen={fromSelectorOpen}
        onClose={() => setFromSelectorOpen(false)}
        onSelect={swap.setFromToken}
        excludeAddress={swap.toToken?.address}
        filterByPairWith={swap.toToken?.address}
        balanceMap={balanceMap}
      />
      <TokenSelector
        isOpen={toSelectorOpen}
        onClose={() => setToSelectorOpen(false)}
        onSelect={swap.setToToken}
        excludeAddress={swap.fromToken?.address}
        filterByPairWith={swap.fromToken?.address}
        balanceMap={balanceMap}
      />
      <SlippageSettings
        isOpen={slippageOpen}
        onClose={() => setSlippageOpen(false)}
        value={swap.slippage}
        onChange={swap.setSlippage}
      />
      {swap.fromToken && swap.toToken && swap.quote && (
        <SwapConfirm
          isOpen={confirmOpen}
          onClose={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
          fromToken={swap.fromToken}
          toToken={swap.toToken}
          fromAmount={swap.quote.from_amount}
          toAmount={swap.quote.to_amount}
          minToAmount={swap.quote.min_to_amount}
          priceImpact={swap.quote.price_impact}
          route={swap.quote.route}
          fee={swap.quote.fee}
          isSwapping={swap.isSwapping}
        />
      )}
      <SwapSuccess
        isOpen={successOpen}
        onClose={() => setSuccessOpen(false)}
        fromSymbol={lastSwap.from}
        toSymbol={lastSwap.to}
        fromAmount={lastSwap.fromAmount}
        toAmount={lastSwap.toAmount}
      />
    </div>
  );
}
