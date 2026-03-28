import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { PORTFOLIO_REFRESH_INTERVAL } from "../utils/constants";

interface PortfolioPosition {
  token_address: string;
  token_symbol: string;
  token_name: string;
  icon_url: string | null;
  balance: string;
  balance_formatted: string;
  value_usd: string;
  value_ton: string | null;
  price_usd: string;
  change_24h: string | null;
  pnl_usd: string | null;
  pnl_percent: string | null;
  portfolio_share: string;
}

interface Portfolio {
  total_usd: string;
  total_ton: string | null;
  pnl_24h_usd: string | null;
  pnl_24h_percent: string | null;
  positions: PortfolioPosition[];
}

export function usePortfolio(walletAddress: string) {
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<Portfolio>(`/portfolio?wallet=${encodeURIComponent(walletAddress)}`);
      setPortfolio(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load portfolio");
    } finally {
      setIsLoading(false);
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchPortfolio();
    if (!walletAddress) return;
    const interval = setInterval(fetchPortfolio, PORTFOLIO_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPortfolio, walletAddress]);

  return { portfolio, isLoading, error, refetch: fetchPortfolio };
}
