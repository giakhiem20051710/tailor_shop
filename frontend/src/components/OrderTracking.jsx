import { useState, useEffect } from "react";
import { orderService, appointmentService } from "../services";

const OrderTracking = ({ orderId, customerId }) => {
  const [order, setOrder] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTracking = async () => {
      try {
        if (orderId) {
          const res = await orderService.getDetail(orderId);
          const data = res?.data ?? res?.responseData ?? res;
          setOrder(data || null);
        } else if (customerId) {
          const res = await orderService.list({ customerId, page: 0, size: 10 });
          const data = res?.data ?? res?.responseData ?? res;
          const content = data?.content || data?.items || [];
          if (content.length > 0) {
            setOrder(content[0]);
          }
        }

        if (orderId || customerId) {
          const aptRes = await appointmentService.list({ orderId, customerId, page: 0, size: 50 });
          const aptData = aptRes?.data ?? aptRes?.responseData ?? aptRes;
          setAppointments(aptData?.content || aptData?.items || []);
        }
      } catch (error) {
        console.error("Error loading order tracking:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTracking();
  }, [orderId, customerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4332]"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
        <p className="font-semibold">Không tìm thấy đơn hàng</p>
        <p className="text-sm mt-1">Vui lòng kiểm tra lại mã đơn hàng hoặc liên hệ hỗ trợ.</p>
      </div>
    );
  }

  const statusSteps = [
    { key: "pending", label: "Đã tiếp nhận", icon: "📋" },
    { key: "confirmed", label: "Đã xác nhận", icon: "✓" },
    { key: "measure", label: "Đã đo", icon: "📏" },
    { key: "sewing", label: "Đang may", icon: "✂️" },
    { key: "fitting", label: "Đã thử đồ", icon: "👔" },
    { key: "completed", label: "Hoàn thành", icon: "✅" },
  ];

  const currentStatusIndex = statusSteps.findIndex(
    (step) => step.key === order.status
  );
  const activeIndex = currentStatusIndex >= 0 ? currentStatusIndex : 0;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
      {/* Order Info */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Đơn hàng #{order.id}
          </h3>
          <span className="px-3 py-1 bg-[#1B4332] text-white text-xs rounded-full font-medium">
            {order.status === "pending" && "Đã tiếp nhận"}
            {order.status === "confirmed" && "Đã xác nhận"}
            {order.status === "measure" && "Đã đo"}
            {order.status === "sewing" && "Đang may"}
            {order.status === "fitting" && "Đã thử đồ"}
            {order.status === "completed" && "Hoàn thành"}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          Sản phẩm: <span className="font-medium">{order.productName}</span>
        </p>
        <p className="text-sm text-gray-600">
          Tổng tiền: <span className="font-medium">{order.total}</span>
        </p>
        {order.createdAt && (
          <p className="text-xs text-gray-500 mt-1">
            Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
          </p>
        )}
      </div>

      {/* Status Timeline */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">Tiến trình đơn hàng</h4>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200">
            <div
              className="absolute top-0 left-0 w-full bg-[#1B4332] transition-all duration-500"
              style={{ height: `${(activeIndex / (statusSteps.length - 1)) * 100}%` }}
            />
          </div>

          {/* Status steps */}
          <div className="space-y-6">
            {statusSteps.map((step, index) => {
              const isActive = index <= activeIndex;
              const isCurrent = index === activeIndex;

              return (
                <div key={step.key} className="relative flex items-start gap-4">
                  {/* Icon */}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                      isActive
                        ? "bg-[#1B4332] text-white shadow-md"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {step.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <p
                      className={`font-medium ${
                        isActive ? "text-gray-900" : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrent && order.status === step.key && (
                      <p className="text-xs text-gray-500 mt-1">
                        Đang xử lý...
                      </p>
                    )}
                    {isActive && index < activeIndex && (
                      <p className="text-xs text-green-600 mt-1">✓ Đã hoàn thành</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Appointments */}
      {appointments.length > 0 && (
        <div className="border-t border-gray-200 pt-4">
          <h4 className="font-semibold text-gray-900 mb-3">Lịch hẹn liên quan</h4>
          <div className="space-y-2">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="bg-gray-50 rounded-lg p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {apt.type === "consult" && "Tư vấn"}
                    {apt.type === "measure" && "Đo"}
                    {apt.type === "fitting" && "Thử đồ"}
                    {apt.type === "pickup" && "Nhận đồ"}
                  </span>
                  <span className="text-gray-600">
                    {apt.status === "pending" && "Chờ xác nhận"}
                    {apt.status === "confirmed" && "Đã xác nhận"}
                    {apt.status === "done" && "Đã hoàn thành"}
                    {apt.status === "cancelled" && "Đã hủy"}
                  </span>
                </div>
                {apt.date && (
                  <p className="text-gray-500 mt-1">
                    {new Date(apt.date).toLocaleDateString("vi-VN")}
                    {apt.startTime && ` • ${apt.startTime}`}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;

