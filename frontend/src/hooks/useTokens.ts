import { useEffect, useCallback, useRef } from "react";
import { api } from "../services/api";
import { useTokenStore, TokenData } from "../store/tokenStore";

export function useTokens() {
  const tokens = useTokenStore((s) => s.tokens);
  const isLoading = useTokenStore((s) => s.isLoading);
  const setTokens = useTokenStore((s) => s.setTokens);
  const mergeTokens = useTokenStore((s) => s.mergeTokens);
  const setLoading = useTokenStore((s) => s.setLoading);
  const initialLoadDone = useRef(false);

  const fetchTokens = useCallback(async () => {
    if (!initialLoadDone.current) {
      setLoading(true);
    }
    try {
      const data = await api.get<TokenData[]>("/tokens");
      if (!initialLoadDone.current) {
        setTokens(data);
        initialLoadDone.current = true;
      } else {
        mergeTokens(data);
      }
    } catch {
      if (!initialLoadDone.current) {
        setLoading(false);
      }
    }
  }, [setTokens, mergeTokens, setLoading]);

  useEffect(() => {
    fetchTokens();
    const interval = setInterval(fetchTokens, 30000);
    return () => clearInterval(interval);
  }, [fetchTokens]);

  const refetch = useCallback(async () => {
    try {
      const data = await api.get<TokenData[]>("/tokens");
      mergeTokens(data);
    } catch {
      // silent
    }
  }, [mergeTokens]);

  return { tokens, isLoading, refetch };
}
