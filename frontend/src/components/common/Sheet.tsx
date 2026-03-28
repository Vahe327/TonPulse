import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}

export function Sheet({ isOpen, onClose, children, title }: SheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0, 0, 0, 0.6)",
              zIndex: 200,
            }}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              background: "var(--color-bg-secondary)",
              borderTopLeftRadius: "var(--radius-lg)",
              borderTopRightRadius: "var(--radius-lg)",
              maxHeight: "85vh",
              overflow: "auto",
              zIndex: 201,
              paddingBottom: "var(--safe-area-bottom)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "var(--spacing-sm) 0",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: "var(--color-text-tertiary)",
                }}
              />
            </div>
            {title && (
              <div
                style={{
                  padding: "0 var(--spacing-md) var(--spacing-md)",
                  fontSize: "var(--font-size-lg)",
                  fontWeight: 600,
                }}
              >
                {title}
              </div>
            )}
            <div style={{ padding: "0 var(--spacing-md) var(--spacing-lg)" }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
