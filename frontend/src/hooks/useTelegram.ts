import { useEffect, useCallback } from "react";

export function useTelegram() {
  const webApp = window.Telegram?.WebApp;

  useEffect(() => {
    if (!webApp) return;
    webApp.ready();
    webApp.expand();
    webApp.enableClosingConfirmation();
    webApp.setHeaderColor("#0A0E14");
    webApp.setBackgroundColor("#0A0E14");
  }, [webApp]);

  const hapticImpact = useCallback(
    (style: "light" | "medium" | "heavy" | "rigid" | "soft" = "light") => {
      webApp?.HapticFeedback?.impactOccurred(style);
    },
    [webApp]
  );

  const hapticNotification = useCallback(
    (type: "error" | "success" | "warning") => {
      webApp?.HapticFeedback?.notificationOccurred(type);
    },
    [webApp]
  );

  const hapticSelection = useCallback(() => {
    webApp?.HapticFeedback?.selectionChanged();
  }, [webApp]);

  return {
    webApp,
    user: webApp?.initDataUnsafe?.user,
    initData: webApp?.initData || "",
    colorScheme: webApp?.colorScheme || "dark",
    viewportHeight: webApp?.viewportStableHeight || window.innerHeight,
    hapticImpact,
    hapticNotification,
    hapticSelection,
  };
}
