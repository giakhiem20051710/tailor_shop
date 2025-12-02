export default function Topbar() {
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
    <div className="h-16 bg-white flex items-center justify-between px-8 border-b">
      <h2 className="text-xl font-semibold text-gray-700">
        Quản lý tiệm may
      </h2>
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

