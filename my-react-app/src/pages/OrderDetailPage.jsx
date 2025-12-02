import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StatusBadge from "../components/StatusBadge";
import MeasurementsDisplay from "../components/orders/MeasurementsDisplay";
import SampleImagesDisplay from "../components/orders/SampleImagesDisplay";
import TailorAssignment from "../components/orders/TailorAssignment";
import AppointmentManager from "../components/orders/AppointmentManager";
import CorrectionNotes from "../components/orders/CorrectionNotes";
import { getOrderById } from "../utils/orderStorage";
import { getCurrentUserRole, ROLES } from "../utils/authStorage";

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const userRole = getCurrentUserRole();
  const isCustomer = userRole === ROLES.CUSTOMER;

  const loadOrder = () => {
    const orderData = getOrderById(id);
    if (orderData) {
      setOrder(orderData);
    } else {
      // Order not found, redirect to list
      navigate("/orders");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadOrder();
  }, [id, navigate]);

  const handleOrderUpdate = (updatedOrder) => {
    setOrder(updatedOrder);
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0 đ";
    if (typeof amount === "string" && amount.includes("đ")) return amount;
    return `${Number(amount).toLocaleString("vi-VN")} đ`;
  };

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-xl shadow border max-w-3xl mx-auto text-center">
        <p className="text-gray-500">Đang tải...</p>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  // Giao diện cho khách hàng
  if (isCustomer) {
    return (
      <div className="min-h-screen bg-[#F5F3EF] text-[#111827] body-font antialiased">
        <div className="pt-[140px] md:pt-[160px] pb-16 max-w-4xl mx-auto px-5 lg:px-8">
          <button
            onClick={() => navigate("/customer/dashboard")}
            className="mb-6 text-sm text-[#6B7280] hover:text-[#111827] flex items-center gap-1"
          >
            <span>←</span> Quay lại hành trình của bạn
          </button>

          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[#9CA3AF]">
                  Chi tiết đơn may
                </p>
                <h1 className="mt-1 text-xl md:text-2xl font-semibold text-[#111827]">
                  Đơn {order.id}
                </h1>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {order.productName || "Đặt may theo yêu cầu"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#6B7280] mb-1">Trạng thái</p>
                <StatusBadge luxury status={order.status} />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-6 text-sm">
              <div className="space-y-2">
                <div>
                  <p className="text-[#6B7280] text-xs">Khách hàng</p>
                  <p className="font-medium">{order.name}</p>
                </div>
                <div>
                  <p className="text-[#6B7280] text-xs">Số điện thoại</p>
                  <p className="font-medium">{order.phone}</p>
                </div>
                {order.address && (
                  <div>
                    <p className="text-[#6B7280] text-xs">Địa chỉ</p>
                    <p className="font-medium">{order.address}</p>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-[#6B7280] text-xs">Ngày đặt</p>
                  <p className="font-medium">{order.receive || "—"}</p>
                </div>
                <div>
                  <p className="text-[#6B7280] text-xs">Ngày hẹn (dự kiến)</p>
                  <p className="font-medium">{order.due || "—"}</p>
                </div>
                <div>
                  <p className="text-[#6B7280] text-xs">Tổng tiền dự kiến</p>
                  <p className="font-semibold text-[#111827]">
                    {formatCurrency(order.total)}
                  </p>
                </div>
              </div>
            </div>

            {order.description && (
              <div className="mb-6 text-sm">
                <p className="text-[#6B7280] text-xs mb-1">Mô tả sản phẩm</p>
                <p className="bg-[#F9FAFB] rounded-xl p-3 text-[#111827]">
                  {order.description}
                </p>
              </div>
            )}

            {order.notes && (
              <div className="mb-6 text-sm">
                <p className="text-[#6B7280] text-xs mb-1">Ghi chú thêm</p>
                <p className="bg-[#FDF2E9] rounded-xl p-3 text-[#92400E]">
                  {order.notes}
                </p>
              </div>
            )}

            {/* Số đo của khách */}
            {order.measurements && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-[#111827] mb-2">
                  Số đo của bạn
                </h2>
                <MeasurementsDisplay measurements={order.measurements} />
              </div>
            )}

            {/* Hình ảnh mẫu */}
            {order.sampleImages && order.sampleImages.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-semibold text-[#111827] mb-2">
                  Hình ảnh mẫu bạn đã gửi
                </h2>
                <SampleImagesDisplay images={order.sampleImages} />
              </div>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => navigate("/customer/dashboard")}
                className="px-5 py-2.5 rounded-full border border-[#D1D5DB] text-sm text-[#374151] hover:bg-[#F3F4F6] transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Giao diện cho admin / nhân viên
  return (
    <div className="bg-white p-8 rounded-xl shadow border max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-700">
          Chi tiết đơn {order.id}
        </h1>
        <button
          onClick={() => navigate("/orders")}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          ← Quay lại
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="text-sm text-gray-500">Khách hàng</label>
          <p className="text-gray-700 font-medium mt-1">{order.name}</p>
        </div>

        <div>
          <label className="text-sm text-gray-500">Số điện thoại</label>
          <p className="text-gray-700 font-medium mt-1">{order.phone}</p>
        </div>

        <div>
          <label className="text-sm text-gray-500">Ngày khách tới đo / đặt may</label>
          <p className="text-gray-700 font-medium mt-1">{order.receive}</p>
        </div>

        <div>
          <label className="text-sm text-gray-500">Ngày hẹn</label>
          <p className="text-gray-700 font-medium mt-1">{order.due}</p>
        </div>

        <div>
          <label className="text-sm text-gray-500">Trạng thái</label>
          <div className="mt-1">
            <StatusBadge luxury status={order.status} />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500">Tổng tiền</label>
          <p className="text-gray-700 font-medium mt-1">
            {formatCurrency(order.total)}
          </p>
        </div>

        {order.createdAt && (
          <div>
            <label className="text-sm text-gray-500">Ngày tạo</label>
            <p className="text-gray-700 font-medium mt-1">
              {new Date(order.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>
        )}
      </div>

      {order.notes && (
        <div className="mb-6">
          <label className="text-sm text-gray-500">Ghi chú</label>
          <p className="text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg">
            {order.notes}
          </p>
        </div>
      )}

      {/* Tailor Assignment Section */}
      <div className="mb-6">
        <TailorAssignment order={order} onUpdate={handleOrderUpdate} />
      </div>

      {/* Appointment Manager Section */}
      <div className="mb-6">
        <AppointmentManager order={order} onUpdate={handleOrderUpdate} />
      </div>

      {/* Correction Notes Section */}
      <div className="mb-6">
        <CorrectionNotes order={order} onUpdate={handleOrderUpdate} />
      </div>

      {/* Measurements Section */}
      <div className="mb-6">
        <MeasurementsDisplay measurements={order.measurements} />
      </div>

      {/* Sample Images Section */}
      <div className="mb-6">
        <SampleImagesDisplay images={order.sampleImages} />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate(`/orders/edit/${order.id}`)}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Sửa đơn
        </button>
        <button
          onClick={() => navigate("/orders")}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
