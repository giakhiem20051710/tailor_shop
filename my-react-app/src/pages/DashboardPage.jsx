import { exportAllData, exportOrdersToCSV, exportAppointmentsToCSV } from "../utils/dataExport.js";
import { getErrorLogs, clearErrorLogs } from "../utils/errorLogger.js";
import { getAnalyticsEvents, clearAnalyticsEvents } from "../utils/analytics.js";
import { showSuccess, showError } from "../components/NotificationToast.jsx";

export default function DashboardPage() {
  const handleExportAll = () => {
    try {
      exportAllData();
      showSuccess("Đã xuất dữ liệu thành công!");
    } catch (error) {
      showError("Có lỗi khi xuất dữ liệu");
    }
  };

  const handleExportOrders = () => {
    try {
      exportOrdersToCSV();
      showSuccess("Đã xuất danh sách đơn hàng!");
    } catch (error) {
      showError("Có lỗi khi xuất đơn hàng");
    }
  };

  const handleExportAppointments = () => {
    try {
      exportAppointmentsToCSV();
      showSuccess("Đã xuất danh sách lịch hẹn!");
    } catch (error) {
      showError("Có lỗi khi xuất lịch hẹn");
    }
  };

  const handleClearLogs = () => {
    if (confirm("Bạn có chắc muốn xóa tất cả logs?")) {
      clearErrorLogs();
      clearAnalyticsEvents();
      showSuccess("Đã xóa logs thành công!");
    }
  };

  const errorLogs = getErrorLogs();
  const analyticsEvents = getAnalyticsEvents();

  return (
    <div className="space-y-10">

      {/* TITLE */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-gray-700">
          Quản lý tiệm may
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleExportOrders}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            📊 Xuất đơn hàng CSV
          </button>
          <button
            onClick={handleExportAppointments}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
          >
            📅 Xuất lịch hẹn CSV
          </button>
          <button
            onClick={handleExportAll}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm font-medium"
          >
            💾 Backup tất cả
          </button>
        </div>
      </div>

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

      {/* System Logs */}
      <div className="grid grid-cols-2 gap-6">
        {/* Error Logs */}
        <div className="bg-white p-6 rounded-3xl shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Error Logs</h3>
            {errorLogs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Xóa logs
              </button>
            )}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {errorLogs.length === 0 ? (
              <p className="text-sm text-gray-500">Không có lỗi nào</p>
            ) : (
              errorLogs.slice(-10).reverse().map((log, idx) => (
                <div key={idx} className="text-xs bg-red-50 p-2 rounded border border-red-100">
                  <p className="font-medium text-red-800">{log.message}</p>
                  <p className="text-red-600 mt-1">
                    {new Date(log.timestamp).toLocaleString("vi-VN")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Analytics Events */}
        <div className="bg-white p-6 rounded-3xl shadow border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Analytics Events</h3>
            {analyticsEvents.length > 0 && (
              <span className="text-xs text-gray-500">
                {analyticsEvents.length} events
              </span>
            )}
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {analyticsEvents.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa có events</p>
            ) : (
              analyticsEvents.slice(-10).reverse().map((event, idx) => (
                <div key={idx} className="text-xs bg-blue-50 p-2 rounded border border-blue-100">
                  <p className="font-medium text-blue-800">{event.name}</p>
                  <p className="text-blue-600 mt-1">
                    {new Date(event.timestamp).toLocaleString("vi-VN")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
