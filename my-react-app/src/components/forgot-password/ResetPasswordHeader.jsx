export default function ResetPasswordHeader() {
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
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Đặt lại mật khẩu
      </h1>
      <p className="text-gray-600">Nhập mã xác nhận và mật khẩu mới</p>
    </div>
  );
}

