import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./i18n";
import "./styles/global.css";

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        close: () => void;
        enableClosingConfirmation: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            photo_url?: string;
          };
          auth_date: number;
          hash: string;
        };
        colorScheme: "light" | "dark";
        viewportStableHeight: number;
        HapticFeedback: {
          impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
          notificationOccurred: (type: "error" | "success" | "warning") => void;
          selectionChanged: () => void;
        };
      };
    };
  }
}

try {
  const keysToRemove = Object.keys(localStorage).filter(
    (k) => k.startsWith("ton-connect") || k.startsWith("tonconnect")
  );
  keysToRemove.forEach((k) => localStorage.removeItem(k));
} catch {}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
