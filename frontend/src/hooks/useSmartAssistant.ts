import { useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTonAddress } from "@tonconnect/ui-react";
import { api } from "../services/api";

export interface ActionCard {
  type: string;
  data: Record<string, any>;
}

export interface QuickAction {
  label: string;
  prompt?: string;
  action?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
  actions?: ActionCard[];
}

interface SmartChatResponse {
  text: string;
  actions?: ActionCard[];
  quick_actions?: QuickAction[];
  remaining_requests: number;
}

interface HistoryMessage {
  id: string;
  role: string;
  text: string;
  actions: ActionCard[] | null;
  created_at: string | null;
}

function getTelegramUserId(): number | null {
  try {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    return user?.id ?? null;
  } catch {
    return null;
  }
}

export function useSmartAssistant() {
  const { i18n } = useTranslation();
  const walletAddress = useTonAddress();
  const i18nRef = useRef(i18n);
  i18nRef.current = i18n;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);
  const [currentQuickActions, setCurrentQuickActions] = useState<QuickAction[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const userId = getTelegramUserId();
  const getLang = useCallback(() => i18nRef.current.language || "en", []);

  useEffect(() => {
    if (historyLoaded || !userId) return;
    setHistoryLoaded(true);

    api
      .get<{ messages: HistoryMessage[] }>(`/ai/chat/history?user_id=${userId}&limit=50`)
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          const restored: ChatMessage[] = data.messages.map((m) => ({
            role: m.role as "user" | "assistant",
            text: m.text,
            actions: m.actions && Array.isArray(m.actions) && m.actions.length > 0
              ? m.actions
              : undefined,
          }));
          setMessages(restored);
        }
      })
      .catch(() => {});
  }, [userId, historyLoaded]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      const userMsg: ChatMessage = { role: "user", text: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const result = await api.post<SmartChatResponse>(
          `/ai/chat?lang=${getLang()}`,
          {
            message: trimmed,
            user_id: userId || undefined,
            wallet_address: walletAddress || undefined,
            history: [],
          }
        );

        const assistantMsg: ChatMessage = {
          role: "assistant",
          text: result.text || "",
          actions: result.actions && result.actions.length > 0 ? result.actions : undefined,
        };

        setMessages((prev) => [...prev, assistantMsg]);
        setRemainingRequests(result.remaining_requests);

        if (result.quick_actions && result.quick_actions.length > 0) {
          setCurrentQuickActions(result.quick_actions);
        }
      } catch (err) {
        const errorText = err instanceof Error ? err.message : "AI unavailable";
        setMessages((prev) => [...prev, { role: "assistant", text: errorText }]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, walletAddress, userId, getLang]
  );

  const clearChat = useCallback(async () => {
    setMessages([]);
    setCurrentQuickActions([]);
    setRemainingRequests(null);
    if (userId) {
      try {
        await api.delete(`/ai/chat/history?user_id=${userId}`);
      } catch {}
    }
  }, [userId]);

  return {
    messages,
    isLoading,
    remainingRequests,
    currentQuickActions,
    sendMessage,
    clearChat,
  };
}
