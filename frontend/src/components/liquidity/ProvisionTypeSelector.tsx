import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { IoScaleOutline, IoSettingsOutline, IoEllipseOutline } from "react-icons/io5";
import { useTelegram } from "../../hooks/useTelegram";

export type ProvisionType = "balanced" | "custom" | "single";

interface ProvisionTypeSelectorProps {
  value: ProvisionType;
  onChange: (type: ProvisionType) => void;
}

interface TypeOption {
  key: ProvisionType;
  labelKey: string;
  descKey: string;
  icon: ReactNode;
  recommended?: boolean;
}

const options: TypeOption[] = [
  {
    key: "balanced",
    labelKey: "liquidity.provision_balanced",
    descKey: "liquidity.provision_balanced_desc",
    icon: <IoScaleOutline size={18} />,
    recommended: true,
  },
  {
    key: "custom",
    labelKey: "liquidity.provision_custom",
    descKey: "liquidity.provision_custom_desc",
    icon: <IoSettingsOutline size={18} />,
  },
  {
    key: "single",
    labelKey: "liquidity.provision_single",
    descKey: "liquidity.provision_single_desc",
    icon: <IoEllipseOutline size={18} />,
  },
];

export function ProvisionTypeSelector({ value, onChange }: ProvisionTypeSelectorProps) {
  const { t } = useTranslation();
  const { hapticSelection } = useTelegram();

  const handleSelect = (type: ProvisionType) => {
    hapticSelection();
    onChange(type);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "var(--spacing-sm)",
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        paddingBottom: 2,
      }}
    >
      {options.map((opt) => {
        const isActive = value === opt.key;
        return (
          <motion.button
            key={opt.key}
            onClick={() => handleSelect(opt.key)}
            whileTap={{ scale: 0.96 }}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "12px 10px",
              borderRadius: "var(--radius-sm)",
              background: isActive
                ? "var(--color-bg-tertiary)"
                : "var(--color-bg-card)",
              border: isActive
                ? "1px solid transparent"
                : "1px solid var(--color-border)",
              backgroundClip: isActive ? "padding-box" : undefined,
              backgroundImage: isActive
                ? undefined
                : undefined,
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 4,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "var(--radius-sm)",
                  padding: 1,
                  background: "linear-gradient(135deg, var(--color-accent), var(--color-purple))",
                  WebkitMask:
                    "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  WebkitMaskComposite: "xor",
                  maskComposite: "exclude",
                  pointerEvents: "none",
                }}
              />
            )}
            <div style={{ fontSize: 18, lineHeight: 1 }}>{opt.icon}</div>
            <div
              style={{
                fontSize: "var(--font-size-xs)",
                fontWeight: 600,
                color: isActive
                  ? "var(--color-text-primary)"
                  : "var(--color-text-secondary)",
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              {t(opt.labelKey)}
            </div>
            {opt.recommended && (
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "var(--color-accent)",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {t("liquidity.recommended")}
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
