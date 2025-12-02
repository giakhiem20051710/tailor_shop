export default function LoginFooter() {
  return (
    <>
      {/* Demo Credentials Hint */}
      <div className="mt-6 bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
        <p className="text-xs text-center text-gray-500">
          💡 Demo: Bạn có thể đăng nhập với bất kỳ tên đăng nhập và mật khẩu nào
        </p>
      </div>

      {/* Footer */}
      <p className="text-center text-sm text-gray-500 mt-6">
        © 2024 Tiệm May Admin. Bản quyền thuộc về bạn.
      </p>
    </>
  );
}

