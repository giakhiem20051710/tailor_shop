export default function Topbar({ onToggleSidebar }) {
  // Try to get user info if available, but don't require it
  const user = JSON.parse(localStorage.getItem("userData") || "null");
  const role = localStorage.getItem("userRole");
  const username = user?.name || user?.username || localStorage.getItem("username") || "Người dùng";

  const roleLabels = {
    admin: "Quản trị viên",
    staff: "Nhân viên",
    tailor: "Thợ may",
    customer: "Khách hàng",
  };

  return (
    <div className="h-16 bg-white flex items-center justify-between px-4 md:px-8 border-b sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100"
          onClick={onToggleSidebar}
        >
          <span className="sr-only">Mở menu</span>
          <svg
            className="h-6 w-6"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 5.25h16.5M3.75 12h16.5M3.75 18.75h16.5"
            />
          </svg>
        </button>
      <h2 className="text-xl font-semibold text-gray-700">
        Quản lý tiệm may
      </h2>
      </div>
      <div className="flex items-center gap-4">
        {role && (
          <span className="text-xs text-gray-400 px-2 py-1 bg-gray-100 rounded">
            {roleLabels[role] || role}
          </span>
        )}
        <span className="text-gray-500">Xin chào, {username}</span>
      </div>
    </div>
  );
}

