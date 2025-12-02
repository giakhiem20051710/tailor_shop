import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  addOrder,
  updateOrder,
  getOrderById,
} from "../utils/orderStorage";
import MeasurementsForm from "../components/orders/MeasurementsForm";
import SampleImagesForm from "../components/orders/SampleImagesForm";

export default function OrderFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [form, setForm] = useState({
    name: "",
    phone: "",
    receive: "",
    due: "",
    total: "",
    notes: "",
    status: "Mới",
    measurements: {},
    sampleImages: null,
    appointmentType: "pickup", // Mặc định là nhận đồ
    appointmentTime: "",
  });

  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");

  // Load order data if in edit mode
  useEffect(() => {
    if (isEditMode) {
      const order = getOrderById(id);
      if (order) {
        setForm({
          name: order.name || "",
          phone: order.phone || "",
          receive: order.receive || "",
          due: order.due || "",
          total: order.total?.toString().replace(/,/g, "") || "",
          notes: order.notes || "",
          status: order.status || "Mới",
          measurements: order.measurements || {},
          sampleImages: order.sampleImages || null,
          appointmentType: order.appointmentType || "pickup",
          appointmentTime: order.appointmentTime || "",
        });
      } else {
        navigate("/orders");
      }
    }
  }, [id, isEditMode, navigate]);

  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    // Validation
    if (!form.name || !form.phone || !form.due) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    // Tự động set ngày khách tới đo / đặt may thành ngày hiện tại khi tạo đơn mới
    const receiveDate = isEditMode 
      ? form.receive 
      : new Date().toISOString().split("T")[0];

    const orderData = {
      name: form.name,
      phone: form.phone,
      receive: receiveDate, // Tự động set ngày hiện tại khi tạo đơn mới
      due: form.due,
      total: form.total.toString(),
      notes: form.notes,
      status: form.status,
      measurements: form.measurements || {},
      sampleImages: form.sampleImages || null,
      // Tự động tạo lịch hẹn khi tạo đơn mới
      appointmentType: form.appointmentType || "pickup",
      appointmentDate: form.due, // Lấy ngày hẹn từ due date
      appointmentTime: form.appointmentTime || "",
    };

    if (isEditMode) {
      // Update existing order
      // Nếu chưa có lịch hẹn và có ngày hẹn, tự động tạo lịch hẹn
      const existingOrder = getOrderById(id);
      if (!existingOrder.appointmentDate && form.due) {
        orderData.appointmentDate = form.due;
        orderData.appointmentType = orderData.appointmentType || "pickup";
      }
      
      const updated = updateOrder(id, orderData);
      if (updated) {
        setPopupMessage("Cập nhật đơn thành công!");
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
          navigate(`/orders/${id}`);
        }, 1500);
      }
    } else {
      // Create new order
      const newOrder = addOrder(orderData);
      if (newOrder) {
        const appointmentTypeLabel = form.appointmentType === "fitting" ? "Thử đồ" : "Nhận đồ";
        setPopupMessage(`Tạo đơn thành công! Lịch hẹn ${appointmentTypeLabel} đã được tạo cho ngày ${form.due}`);
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
          navigate("/orders");
        }, 2000);
      }
    }
  };

  return (
    <>
      {/* POPUP SUCCESS */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-3xl shadow-xl text-center border border-gray-200 animate-fadeIn">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 text-green-700 flex items-center justify-center rounded-full text-4xl">
                ✓
              </div>
            </div>

            <h2 className="text-2xl font-semibold text-gray-700">
              {popupMessage}
            </h2>

            <p className="text-gray-500 mt-2">
              Hệ thống sẽ tự chuyển bạn về trang danh sách...
            </p>
          </div>
        </div>
      )}

      {/* FORM */}
      <div className="max-w-3xl mx-auto bg-white p-10 rounded-3xl shadow border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold text-gray-700">
            {isEditMode ? "Chỉnh sửa đơn đặt may" : "Tạo đơn đặt may"}
          </h1>
          <button
            onClick={() => navigate("/orders")}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            ← Quay lại
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-gray-600 text-sm">
              Tên khách hàng <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full p-3 mt-1 border rounded-xl"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Nhập tên khách hàng"
            />
          </div>

          <div>
            <label className="text-gray-600 text-sm">
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full p-3 mt-1 border rounded-xl"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="Nhập số điện thoại"
            />
          </div>

          {isEditMode ? (
            <div>
              <label className="text-gray-600 text-sm">
                Ngày khách tới đo / đặt may <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full p-3 mt-1 border rounded-xl"
                value={form.receive}
                onChange={(e) => update("receive", e.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className="text-gray-600 text-sm">
                Ngày khách tới đo / đặt may
              </label>
              <div className="mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700 font-medium">
                    {new Date().toLocaleDateString("vi-VN", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">(Tự động đặt khi submit)</span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="text-gray-600 text-sm">
              Ngày hẹn <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full p-3 mt-1 border rounded-xl"
              value={form.due}
              onChange={(e) => update("due", e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              Lịch hẹn sẽ tự động được tạo cho ngày này
            </p>
          </div>

          <div>
            <label className="text-gray-600 text-sm">Tổng tiền</label>
            <input
              type="number"
              className="w-full p-3 mt-1 border rounded-xl"
              value={form.total}
              onChange={(e) => update("total", e.target.value)}
              placeholder="Nhập tổng tiền"
            />
          </div>

          {isEditMode && (
            <div>
              <label className="text-gray-600 text-sm">Trạng thái</label>
              <select
                className="w-full p-3 mt-1 border rounded-xl"
                value={form.status}
                onChange={(e) => update("status", e.target.value)}
              >
                <option value="Mới">Mới</option>
                <option value="Đang may">Đang may</option>
                <option value="Hoàn thành">Hoàn thành</option>
                <option value="Hủy">Hủy</option>
              </select>
            </div>
          )}

          {!isEditMode && (
            <>
              <div>
                <label className="text-gray-600 text-sm">Loại lịch hẹn</label>
                <select
                  className="w-full p-3 mt-1 border rounded-xl"
                  value={form.appointmentType}
                  onChange={(e) => update("appointmentType", e.target.value)}
                >
                  <option value="pickup">Nhận đồ</option>
                  <option value="fitting">Thử đồ</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Lịch hẹn sẽ tự động được tạo khi lưu đơn
                </p>
              </div>

              <div>
                <label className="text-gray-600 text-sm">Giờ hẹn (tùy chọn)</label>
                <input
                  type="time"
                  className="w-full p-3 mt-1 border rounded-xl"
                  value={form.appointmentTime}
                  onChange={(e) => update("appointmentTime", e.target.value)}
                />
              </div>
            </>
          )}

          <div className="col-span-2">
            <label className="text-gray-600 text-sm">Ghi chú</label>
            <textarea
              className="w-full p-3 mt-1 border rounded-xl h-28"
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              placeholder="Nhập ghi chú (nếu có)"
            />
          </div>
        </div>

        {/* Measurements Section */}
        <div className="mt-6">
          <MeasurementsForm
            measurements={form.measurements || {}}
            onChange={(measurements) => update("measurements", measurements)}
          />
        </div>

        {/* Sample Images Section */}
        <div className="mt-6">
          <SampleImagesForm
            images={form.sampleImages}
            onChange={(images) => update("sampleImages", images)}
          />
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            className="px-6 py-3 bg-green-700 text-white rounded-xl hover:bg-green-800 transition"
          >
            {isEditMode ? "Cập nhật đơn" : "Lưu đơn"}
          </button>
          <button
            onClick={() => navigate("/orders")}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition"
          >
            Hủy
          </button>
        </div>
      </div>
    </>
  );
}
