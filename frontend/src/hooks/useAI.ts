import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../services/api";

interface TokenAnalysis {
  summary: string;
  risk_score: number;
  risk_factors: string[];
  strengths: string[];
  price_analysis: string;
  liquidity_assessment: string;
  volume_analysis: string;
  outlook: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  cached: boolean;
  generated_at: string;
}

interface RiskScore {
  address: string;
  risk_score: number;
}

interface SwapInsight {
  insight: string;
  sentiment: "positive" | "neutral" | "negative";
  cached: boolean;
}

interface ChatResponse {
  response: string;
  requests_remaining: number;
}

export function useAI() {
  const { i18n } = useTranslation();
  const i18nRef = useRef(i18n);
  i18nRef.current = i18n;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getLang = () => i18nRef.current.language || "en";

  const analyzeToken = useCallback(
    async (params: {
      token_address: string;
      token_symbol: string;
      token_name: string;
      price_usd: number;
      price_change_24h?: number;
      price_change_7d?: number;
      volume_24h?: number;
      liquidity?: number;
      market_cap?: number;
      holder_count?: number;
    }): Promise<TokenAnalysis | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await api.post<TokenAnalysis>(`/ai/analyze-token?lang=${getLang()}`, params);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "AI unavailable";
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getRiskScores = useCallback(
    async (addresses: string[]): Promise<RiskScore[]> => {
      try {
        const result = await api.post<{ scores: RiskScore[] }>("/ai/risk-scores", {
          tokens: addresses,
        });
        return result.scores;
      } catch {
        return [];
      }
    },
    []
  );

  const getSwapInsight = useCallback(
    async (fromAddr: string, toAddr: string, amount: string): Promise<SwapInsight | null> => {
      try {
        const result = await api.get<SwapInsight>(
          `/ai/swap-insight?from=${encodeURIComponent(fromAddr)}&to=${encodeURIComponent(toAddr)}&amount=${amount}&lang=${getLang()}`
        );
        return result;
      } catch {
        return null;
      }
    },
    []
  );

  const chat = useCallback(
    async (
      message: string,
      context?: {
        history?: { role: string; content: string }[];
        portfolio?: { symbol: string; amount: number; value_usd: number }[];
      }
    ): Promise<ChatResponse | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await api.post<ChatResponse>(`/ai/chat?lang=${getLang()}`, {
          message,
          context: context || {},
        });
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "AI unavailable";
        setError(msg);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    analyzeToken,
    getRiskScores,
    getSwapInsight,
    chat,
  };
}
