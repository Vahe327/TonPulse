import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoSparkles,
  IoSend,
  IoFlash,
  IoBarChart,
  IoCardOutline,
  IoSearchOutline,
  IoBookOutline,
  IoWallet,
  IoSwapHorizontal,
  IoTrendingUp,
  IoNotifications,
  IoChatbubble,
  IoLink,
  IoTrashOutline,
} from "react-icons/io5";
import { ChatContextBar } from "./ChatContextBar";
import { ActionCard } from "./ActionCard";
import { useSmartAssistant, ChatMessage } from "../../hooks/useSmartAssistant";
import { useTelegram } from "../../hooks/useTelegram";

const INITIAL_QUICK_ACTIONS = [
  { key: "quick_buy_ton", icon: <IoCardOutline size={12} /> },
  { key: "quick_portfolio", icon: <IoBarChart size={12} /> },
  { key: "quick_swap", icon: <IoSwapHorizontal size={12} /> },
  { key: "quick_hot", icon: <IoTrendingUp size={12} /> },
  { key: "quick_earn", icon: <IoWallet size={12} /> },
  { key: "quick_what_is", icon: <IoChatbubble size={12} /> },
  { key: "quick_how_start", icon: <IoBookOutline size={12} /> },
  { key: "quick_alert", icon: <IoNotifications size={12} /> },
  { key: "quick_connect", icon: <IoLink size={12} /> },
];

