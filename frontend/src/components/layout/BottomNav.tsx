import { memo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTelegram } from "../../hooks/useTelegram";
import { IoBarChartOutline, IoSwapHorizontalOutline, IoWalletOutline, IoSparklesOutline, IoWaterOutline } from "react-icons/io5";

const tabs = [
  { key: "market", path: "/", Icon: IoBarChartOutline },
  { key: "swap", path: "/swap", Icon: IoSwapHorizontalOutline },
  { key: "portfolio", path: "/portfolio", Icon: IoWalletOutline },
  { key: "ai", path: "/ai", Icon: IoSparklesOutline },
  { key: "pools", path: "/pools", Icon: IoWaterOutline },
];

export const BottomNav = memo(function BottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { hapticImpact } = useTelegram();

  const currentPath = location.pathname;

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "var(--bottom-nav-height)",
        paddingBottom: "var(--safe-area-bottom)",
        background: "rgba(10, 14, 20, 0.95)",
        backdropFilter: "blur(var(--blur-md))",
        borderTop: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-around",
        zIndex: 100,
      }}
    >
      {tabs.map((tab) => {
        const isActive =
          tab.path === "/"
            ? currentPath === "/"
            : currentPath.startsWith(tab.path);

        return (
          <button
            key={tab.key}
            onClick={() => {
              hapticImpact("light");
              navigate(tab.path);
            }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "2px",
              padding: "8px 10px",
              background: "none",
              border: "none",
              position: "relative",
            }}
          >
            <tab.Icon
              size={24}
              color={
                isActive
                  ? "var(--color-accent)"
                  : "var(--color-text-secondary)"
              }
            />
            <span
              style={{
                fontSize: "var(--font-size-xs)",
                color: isActive
                  ? "var(--color-accent)"
                  : "var(--color-text-secondary)",
                fontWeight: isActive ? 600 : 400,
                transition: `color var(--duration-fast) ease`,
              }}
            >
              {t(`nav.${tab.key}`)}
            </span>
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: "20px",
                  height: "2px",
                  borderRadius: "1px",
                  background: "var(--gradient-accent)",
                }}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
});
