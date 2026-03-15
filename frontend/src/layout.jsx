import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./components/layout/Sidebar.jsx";
import Topbar from "./components/layout/Topbar.jsx";
import Breadcrumbs from "./components/layout/Breadcrumbs.jsx";
import BottomNav from "./components/layout/BottomNav.jsx";
import MobileFAB from "./components/layout/MobileFAB.jsx";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <>
      <style>{`
        .layout-root { min-height:100vh; background:#f8fafc; }
        .layout-sidebar-desktop { display:none; flex-shrink:0; }
        .layout-content { padding:24px 32px; flex:1; }
        @media (min-width: 769px) { .layout-sidebar-desktop { display:flex; } }
        @media (max-width: 768px) {
          .layout-content {
            padding:12px 12px 80px 12px; /* extra bottom padding for bottom nav */
          }
        }
        @media (min-width:769px) and (max-width:1024px) { .layout-content { padding:16px 20px; } }

        /* Mobile touch improvements */
        @media (max-width: 768px) {
          button, a, input, select, textarea {
            min-height: 40px; /* Bigger tap targets */
          }
          input, select, textarea {
            font-size: 16px !important; /* Prevent iOS zoom on focus */
          }
          /* Smooth scrolling */
          .layout-content {
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
          }
        }
      `}</style>

      <div className="layout-root">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} onClick={closeSidebar} />
            <div style={{
              position: "absolute", top: 0, bottom: 0, left: 0, width: 260,
              animation: "slideInLeft 0.2s ease-out",
            }}>
              <Sidebar onNavigate={closeSidebar} />
            </div>
          </div>
        )}

        <div style={{ display: "flex", minHeight: "100vh" }}>
          <div className="layout-sidebar-desktop"><Sidebar /></div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />
            <div className="layout-content">
              <Breadcrumbs />
              <Outlet />
            </div>
          </div>
        </div>

        {/* Mobile-only components */}
        <MobileFAB />
        <BottomNav />
      </div>

      <style>{`
        @keyframes slideInLeft { from { transform:translateX(-100%); } to { transform:translateX(0); } }
      `}</style>
    </>
  );
}
