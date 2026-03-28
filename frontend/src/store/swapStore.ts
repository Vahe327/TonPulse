import { create } from "zustand";
import { TokenData } from "./tokenStore";

interface SwapQuote {
  from_amount: string;
  to_amount: string;
  min_to_amount: string;
  price_impact: string;
  route: string[];
  fee: string;
  pool_liquidity_usd: string | null;
}

interface SwapState {
  fromToken: TokenData | null;
  toToken: TokenData | null;
  fromAmount: string;
  toAmount: string;
  slippage: number;
  quote: SwapQuote | null;
  isLoadingQuote: boolean;
  isSwapping: boolean;
  setFromToken: (token: TokenData | null) => void;
  setToToken: (token: TokenData | null) => void;
  setFromAmount: (amount: string) => void;
  setToAmount: (amount: string) => void;
  setSlippage: (slippage: number) => void;
  setQuote: (quote: SwapQuote | null) => void;
  setLoadingQuote: (loading: boolean) => void;
  setSwapping: (swapping: boolean) => void;
  reverseTokens: () => void;
  reset: () => void;
}

export const useSwapStore = create<SwapState>((set) => ({
  fromToken: null,
  toToken: null,
  fromAmount: "",
  toAmount: "",
  slippage: 1,
  quote: null,
  isLoadingQuote: false,
  isSwapping: false,
  setFromToken: (fromToken) => set({ fromToken, quote: null }),
  setToToken: (toToken) => set({ toToken, quote: null }),
  setFromAmount: (fromAmount) => set({ fromAmount }),
  setToAmount: (toAmount) => set({ toAmount }),
  setSlippage: (slippage) => set({ slippage }),
  setQuote: (quote) => set({ quote, toAmount: quote?.to_amount || "" }),
  setLoadingQuote: (isLoadingQuote) => set({ isLoadingQuote }),
  setSwapping: (isSwapping) => set({ isSwapping }),
  reverseTokens: () =>
    set((state) => ({
      fromToken: state.toToken,
      toToken: state.fromToken,
      fromAmount: "",
      toAmount: "",
      quote: null,
    })),
  reset: () =>
    set({
      fromToken: null,
      toToken: null,
      fromAmount: "",
      toAmount: "",
      quote: null,
      isLoadingQuote: false,
      isSwapping: false,
    }),
}));
