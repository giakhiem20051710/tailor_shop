import { useState } from "react";
import { updateOrder } from "../../utils/orderStorage";

export default function AppointmentManager({ order, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    appointmentType: order?.appointmentType || "",
    appointmentDate: order?.appointmentDate || "",
    appointmentTime: order?.appointmentTime || "",
  });

  const handleSave = () => {
    if (!order) return;
    
    const updated = updateOrder(order.id, formData);
    if (updated && onUpdate) {
      onUpdate(updated);
    }
    setIsEditing(false);
  };

  const getAppointmentTypeLabel = (type) => {
    const labels = {
      fitting: "Thử đồ",
      pickup: "Nhận đồ",
    };
    return labels[type] || type;
  };

  if (!isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <label className="text-sm text-gray-500 block mb-1">Lịch hẹn</label>
            {order?.appointmentDate ? (
              <div className="space-y-1">
                <p className="text-gray-700 font-medium">
                  {getAppointmentTypeLabel(order.appointmentType)} - {order.appointmentDate}
                </p>
                {order.appointmentTime && (
                  <p className="text-sm text-gray-500">Giờ: {order.appointmentTime}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-400">Chưa có lịch hẹn</p>
            )}
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
          >
            {order?.appointmentDate ? "Sửa" : "Thêm lịch"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div>
        <label className="text-sm text-gray-500 block mb-2">Loại lịch hẹn</label>
        <select
          value={formData.appointmentType}
          onChange={(e) => setFormData({ ...formData, appointmentType: e.target.value })}
          className="w-full p-2 border rounded-lg focus:ring-blue-500"
        >
          <option value="">-- Chọn loại --</option>
          <option value="fitting">Thử đồ</option>
          <option value="pickup">Nhận đồ</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-500 block mb-2">Ngày hẹn</label>
          <input
            type="date"
            value={formData.appointmentDate}
            onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
            className="w-full p-2 border rounded-lg focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="text-sm text-gray-500 block mb-2">Giờ hẹn (tùy chọn)</label>
          <input
            type="time"
            value={formData.appointmentTime}
            onChange={(e) => setFormData({ ...formData, appointmentTime: e.target.value })}
            className="w-full p-2 border rounded-lg focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Lưu
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setFormData({
              appointmentType: order?.appointmentType || "",
              appointmentDate: order?.appointmentDate || "",
              appointmentTime: order?.appointmentTime || "",
            });
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}

