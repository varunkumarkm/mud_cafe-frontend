import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import { useWebSocket } from "../../hooks/useWebSocket";

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);

  // Start WebSocket connection for real-time updates
  useWebSocket();

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
      />
      <div
        className="app-main"
        style={{ marginLeft: collapsed ? "68px" : "240px" }}
      >
        <TopBar sidebarCollapsed={collapsed} />
        <main className="app-content">
          <Outlet />
        </main>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .app-layout {
          min-height: 100vh;
          background: #080808;
          font-family: 'DM Sans', sans-serif;
          display: flex;
        }

        .app-main {
          flex: 1;
          transition: margin-left 0.25s ease;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .app-content {
          margin-top: 64px;
          padding: 28px;
          flex: 1;
          min-height: calc(100vh - 64px);
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 999px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.2);
        }

        /* Global card style */
        .card {
          background: #111;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 16px;
          padding: 20px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .app-content { padding: 16px; }
        }
      `}</style>
    </div>
  );
}