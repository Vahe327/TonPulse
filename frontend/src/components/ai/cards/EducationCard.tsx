import { useTranslation } from "react-i18next";
import { IoBookOutline, IoCheckmarkCircle } from "react-icons/io5";
import { motion } from "framer-motion";

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

interface EducationCardProps {
  data: Record<string, any>;
  onComplete: () => void;
}

export function EducationCard({ data, onComplete }: EducationCardProps) {
  const { t } = useTranslation();

  const title: string = data.title || "Learn";
  const content: string = data.content || data.text || "";
  const currentStep: number = parseInt(data.step || data.current_step || "1", 10);
  const totalSteps: number = parseInt(data.total_steps || data.total || "1", 10);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={cardStyle}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "linear-gradient(135deg, rgba(124, 92, 252, 0.2), rgba(124, 92, 252, 0.1))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <IoBookOutline size={18} color="#7C5CFC" />
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: "var(--color-text-primary, #EAEEF3)",
            flex: 1,
          }}
        >
          {title}
        </div>
      </div>

      <div
        style={{
          fontSize: 13,
          color: "var(--color-text-secondary, #8A94A6)",
          lineHeight: 1.6,
          marginBottom: 16,
          whiteSpace: "pre-wrap",
        }}
      >
        {content}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onComplete}
        style={{
          width: "100%",
          padding: "10px 16px",
          borderRadius: 12,
          background: "linear-gradient(135deg, rgba(124, 92, 252, 0.15), rgba(0, 212, 170, 0.1))",
          border: "1px solid rgba(124, 92, 252, 0.2)",
          color: "var(--color-text-primary, #EAEEF3)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        <IoCheckmarkCircle size={16} color="#00D4AA" />
        {t("ai.got_it_next")}
      </motion.button>

      {totalSteps > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 10,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--color-text-tertiary, #5A6478)",
            }}
          >
            {t("ai.step_of", { current: currentStep, total: totalSteps })}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                style={{
                  width: i + 1 === currentStep ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  background:
                    i + 1 === currentStep
                      ? "linear-gradient(135deg, #7C5CFC, #00D4AA)"
                      : i + 1 < currentStep
                      ? "#00D4AA"
                      : "rgba(255, 255, 255, 0.1)",
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
