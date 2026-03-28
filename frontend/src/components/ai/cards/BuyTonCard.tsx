import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useTonAddress } from "@tonconnect/ui-react";
import {
  IoCardOutline, IoOpenOutline, IoLockClosed, IoWallet,
  IoCheckmarkCircle, IoChevronDown, IoChevronUp,
} from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

const cardStyle: React.CSSProperties = {
  background: "rgba(20, 25, 34, 0.9)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  border: "1px solid rgba(124, 92, 252, 0.2)",
  borderRadius: 16,
  padding: 16,
  marginTop: 8,
  width: "100%",
};

const providers = [
  {
    name: "Mercuryo",
    url: (addr: string) =>
      `https://exchange.mercuryo.io/?currency=TON&address=${addr}&type=buy&theme=dark`,
    color: "#3B82F6",
  },
  {
    name: "Neocrypto",
    url: (addr: string) =>
      `https://widget.neocrypto.net/?crypto=TON&address=${addr}&type=buy`,
    color: "#8B5CF6",
  },
  {
    name: "Telegram Wallet",
    url: () => "https://t.me/wallet",
    color: "#0088CC",
    isTelegram: true,
  },
];

interface GuideStep {
  title_en: string;
  title_ru: string;
  desc_en: string;
  desc_ru: string;
}

const guideSteps: Record<string, GuideStep[]> = {
  Mercuryo: [
    {
      title_en: "Open Mercuryo",
      title_ru: "Откройте Mercuryo",
      desc_en: "Tap the button above to open Mercuryo exchange page.",
      desc_ru: "Нажмите кнопку выше чтобы открыть страницу обмена Mercuryo.",
    },
    {
      title_en: "Enter amount",
      title_ru: "Введите сумму",
      desc_en: "Enter USD amount you want to spend. Minimum is usually $30.",
      desc_ru: "Введите сумму в USD. Минимум обычно $30.",
    },
    {
      title_en: "Enter your TON address",
      title_ru: "Введите ваш TON адрес",
      desc_en: "Paste your TON wallet address where you want to receive coins. Your address is shown in the app header.",
      desc_ru: "Вставьте адрес TON кошелька куда получите монеты. Ваш адрес показан в шапке приложения.",
    },
    {
      title_en: "Pay with card",
      title_ru: "Оплатите картой",
      desc_en: "Enter your Visa/Mastercard details and confirm payment. TON will arrive in 1-5 minutes.",
      desc_ru: "Введите данные Visa/Mastercard и подтвердите оплату. TON поступит через 1-5 минут.",
    },
  ],
  Neocrypto: [
    {
      title_en: "Open Neocrypto",
      title_ru: "Откройте Neocrypto",
      desc_en: "Tap the button to open Neocrypto widget.",
      desc_ru: "Нажмите кнопку чтобы открыть виджет Neocrypto.",
    },
    {
      title_en: "Select TON",
      title_ru: "Выберите TON",
      desc_en: "Make sure TON is selected as the cryptocurrency to buy.",
      desc_ru: "Убедитесь что TON выбран как криптовалюта для покупки.",
    },
    {
      title_en: "Enter amount & address",
      title_ru: "Введите сумму и адрес",
      desc_en: "Enter how much you want to buy and paste your TON wallet address.",
      desc_ru: "Введите сколько хотите купить и вставьте адрес вашего TON кошелька.",
    },
    {
      title_en: "Complete payment",
      title_ru: "Завершите оплату",
      desc_en: "Pay with your card. Coins arrive within minutes.",
      desc_ru: "Оплатите картой. Монеты придут в течение нескольких минут.",
    },
  ],
  "Telegram Wallet": [
    {
      title_en: "Open @wallet bot",
      title_ru: "Откройте @wallet бота",
      desc_en: "Tap the button to open Telegram's built-in Wallet bot.",
      desc_ru: "Нажмите кнопку чтобы открыть встроенный кошелёк Telegram.",
    },
    {
      title_en: "Tap 'Buy Crypto'",
      title_ru: "Нажмите 'Купить крипто'",
      desc_en: "In the wallet, find and tap the 'Buy Crypto' or 'P2P' button.",
      desc_ru: "В кошельке найдите и нажмите кнопку 'Купить крипто' или 'P2P'.",
    },
    {
      title_en: "Select TON & pay",
      title_ru: "Выберите TON и оплатите",
      desc_en: "Choose TON, enter amount, and pay with card or P2P.",
      desc_ru: "Выберите TON, введите сумму и оплатите картой или через P2P.",
    },
    {
      title_en: "Send to TonPulse wallet",
      title_ru: "Отправьте на кошелёк TonPulse",
      desc_en: "After purchase, send TON to your TonPulse wallet address (shown in the app header).",
      desc_ru: "После покупки отправьте TON на адрес вашего кошелька TonPulse (показан в шапке приложения).",
    },
  ],
};

