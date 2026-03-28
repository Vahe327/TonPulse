import { useState, useCallback } from "react";
import { api } from "../services/api";

interface UseApiState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(async (endpoint: string, options?: RequestInit) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await api.get<T>(endpoint);
      setState({ data, error: null, isLoading: false });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      throw err;
    }
  }, []);

  return { ...state, execute };
}
