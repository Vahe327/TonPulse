import { useCallback, useEffect, useRef } from "react";
import { useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import { api } from "../services/api";
import { useSwapStore } from "../store/swapStore";
import { amountToNano } from "../utils/ton";

const getStore = () => useSwapStore.getState();

export function useSwap() {
  const [tonConnectUI] = useTonConnectUI();
  const walletAddress = useTonAddress();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPairRef = useRef("");
  const failedPairsRef = useRef<Set<string>>(new Set());

  const fromToken = useSwapStore((s) => s.fromToken);
  const toToken = useSwapStore((s) => s.toToken);
  const fromAmount = useSwapStore((s) => s.fromAmount);
  const toAmount = useSwapStore((s) => s.toAmount);
  const slippage = useSwapStore((s) => s.slippage);
  const quote = useSwapStore((s) => s.quote);
  const isLoadingQuote = useSwapStore((s) => s.isLoadingQuote);
  const isSwapping = useSwapStore((s) => s.isSwapping);
  const setFromToken = useSwapStore((s) => s.setFromToken);
  const setToToken = useSwapStore((s) => s.setToToken);
  const setFromAmount = useSwapStore((s) => s.setFromAmount);
  const setToAmount = useSwapStore((s) => s.setToAmount);
  const setSlippage = useSwapStore((s) => s.setSlippage);
  const reverseTokens = useSwapStore((s) => s.reverseTokens);
  const reset = useSwapStore((s) => s.reset);

  const fetchQuote = useCallback(async () => {
    const { fromToken, toToken, fromAmount } = getStore();
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) {
      return;
    }

    const pairKey = `${fromToken.address}:${toToken.address}`;
    if (failedPairsRef.current.has(pairKey)) {
      getStore().setLoadingQuote(false);
      return;
    }

    getStore().setLoadingQuote(true);
    try {
      const nano = amountToNano(fromAmount, fromToken.decimals);
      const quoteResult = await api.get<{
        from_amount: string;
        to_amount: string;
        min_to_amount: string;
        price_impact: string;
        route: string[];
        fee: string;
        pool_liquidity_usd: string | null;
      }>(
        `/swap/quote?from_token=${fromToken.address}&to_token=${toToken.address}&amount=${nano}&slippage=${getStore().slippage}`
      );
      getStore().setQuote(quoteResult);
      failedPairsRef.current.delete(pairKey);
    } catch {
      failedPairsRef.current.add(pairKey);
      getStore().setQuote(null);
    } finally {
      getStore().setLoadingQuote(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!fromToken || !toToken || !fromAmount || parseFloat(fromAmount) <= 0) return;

    const pairKey = `${fromToken.address}:${toToken.address}`;
    if (pairKey === lastPairRef.current && failedPairsRef.current.has(pairKey)) return;
    lastPairRef.current = pairKey;

    debounceRef.current = setTimeout(fetchQuote, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [fromToken?.address, toToken?.address, fromAmount, slippage, fetchQuote]);

  const executeSwap = useCallback(async () => {
    const { fromToken, toToken, fromAmount, slippage } = getStore();
    if (!fromToken || !toToken || !fromAmount || !walletAddress) return;

    getStore().setSwapping(true);
    try {
      const nano = amountToNano(fromAmount, fromToken.decimals);
      const txData = await api.post<{
        messages: { address: string; amount: string; payload: string }[];
        valid_until: number;
      }>("/swap/build-transaction", {
        from_token: fromToken.address,
        to_token: toToken.address,
        amount: nano,
        slippage,
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

      return true;
    } catch {
      return false;
    } finally {
      getStore().setSwapping(false);
    }
  }, [tonConnectUI, walletAddress]);

  return {
    fromToken,
    toToken,
    fromAmount,
    toAmount,
    slippage,
    quote,
    isLoadingQuote,
    isSwapping,
    setFromToken,
    setToToken,
    setFromAmount,
    setToAmount,
    setSlippage,
    reverseTokens,
    reset,
    fetchQuote,
    executeSwap,
    walletConnected: !!walletAddress,
  };
}
