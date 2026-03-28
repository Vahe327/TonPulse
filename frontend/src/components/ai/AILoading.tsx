import { motion } from "framer-motion";

interface AILoadingProps {
  text?: string;
}

export function AILoading({ text }: AILoadingProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--spacing-xl)",
        gap: "var(--spacing-md)",
      }}
    >
      <div style={{ display: "flex", gap: 6 }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7C5CFC, #00D4AA)",
            }}
          />
        ))}
      </div>
      {text && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-secondary)",
          }}
        >
          {text}
        </motion.div>
      )}
    </div>
  );
}
