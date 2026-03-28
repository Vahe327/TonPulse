import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { IoSparkles, IoChevronForward, IoCloseCircle } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";
import { useTelegram } from "../../hooks/useTelegram";

interface AIHelperBubbleProps {
  insight: string | null;
  onAskMore: () => void;
}

export function AIHelperBubble({ insight, onAskMore }: AIHelperBubbleProps) {
  const { t } = useTranslation();
  const { hapticImpact } = useTelegram();
  const [showSheet, setShowSheet] = useState(false);
  const [isPulsing, setIsPulsing] = useState(false);
  const pulseIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    pulseIntervalRef.current = setInterval(() => {
      setIsPulsing(true);
      const timeout = setTimeout(() => setIsPulsing(false), 1200);
      return () => clearTimeout(timeout);
    }, 5000);

    return () => {
      if (pulseIntervalRef.current) {
        clearInterval(pulseIntervalRef.current);
      }
    };
  }, []);

  const handleTap = useCallback(() => {
    hapticImpact("light");
    if (insight) {
      setShowSheet(true);
    } else {
      onAskMore();
    }
  }, [insight, hapticImpact, onAskMore]);

  const handleDismiss = useCallback(() => {
    setShowSheet(false);
  }, []);

  const handleAskMore = useCallback(() => {
    setShowSheet(false);
    onAskMore();
  }, [onAskMore]);

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={handleTap}
        animate={
          isPulsing
            ? {
                boxShadow: [
                  "0 0 0 0 rgba(124, 92, 252, 0.4)",
                  "0 0 0 10px rgba(124, 92, 252, 0)",
                  "0 0 0 0 rgba(124, 92, 252, 0)",
                ],
              }
            : {}
        }
        transition={isPulsing ? { duration: 1.2, ease: "easeOut" } : {}}
        style={{
          position: "fixed",
          bottom: "calc(80px + var(--safe-area-bottom, 0px))",
          right: 16,
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #7C5CFC, #00D4AA)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
          cursor: "pointer",
          boxShadow: "0 4px 16px rgba(124, 92, 252, 0.3)",
        }}
      >
        <IoSparkles size={20} color="#fff" />
      </motion.button>

      <AnimatePresence>
        {showSheet && insight && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleDismiss}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.4)",
                zIndex: 200,
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{
                position: "fixed",
                bottom: "calc(136px + var(--safe-area-bottom, 0px))",
                right: 16,
                width: "calc(100vw - 64px)",
                maxWidth: 300,
                background: "rgba(20, 25, 34, 0.95)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                border: "1px solid rgba(124, 92, 252, 0.25)",
                borderRadius: 16,
                padding: 16,
                zIndex: 201,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#7C5CFC",
                  }}
                >
                  <IoSparkles size={12} />
                  {t("ai.ai_tip")}
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDismiss}
                  style={{
                    background: "none",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    display: "flex",
                  }}
                >
                  <IoCloseCircle size={18} color="var(--color-text-tertiary, #5A6478)" />
                </motion.button>
              </div>

              <div
                style={{
                  fontSize: 13,
                  color: "var(--color-text-secondary, #8A94A6)",
                  lineHeight: 1.5,
                  marginBottom: 12,
                }}
              >
                {insight}
              </div>

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleAskMore}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: "rgba(124, 92, 252, 0.1)",
                  border: "1px solid rgba(124, 92, 252, 0.2)",
                  color: "#7C5CFC",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                {t("ai.ask_ai_more")}
                <IoChevronForward size={12} />
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
