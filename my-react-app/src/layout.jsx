import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./components/layout/Sidebar.jsx";
import Topbar from "./components/layout/Topbar.jsx";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-opacity ${sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={closeSidebar}
        />
        <div
          className={`absolute inset-y-0 left-0 w-64 bg-green-900 transform transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
          <Sidebar onNavigate={closeSidebar} />
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col">
          <Topbar onToggleSidebar={() => setSidebarOpen((v) => !v)} />

          {/* PAGE CONTENT */}
          <div className="p-4 md:p-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