export function AIChat() {
  const { t } = useTranslation();
  const { hapticImpact } = useTelegram();
  const {
    messages,
    isLoading,
    remainingRequests,
    currentQuickActions,
    sendMessage,
    clearChat,
  } = useSmartAssistant();

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      });
    }
  }, [messages, isLoading]);

  const handleSend = useCallback(
    (text?: string) => {
      const msg = text || input.trim();
      if (!msg || isLoading) return;
      hapticImpact("light");
      setInput("");
      sendMessage(msg);
    },
    [input, isLoading, hapticImpact, sendMessage]
  );

  const handleQuickAction = useCallback(
    (key: string) => {
      hapticImpact("light");
      const translated = t(`ai.${key}`);
      sendMessage(translated);
    },
    [hapticImpact, sendMessage, t]
  );

  const handleDynamicQuickAction = useCallback(
    (qa: { label: string; prompt?: string; action?: string }) => {
      hapticImpact("light");
      sendMessage(qa.prompt || qa.label);
    },
    [hapticImpact, sendMessage]
  );

  const handleActionComplete = useCallback(() => {
    hapticImpact("light");
  }, [hapticImpact]);

  const renderMessage = (msg: ChatMessage, index: number) => {
    const isUser = msg.role === "user";

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03, duration: 0.25 }}
        style={{
          alignSelf: isUser ? "flex-end" : "flex-start",
          maxWidth: isUser ? "82%" : "92%",
          display: "flex",
          gap: 8,
          flexDirection: isUser ? "row-reverse" : "row",
          width: isUser ? "auto" : "92%",
        }}
      >
        {!isUser && (
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7C5CFC, #00D4AA)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginTop: 2,
            }}
          >
            <IoSparkles size={15} color="#fff" />
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: isUser
                ? "14px 14px 4px 14px"
                : "14px 14px 14px 4px",
              background: isUser
                ? "linear-gradient(135deg, #7C5CFC, #5A3FD6)"
                : "rgba(255, 255, 255, 0.05)",
              border: isUser
                ? "none"
                : "1px solid rgba(255, 255, 255, 0.06)",
              fontSize: 13,
              lineHeight: 1.55,
              color: "var(--color-text-primary, #EAEEF3)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {msg.text}
          </div>

          {!isUser && (
            <div
              style={{
                fontSize: 10,
                color: "var(--color-text-tertiary, #5A6478)",
                marginTop: 4,
                paddingLeft: 4,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <IoFlash size={8} />
              {t("ai.not_financial_advice")}
            </div>
          )}

          {msg.actions && msg.actions.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
              {msg.actions.map((action, actionIdx) => (
                <ActionCard
                  key={actionIdx}
                  action={action}
                  onComplete={handleActionComplete}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const [quickExpanded, setQuickExpanded] = useState(false);

  const quickActionsToShow =
    currentQuickActions.length > 0
      ? currentQuickActions
      : [];

  const showInitialQuickActions = messages.length === 0;
  const hasQuickActions = quickActionsToShow.length > 0 || INITIAL_QUICK_ACTIONS.length > 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#080B10",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <div style={{ flex: 1 }}>
          <ChatContextBar />
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => { hapticImpact("light"); clearChat(); }}
            style={{
              width: 40, height: 40, display: "flex",
              alignItems: "center", justifyContent: "center",
              background: "transparent", border: "none", cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <IoTrashOutline size={16} color="var(--color-text-tertiary, #5A6478)" />
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: "auto",
          padding: "var(--spacing-md, 16px)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flex: 1,
              gap: 20,
              padding: "32px 0",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7C5CFC, #00D4AA)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 32px rgba(124, 92, 252, 0.25)",
              }}
            >
              <IoSparkles size={24} color="#fff" />
            </div>
            <div
              style={{
                textAlign: "center",
                fontSize: 14,
                color: "var(--color-text-secondary, #8A94A6)",
                maxWidth: 280,
                lineHeight: 1.5,
              }}
            >
              {t("ai.chat_welcome")}
            </div>

            {showInitialQuickActions && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  justifyContent: "center",
                  maxWidth: 340,
                }}
              >
                {INITIAL_QUICK_ACTIONS.map((qa) => (
                  <motion.button
                    key={qa.key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickAction(qa.key)}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 20,
                      background: "transparent",
                      border: "1px solid rgba(124, 92, 252, 0.25)",
                      color: "var(--color-text-primary, #EAEEF3)",
                      fontSize: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ color: "#7C5CFC" }}>{qa.icon}</span>
                    {t(`ai.${qa.key}`)}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg, i) => renderMessage(msg, i))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ alignSelf: "flex-start", display: "flex", gap: 8 }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7C5CFC, #00D4AA)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <IoSparkles size={15} color="#fff" />
            </div>
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "14px 14px 14px 4px",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.85, 1.15, 0.85],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: "easeInOut",
                  }}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #7C5CFC, #00D4AA)",
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {remainingRequests !== null && (
        <div
          style={{
            textAlign: "center",
            fontSize: 11,
            color: "var(--color-text-tertiary, #5A6478)",
            padding: "4px 0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          <IoFlash size={10} />
          {t("ai.requests_remaining", { count: remainingRequests })}
        </div>
      )}

      <div style={{ flexShrink: 0, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={() => { hapticImpact("light"); setQuickExpanded(!quickExpanded); }}
          style={{
            width: "100%", padding: "6px 16px",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            background: "transparent", border: "none", cursor: "pointer",
            fontSize: 11, color: "var(--color-text-tertiary, #5A6478)",
          }}
        >
          {quickExpanded ? "\u25BC" : "\u25B2"} {quickExpanded ? t("ai.dismiss") : t("ai.ai_tip")}
        </button>
        {quickExpanded && (
          <div
            style={{
              padding: "4px 16px 8px",
              overflow: "auto",
              WebkitOverflowScrolling: "touch",
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {quickActionsToShow.length > 0
              ? quickActionsToShow.map((qa, i) => (
                  <motion.button
                    key={`dyn-${i}`}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDynamicQuickAction(qa)}
                    style={{
                      padding: "6px 12px", borderRadius: 16,
                      background: "rgba(124, 92, 252, 0.08)",
                      border: "1px solid rgba(124, 92, 252, 0.2)",
                      color: "var(--color-text-primary, #EAEEF3)",
                      fontSize: 12, whiteSpace: "nowrap", cursor: "pointer",
                    }}
                  >
                    {qa.label}
                  </motion.button>
                ))
              : INITIAL_QUICK_ACTIONS.map((qa) => (
                  <motion.button
                    key={qa.key}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickAction(qa.key)}
                    style={{
                      padding: "6px 12px", borderRadius: 16,
                      background: "transparent",
                      border: "1px solid rgba(124, 92, 252, 0.25)",
                      color: "var(--color-text-primary, #EAEEF3)",
                      fontSize: 12, display: "flex", alignItems: "center",
                      gap: 5, cursor: "pointer", whiteSpace: "nowrap",
                    }}
                  >
                    <span style={{ color: "#7C5CFC" }}>{qa.icon}</span>
                    {t(`ai.${qa.key}`)}
                  </motion.button>
                ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          paddingBottom: "calc(8px + var(--safe-area-bottom, 0px))",
          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
          background: "rgba(10, 14, 20, 0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={t("ai.chat_placeholder")}
          style={{
            flex: 1,
            height: 44,
            padding: "0 16px",
            borderRadius: 22,
            background: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            color: "var(--color-text-primary, #EAEEF3)",
            fontSize: 14,
            outline: "none",
          }}
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            background:
              input.trim() && !isLoading
                ? "linear-gradient(135deg, #7C5CFC, #00D4AA)"
                : "rgba(255, 255, 255, 0.04)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            opacity: input.trim() && !isLoading ? 1 : 0.4,
            transition: "all 0.2s ease",
            border: "none",
            cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
          }}
        >
          <IoSend
            size={18}
            color={input.trim() && !isLoading ? "#0A0E14" : "var(--color-text-tertiary, #5A6478)"}
          />
        </motion.button>
      </div>
    </div>
  );
}
