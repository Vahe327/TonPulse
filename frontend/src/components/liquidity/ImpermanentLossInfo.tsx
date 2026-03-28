import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Sheet } from "../common/Sheet";
import { IoBulbOutline, IoTrendingDownOutline, IoCashOutline, IoInformationCircleOutline } from "react-icons/io5";
import { ReactNode } from "react";

interface ImpermanentLossInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImpermanentLossInfo({ isOpen, onClose }: ImpermanentLossInfoProps) {
  const { t } = useTranslation();

  const sections: { icon: ReactNode; titleKey: string; bodyKey: string }[] = [
    {
      icon: <IoBulbOutline size={18} color="var(--color-accent)" />,
      titleKey: "liquidity.il_what_is",
      bodyKey: "liquidity.il_what_is_body",
    },
    {
      icon: <IoTrendingDownOutline size={18} color="var(--color-negative)" />,
      titleKey: "liquidity.il_when_happens",
      bodyKey: "liquidity.il_when_happens_body",
    },
    {
      icon: <IoCashOutline size={18} color="var(--color-accent)" />,
      titleKey: "liquidity.il_fees_offset",
      bodyKey: "liquidity.il_fees_offset_body",
    },
    {
      icon: <IoInformationCircleOutline size={18} color="var(--color-purple)" />,
      titleKey: "liquidity.il_remember",
      bodyKey: "liquidity.il_remember_body",
    },
  ];

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={t("liquidity.il_title")}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-md)",
        }}
      >
        {sections.map((section, index) => (
          <motion.div
            key={section.titleKey}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              delay: index * 0.08,
            }}
            style={{
              padding: "var(--spacing-md)",
              background: "var(--color-bg-tertiary)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--color-border)",
              display: "flex",
              flexDirection: "column",
              gap: "var(--spacing-sm)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--spacing-sm)",
              }}
            >
              {section.icon}
              <div
                style={{
                  fontSize: "var(--font-size-md)",
                  fontWeight: 600,
                  color: "var(--color-text-primary)",
                }}
              >
                {t(section.titleKey)}
              </div>
            </div>
            <div
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-secondary)",
                lineHeight: 1.6,
              }}
            >
              {t(section.bodyKey)}
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          style={{
            padding: "12px var(--spacing-md)",
            background: "var(--color-warning-dim)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(255, 165, 2, 0.2)",
            fontSize: "var(--font-size-xs)",
            color: "var(--color-warning)",
            lineHeight: 1.5,
            textAlign: "center",
          }}
        >
          {t("liquidity.il_disclaimer")}
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClose}
          style={{
            width: "100%",
            padding: "14px",
            borderRadius: "var(--radius-sm)",
            background: "var(--color-bg-tertiary)",
            border: "1px solid var(--color-border)",
            fontSize: "var(--font-size-md)",
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            color: "var(--color-text-primary)",
            cursor: "pointer",
          }}
        >
          {t("common.done")}
        </motion.button>
      </div>
    </Sheet>
  );
}
