export default function LoginHeader() {
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
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Tiệm May Admin
      </h1>
      <p className="text-gray-600">Đăng nhập để tiếp tục</p>
    </div>
  );
}

