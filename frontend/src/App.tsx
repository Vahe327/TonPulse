import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { Toaster } from "react-hot-toast";
import { AppLayout } from "./components/layout/AppLayout";
import { MarketPage } from "./pages/MarketPage";
import { SwapPage } from "./pages/SwapPage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { AlertsPage } from "./pages/AlertsPage";
import { TokenPage } from "./pages/TokenPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AIAssistantPage } from "./pages/AIAssistantPage";
import { LiquidityPage } from "./pages/LiquidityPage";
import { useTelegram } from "./hooks/useTelegram";
import { usePriceStream } from "./hooks/usePriceStream";
import { TON_CONNECT_UI_OPTIONS } from "./services/tonconnect";

function AppContent() {
  useTelegram();
  usePriceStream();

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<MarketPage />} />
          <Route path="/swap" element={<SwapPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/ai" element={<AIAssistantPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/pools" element={<LiquidityPage />} />
          <Route path="/pools/:address" element={<LiquidityPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/token/:address" element={<TokenPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export function App() {
  return (
    <TonConnectUIProvider
      manifestUrl={TON_CONNECT_UI_OPTIONS.manifestUrl}
      actionsConfiguration={TON_CONNECT_UI_OPTIONS.actionsConfiguration}
      restoreConnection={false}
    >
      <AppContent />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: "var(--color-bg-secondary)",
            color: "var(--color-text-primary)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-sm)",
            fontSize: "var(--font-size-sm)",
          },
          success: {
            iconTheme: { primary: "#00D4AA", secondary: "#0A0E14" },
          },
          error: {
            iconTheme: { primary: "#FF4757", secondary: "#0A0E14" },
          },
        }}
      />
    </TonConnectUIProvider>
  );
}
