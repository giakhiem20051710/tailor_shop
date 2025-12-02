export default function RegisterHeader() {
  return (
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
            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Tạo tài khoản mới
      </h1>
      <p className="text-gray-600">Đăng ký để sử dụng hệ thống</p>
    </div>
  );
}

