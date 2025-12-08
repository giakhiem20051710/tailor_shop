import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";

export default function LoginSelectionPage() {
  usePageMeta({
    title: "Chọn loại tài khoản đăng nhập | My Hiền Tailor",
    description:
      "Chọn đăng nhập với vai trò quản trị viên, nhân viên, thợ may hoặc khách hàng để quản lý và theo dõi đơn hàng.",
  });

  const loginTypes = [
    {
      role: "admin",
      title: "Quản trị viên",
      description: "Quản lý toàn bộ hệ thống, đơn hàng, khách hàng và báo cáo",
      icon: "🔐",
      gradient: "from-red-500 to-red-600",
      hoverGradient: "hover:from-red-600 hover:to-red-700",
      bgColor: "bg-red-50",
      textColor: "text-red-700",
      route: "/login/admin",
    },
    {
      role: "staff",
      title: "Nhân viên",
      description: "Quản lý đơn hàng, khách hàng và lịch hẹn",
      icon: "👔",
      gradient: "from-blue-500 to-blue-600",
      hoverGradient: "hover:from-blue-600 hover:to-blue-700",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
      route: "/login/staff",
    },
    {
      role: "tailor",
      title: "Thợ may",
      description: "Xem và cập nhật đơn hàng được giao, quản lý lịch làm việc",
      icon: "✂️",
      gradient: "from-purple-500 to-purple-600",
      hoverGradient: "hover:from-purple-600 hover:to-purple-700",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
      route: "/login/tailor",
    },
    {
      role: "customer",
      title: "Khách hàng",
      description: "Xem đơn hàng, lịch hẹn và quản lý tài khoản của bạn",
      icon: "👤",
      gradient: "from-green-500 to-green-600",
      hoverGradient: "hover:from-green-600 hover:to-green-700",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
      route: "/login/customer",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#1B4332] to-[#2D5A47] rounded-3xl shadow-xl mb-6">
            <span className="text-4xl font-bold text-white">MH</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            My Hiền Tailor
          </h1>
          <p className="text-lg text-gray-600 mb-2">Fashion Design Studio</p>
          <p className="text-sm text-gray-500">Chọn loại tài khoản để đăng nhập</p>
        </div>

        {/* Login Type Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {loginTypes.map((type) => (
            <Link
              key={type.role}
              to={type.route}
              className={`group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 overflow-hidden`}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${type.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
              
              <div className="relative flex items-start gap-4">
                {/* Icon */}
                <div className={`flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${type.gradient} flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  {type.icon}
                </div>
                
                {/* Content */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#1B4332] transition-colors">
                    {type.title}
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {type.description}
                  </p>
                </div>
                
                {/* Arrow */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full ${type.bgColor} flex items-center justify-center group-hover:bg-gradient-to-br group-hover:${type.gradient} transition-all duration-300`}>
                  <svg
                    className={`w-5 h-5 ${type.textColor} group-hover:text-white transition-colors`}
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
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Login Link */}
        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition"
          >
            <span>Hoặc đăng nhập trực tiếp</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-8">
          © 2025 My Hiền Tailor. Bản quyền thuộc về bạn.
        </p>
      </div>
    </div>
  );
}
