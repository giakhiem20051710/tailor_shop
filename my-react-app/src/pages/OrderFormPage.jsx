import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import orderService from "../services/orderService";
import CustomerApi from "../services/api/CustomerApi";
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
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState(null);

  // Load order data if in edit mode
  useEffect(() => {
    const loadOrder = async () => {
      if (isEditMode && id) {
        try {
          setLoading(true);
          const response = await orderService.getDetail(id);
          console.log('[OrderFormPage] Order detail response:', response);
          
          // Backend trả về CommonResponse với responseData
          const orderData = response?.responseData ?? response?.data ?? response;
          
          if (orderData) {
            console.log('[OrderFormPage] Parsed order data:', orderData);
            setForm({
              name: orderData.customer?.name || "",
              phone: orderData.customerPhone || orderData.customer?.phone || "",
              receive: orderData.appointmentDate || "",
              due: orderData.dueDate || "",
              total: orderData.total?.toString() || "",
              notes: orderData.note || "",
              status: orderData.status || "DRAFT",
              measurements: orderData.measurement ? {
                chest: orderData.measurement.chest,
                waist: orderData.measurement.waist,
                hip: orderData.measurement.hip,
                shoulder: orderData.measurement.shoulder,
                sleeve: orderData.measurement.sleeve,
                bicep: orderData.measurement.bicep,
                height: orderData.measurement.height,
                weight: orderData.measurement.weight,
                neck: orderData.measurement.neck,
                thigh: orderData.measurement.thigh,
                crotch: orderData.measurement.crotch,
                ankle: orderData.measurement.ankle,
                shirtLength: orderData.measurement.shirtLength,
                pantsLength: orderData.measurement.pantsLength,
              } : {},
              sampleImages: orderData.attachments?.map(a => a.url || a.fileUrl) || null,
              appointmentType: "pickup",
              appointmentTime: "",
            });
            setCustomerId(orderData.customer?.id);
          } else {
            console.warn('[OrderFormPage] No order data found');
            navigate("/orders");
          }
        } catch (error) {
          console.error("[OrderFormPage] Error loading order:", error);
          alert("Không thể tải thông tin đơn hàng: " + (error.message || "Lỗi không xác định"));
          navigate("/orders");
        } finally {
          setLoading(false);
        }
      }
    };
    loadOrder();
  }, [id, isEditMode, navigate]);

  const update = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // Tìm hoặc tạo customer
  const findOrCreateCustomer = async (name, phone) => {
    try {
      // Tìm customer theo phone qua API mới
      const customerResponse = await CustomerApi.getCustomerByPhone(phone);
      console.log('[OrderFormPage] Customer by phone response:', customerResponse);
      
      const customerData = customerResponse?.responseData ?? customerResponse?.data ?? customerResponse;
      
      if (customerData && customerData.id) {
        console.log('[OrderFormPage] Found existing customer:', customerData.id);
        return customerData.id;
      }

      // Nếu không tìm thấy, tạo customer mới
      console.log('[OrderFormPage] Creating new customer...');
      // Cần tìm roleId của CUSTOMER - tạm thời dùng roleId = 3 (thường là CUSTOMER)
      const newCustomerResponse = await CustomerApi.createCustomer({
        name,
        phone,
        roleId: 3, // CUSTOMER role ID - cần kiểm tra trong DB
        username: phone, // Dùng phone làm username
        password: "123456", // Mật khẩu mặc định, có thể yêu cầu đổi sau
        email: `${phone}@temp.com`, // Email tạm
      });
      
      console.log('[OrderFormPage] New customer response:', newCustomerResponse);
      const newCustomer = newCustomerResponse?.responseData ?? newCustomerResponse?.data ?? newCustomerResponse;
      
      if (newCustomer?.id) {
        return newCustomer.id;
      }
      
      throw new Error("Không thể tạo khách hàng mới");
    } catch (error) {
      console.error("[OrderFormPage] Error finding/creating customer:", error);
      throw new Error("Không thể tìm hoặc tạo khách hàng: " + (error.message || "Lỗi không xác định"));
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!form.name || !form.phone || !form.due) {
      alert("Vui lòng điền đầy đủ thông tin bắt buộc");
      return;
    }

    setLoading(true);

    try {
      if (isEditMode) {
        // Tìm hoặc tạo customer nếu name/phone thay đổi
        let customerIdToUse = customerId;
        if (form.name && form.phone) {
          customerIdToUse = await findOrCreateCustomer(form.name, form.phone);
        }

        // Map measurements
        const measurement = {
          chest: form.measurements.chest ? parseFloat(form.measurements.chest) : null,
          waist: form.measurements.waist ? parseFloat(form.measurements.waist) : null,
          hip: form.measurements.hip ? parseFloat(form.measurements.hip) : null,
          shoulder: form.measurements.shoulder ? parseFloat(form.measurements.shoulder) : null,
          sleeve: form.measurements.sleeve ? parseFloat(form.measurements.sleeve) : null,
          bicep: form.measurements.bicep ? parseFloat(form.measurements.bicep) : null,
          height: form.measurements.height ? parseFloat(form.measurements.height) : null,
          weight: form.measurements.weight ? parseFloat(form.measurements.weight) : null,
          neck: form.measurements.neck ? parseFloat(form.measurements.neck) : null,
          thigh: form.measurements.thigh ? parseFloat(form.measurements.thigh) : null,
          crotch: form.measurements.crotch ? parseFloat(form.measurements.crotch) : null,
          ankle: form.measurements.ankle ? parseFloat(form.measurements.ankle) : null,
          shirtLength: form.measurements.shirtLength ? parseFloat(form.measurements.shirtLength) : null,
          pantsLength: form.measurements.pantsLength ? parseFloat(form.measurements.pantsLength) : null,
          note: form.notes || "",
        };

        // Update order
        const updateData = {
          customerId: customerIdToUse,
          dueDate: form.due || null,
          appointmentDate: form.receive || null,
          total: form.total ? parseFloat(form.total) : null,
          note: form.notes || "",
          measurement,
        };

        await orderService.update(id, updateData);

        setPopupMessage("Cập nhật đơn thành công!");
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
          navigate(`/orders/${id}`);
        }, 1500);
      } else {
        // Tìm hoặc tạo customer
        const customerIdToUse = await findOrCreateCustomer(form.name, form.phone);

        // Map measurements
        const measurement = {
          chest: form.measurements.chest ? parseFloat(form.measurements.chest) : null,
          waist: form.measurements.waist ? parseFloat(form.measurements.waist) : null,
          hip: form.measurements.hip ? parseFloat(form.measurements.hip) : null,
          shoulder: form.measurements.shoulder ? parseFloat(form.measurements.shoulder) : null,
          sleeve: form.measurements.sleeve ? parseFloat(form.measurements.sleeve) : null,
          bicep: form.measurements.bicep ? parseFloat(form.measurements.bicep) : null,
          height: form.measurements.height ? parseFloat(form.measurements.height) : null,
          weight: form.measurements.weight ? parseFloat(form.measurements.weight) : null,
          neck: form.measurements.neck ? parseFloat(form.measurements.neck) : null,
          thigh: form.measurements.thigh ? parseFloat(form.measurements.thigh) : null,
          crotch: form.measurements.crotch ? parseFloat(form.measurements.crotch) : null,
          ankle: form.measurements.ankle ? parseFloat(form.measurements.ankle) : null,
          shirtLength: form.measurements.shirtLength ? parseFloat(form.measurements.shirtLength) : null,
          pantsLength: form.measurements.pantsLength ? parseFloat(form.measurements.pantsLength) : null,
          note: form.notes || "",
        };

        // Tạo order qua wizard
        const wizardOrder = {
          customerId: customerIdToUse,
          contact: {
            name: form.name,
            phone: form.phone,
            email: "",
            address: "",
          },
          product: {
            productName: "Đơn đặt may", // Tên mặc định
            productType: "",
            description: form.notes || "",
            budget: form.total ? parseFloat(form.total) : 0,
            dueDate: form.due,
            notes: form.notes || "",
            appointmentType: form.appointmentType || "pickup",
            appointmentTime: form.appointmentTime || "",
          },
          measurement,
        };

        console.log('[OrderFormPage] Tạo order với data:', wizardOrder);
        const response = await orderService.createWizard(wizardOrder);
        console.log('[OrderFormPage] Order API response:', response);
        
        const responseData = response?.responseData ?? response?.data ?? response;
        console.log('[OrderFormPage] Order response data:', responseData);

        if (responseData?.id) {
          const appointmentTypeLabel = form.appointmentType === "fitting" ? "Thử đồ" : "Nhận đồ";
          setPopupMessage(`Tạo đơn thành công! Lịch hẹn ${appointmentTypeLabel} đã được tạo cho ngày ${form.due}`);
          setShowPopup(true);
          setTimeout(() => {
            setShowPopup(false);
            navigate("/orders");
          }, 2000);
        } else {
          console.error('[OrderFormPage] Order không có ID:', responseData);
          throw new Error("Không thể tạo đơn hàng");
        }
      }
    } catch (error) {
      console.error("Error saving order:", error);
      alert("Lỗi: " + (error.response?.data?.message || error.message || "Không thể lưu đơn hàng"));
    } finally {
      setLoading(false);
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
                <option value="DRAFT">DRAFT</option>
                <option value="WAITING_FOR_QUOTE">WAITING_FOR_QUOTE</option>
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="FITTING">FITTING</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="CANCELLED">CANCELLED</option>
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
            disabled={loading}
            className="px-6 py-3 bg-green-700 text-white rounded-xl hover:bg-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Đang xử lý..." : (isEditMode ? "Cập nhật đơn" : "Lưu đơn")}
          </button>
          <button
            onClick={() => navigate("/orders")}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
          >
            Hủy
          </button>
        </div>
      </div>
    </>
  );
}
