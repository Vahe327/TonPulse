import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--color-bg-primary)",
      }}
    >
      <Header />
      <main
        style={{
          flex: 1,
          overflow: "auto",
          paddingBottom: "calc(var(--bottom-nav-height) + var(--safe-area-bottom))",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
