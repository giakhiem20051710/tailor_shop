import { Link } from "react-router-dom";

export default function LoginSelectionPage() {
  // No authentication check - users can access any page directly
  const loginTypes = [
    {
      role: "admin",
      title: "Quản trị viên",
      description: "Quản lý toàn bộ hệ thống",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      color: "bg-red-600 hover:bg-red-700",
      route: "/login/admin",
    },
    {
      role: "staff",
      title: "Nhân viên",
      description: "Quản lý đơn hàng và khách hàng",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: "bg-blue-600 hover:bg-blue-700",
      route: "/login/staff",
    },
    {
      role: "tailor",
      title: "Thợ may",
      description: "Xem và cập nhật đơn hàng được giao",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: "bg-purple-600 hover:bg-purple-700",
      route: "/login/tailor",
    },
    {
      role: "customer",
      title: "Khách hàng",
      description: "Xem đơn hàng của bạn",
      icon: (
        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: "bg-green-600 hover:bg-green-700",
      route: "/login/customer",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block bg-green-900 p-4 rounded-2xl mb-4">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Tiệm May Admin
          </h1>
          <p className="text-gray-600">Chọn loại tài khoản để đăng nhập</p>
        </div>

        {/* Login Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loginTypes.map((type) => (
            <Link
              key={type.role}
              to={type.route}
              className={`${type.color} text-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">{type.icon}</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold mb-2">{type.title}</h2>
                  <p className="text-white/90 text-sm">{type.description}</p>
                </div>
                <svg
                  className="w-6 h-6 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          © 2024 Tiệm May Admin. Bản quyền thuộc về bạn.
        </p>
      </div>
    </div>
  );
}

