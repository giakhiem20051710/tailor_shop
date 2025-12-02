export default function ForgotPasswordHeader() {
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
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Quên mật khẩu?
      </h1>
      <p className="text-gray-600">Nhập email để nhận mã xác nhận</p>
    </div>
  );
}

