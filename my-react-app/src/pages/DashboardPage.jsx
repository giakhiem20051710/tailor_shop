export default function DashboardPage() {
  return (
    <div className="space-y-10">

      {/* TITLE */}
      <h1 className="text-3xl font-semibold text-gray-700">
        Quản lý tiệm may
      </h1>

      {/* CARDS */}
      <div className="grid grid-cols-3 gap-6">

        <div className="bg-white p-7 rounded-3xl shadow border border-gray-200">
          <p className="text-gray-500">Tổng đơn trong tháng</p>
          <h2 className="text-4xl font-bold text-green-700 mt-2">32</h2>
        </div>

        <div className="bg-white p-7 rounded-3xl shadow border border-gray-200">
          <p className="text-gray-500">Đơn đang may</p>
          <h2 className="text-4xl font-bold text-yellow-600 mt-2">12</h2>
        </div>

        <div className="bg-white p-7 rounded-3xl shadow border border-gray-200">
          <p className="text-gray-500">Doanh thu tháng</p>
          <h2 className="text-4xl font-bold text-green-700 mt-2">
            18.500.000 đ
          </h2>
        </div>

      </div>

      {/* CHART PLACEHOLDER */}
      <div className="bg-white p-10 rounded-3xl shadow border border-gray-200 text-center text-gray-400">
        (Biểu đồ doanh thu / trạng thái — bạn muốn mình code Chart.js không?)
      </div>

    </div>
  );
}