export function BuyTonCard() {
  const { t, i18n } = useTranslation();
  const walletAddress = useTonAddress();
  const ru = i18n.language === "ru";
  const [expandedGuide, setExpandedGuide] = useState<string | null>(null);

  const handleOpen = useCallback((url: string, isTelegram?: boolean) => {
    const webApp = window.Telegram?.WebApp as Record<string, any> | undefined;
    if (isTelegram && webApp?.openTelegramLink) {
      webApp.openTelegramLink(url);
    } else if (webApp?.openLink) {
      webApp.openLink(url);
    } else {
      window.open(url, "_blank");
    }
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={cardStyle}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, rgba(0, 212, 170, 0.2), rgba(0, 212, 170, 0.1))",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}
        >
          <IoCardOutline size={18} color="#00D4AA" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--color-text-primary, #EAEEF3)" }}>
            {t("ai.buy_ton_title")}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary, #5A6478)" }}>
            {ru ? "Выберите способ покупки TON" : "Choose how to buy TON"}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        {providers.map((p) => {
          const url = p.url(walletAddress || "");
          const steps = guideSteps[p.name] || [];
          const isExpanded = expandedGuide === p.name;

          return (
            <div key={p.name}>
              <div style={{ display: "flex", gap: 6 }}>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleOpen(url, p.isTelegram)}
                  style={{
                    flex: 1, padding: "12px 14px", borderRadius: 12,
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex", alignItems: "center", gap: 10,
                    cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: `${p.color}22`,
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    }}
                  >
                    {p.isTelegram ? (
                      <IoWallet size={16} color={p.color} />
                    ) : (
                      <IoCardOutline size={16} color={p.color} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-text-primary, #EAEEF3)" }}>
                      {p.name}
                    </div>
                  </div>
                  <IoOpenOutline size={14} color="var(--color-text-tertiary, #5A6478)" />
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setExpandedGuide(isExpanded ? null : p.name)}
                  style={{
                    width: 40, borderRadius: 12,
                    background: isExpanded ? "rgba(124, 92, 252, 0.15)" : "rgba(255, 255, 255, 0.04)",
                    border: `1px solid ${isExpanded ? "rgba(124, 92, 252, 0.3)" : "rgba(255, 255, 255, 0.08)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", flexShrink: 0,
                  }}
                >
                  {isExpanded ? (
                    <IoChevronUp size={14} color="#7C5CFC" />
                  ) : (
                    <IoChevronDown size={14} color="var(--color-text-tertiary, #5A6478)" />
                  )}
                </motion.button>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{
                      marginTop: 8, padding: "12px",
                      borderRadius: 10, background: "rgba(124, 92, 252, 0.06)",
                      border: "1px solid rgba(124, 92, 252, 0.12)",
                    }}>
                      {steps.map((step, i) => (
                        <div key={i} style={{
                          display: "flex", gap: 10,
                          paddingBottom: i < steps.length - 1 ? 10 : 0,
                          marginBottom: i < steps.length - 1 ? 10 : 0,
                          borderBottom: i < steps.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                        }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: "50%",
                            background: "rgba(124, 92, 252, 0.2)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: 11, fontWeight: 700, color: "#7C5CFC", flexShrink: 0,
                          }}>
                            {i + 1}
                          </div>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-text-primary, #EAEEF3)", marginBottom: 2 }}>
                              {ru ? step.title_ru : step.title_en}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--color-text-secondary, #8A94A6)", lineHeight: 1.4 }}>
                              {ru ? step.desc_ru : step.desc_en}
                            </div>
                          </div>
                        </div>
                      ))}

                      {walletAddress && (
                        <div style={{
                          marginTop: 10, padding: "8px 10px", borderRadius: 8,
                          background: "rgba(0, 212, 170, 0.08)",
                          border: "1px solid rgba(0, 212, 170, 0.15)",
                          display: "flex", alignItems: "center", gap: 6,
                        }}>
                          <IoCheckmarkCircle size={14} color="#00D4AA" />
                          <div style={{ fontSize: 10, color: "#00D4AA", fontFamily: "'JetBrains Mono', monospace", wordBreak: "break-all" }}>
                            {walletAddress}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 6, fontSize: 11, color: "var(--color-text-tertiary, #5A6478)",
      }}>
        <IoLockClosed size={11} color="#00D4AA" />
        {t("ai.secure_purchase")}
      </div>
    </motion.div>
  );
}
