import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";

interface Alert {
  id: string;
  user_id: number;
  token_address: string;
  token_symbol: string;
  condition: string;
  target_price: string;
  current_price_at_creation: string;
  is_active: boolean;
  is_repeating: boolean;
  triggered_at: string | null;
  created_at: string;
}

interface CreateAlertParams {
  token_address: string;
  token_symbol: string;
  condition: "above" | "below";
  target_price: number;
  current_price_at_creation: number;
  is_repeating?: boolean;
}

function getUserId(): number | null {
  try {
    return window.Telegram?.WebApp?.initDataUnsafe?.user?.id ?? null;
  } catch {
    return null;
  }
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const userId = getUserId();

  const fetchAlerts = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await api.get<Alert[]>(`/alerts?user_id=${userId}`);
      setAlerts(data);
    } catch {
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const createAlert = useCallback(
    async (params: CreateAlertParams) => {
      if (!userId) throw new Error("No user");
      const alert = await api.post<Alert>(`/alerts?user_id=${userId}`, params);
      setAlerts((prev) => [alert, ...prev]);
      return alert;
    },
    [userId]
  );

  const deleteAlert = useCallback(
    async (id: string) => {
      if (!userId) return;
      await api.delete(`/alerts/${id}?user_id=${userId}`);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    },
    [userId]
  );

  return { alerts, isLoading, fetchAlerts, createAlert, deleteAlert, userId };
}
