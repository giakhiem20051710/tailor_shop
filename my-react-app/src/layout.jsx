import { Outlet } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar.jsx";
import Topbar from "./components/layout/Topbar.jsx";

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      {/* MAIN CONTENT */}
      <div className="flex-1">
        <Topbar />

        {/* PAGE CONTENT */}
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
