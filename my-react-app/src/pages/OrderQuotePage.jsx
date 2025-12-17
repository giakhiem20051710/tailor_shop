import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { orderService } from "../services";

export default function OrderQuotePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finalQuote, setFinalQuote] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  useEffect(() => {
    loadOrder();
  }, [id]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const response = await orderService.getDetail(id);
      const responseData = response?.data ?? response?.responseData ?? response;
      if (responseData) {
        setOrder(responseData);
        // Set initial quote from total or expectedBudget
        if (responseData.total && Number(responseData.total) > 0) {
          setFinalQuote(Number(responseData.total).toString());
        } else if (responseData.expectedBudget) {
          setFinalQuote(Number(responseData.expectedBudget).toString());
        }
      }
    } catch (error) {
      console.error("Error loading order:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return "0";
    return Number(amount).toLocaleString("vi-VN");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusStep = (status) => {
    const statusMap = {
      DRAFT: 1,
      WAITING_FOR_QUOTE: 2,
      CONFIRMED: 3,
      IN_PROGRESS: 4,
      FITTING: 4,
      COMPLETED: 5,
      CANCELLED: 0,
    };
    return statusMap[status] || 1;
  };

  const handleSubmitQuote = async () => {
    if (!finalQuote || Number(finalQuote) <= 0) {
      alert("Vui lòng nhập số tiền báo giá hợp lệ");
      return;
    }

    try {
      // Update order với total và status
      const updateData = {
        status: "CONFIRMED",
        total: Number(finalQuote),
      };
      
      if (internalNotes) {
        updateData.note = internalNotes;
      }

      await orderService.updateStatus(id, updateData);
      alert("Báo giá đã được gửi thành công!");
      navigate("/orders");
    } catch (error) {
      console.error("Error submitting quote:", error);
      alert("Có lỗi xảy ra khi gửi báo giá. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Không tìm thấy đơn hàng</p>
          <button
            onClick={() => navigate("/orders")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  const currentStep = getStatusStep(order.status);
  const steps = [
    { id: 1, label: "Received", icon: "✓", completed: currentStep >= 1 },
    { id: 2, label: "Quoting", icon: "📝", current: currentStep === 2 },
    { id: 3, label: "Deposit", icon: "💰", completed: currentStep >= 3 },
    { id: 4, label: "Tailoring", icon: "✂️", completed: currentStep >= 4 },
    { id: 5, label: "Done", icon: "✓", completed: currentStep >= 5 },
  ];

  const estimatedBudget = order.expectedBudget
    ? Number(order.expectedBudget)
    : null;
  const budgetRange = estimatedBudget
    ? `${formatCurrency(estimatedBudget * 0.8)} - ${formatCurrency(estimatedBudget * 1.2)}`
    : "Chưa có";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/orders")}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                #{order.code || `ORD-${order.id}`}
              </h1>
            </div>
          </div>
          <button className="text-gray-600 hover:text-gray-900">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status Tag & Date */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-4 py-1.5 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                <path
                  fillRule="evenodd"
                  d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                  clipRule="evenodd"
                />
              </svg>
              WAITING_FOR_QUOTE
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Placed on {formatDate(order.createdAt)} • {formatTime(order.createdAt)}
          </p>

          {/* Progress Bar */}
          <div className="flex items-center gap-2">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      step.completed
                        ? "bg-blue-600 text-white"
                        : step.current
                        ? "bg-yellow-500 text-white ring-4 ring-yellow-200"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step.completed ? (
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span>{step.icon}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center ${
                      step.current
                        ? "text-yellow-600 font-semibold"
                        : step.completed
                        ? "text-blue-600"
                        : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 -mt-5 ${
                      step.completed ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Customer Section */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Customer</h2>
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                {order.customer?.name
                  ? order.customer.name.charAt(0).toUpperCase()
                  : order.name
                  ? order.name.charAt(0).toUpperCase()
                  : "K"}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">
                {order.customer?.name || order.name || "Khách hàng"}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {order.customerPhone || order.phone || "—"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                New Customer • 2 Previous Orders
              </p>
            </div>
            <button className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 hover:bg-blue-200 transition">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Items to Quote Section */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Items to Quote
            </h2>
            <span className="text-sm text-gray-600">
              {order.items?.length || 1} Items
            </span>
          </div>

          <div className="space-y-3">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg p-4 flex items-start gap-4"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {item.productName || order.productName || "Sản phẩm may đo"}
                    </h3>
                    {item.productType && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Fabric:</span> {item.productType}
                      </p>
                    )}
                    {order.description && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Style:</span> {order.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                        x{item.quantity || 1}
                      </span>
                      <span className="text-xs text-gray-500">Pending Quote</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="border border-gray-200 rounded-lg p-4 flex items-start gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {order.productName || extractProductNameFromNote(order.note) || "Sản phẩm may đo"}
                  </h3>
                  {extractProductTypeFromNote(order.note) && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Type:</span> {extractProductTypeFromNote(order.note)}
                    </p>
                  )}
                  {order.description && (
                    <p className="text-sm text-gray-600 mb-1">
                      <span className="font-medium">Description:</span> {order.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">
                      x1
                    </span>
                    <span className="text-xs text-gray-500">Pending Quote</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Measurements Section */}
        {order.measurement && (
          <div className="bg-blue-900 rounded-lg shadow-sm p-4 text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Measurements</h2>
              <button className="text-sm text-blue-200 hover:text-white flex items-center gap-1">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {order.measurement.chest ? (
                <div>
                  <p className="text-xs text-blue-300 mb-1">CHEST</p>
                  <p className="text-lg font-semibold">
                    {order.measurement.chest}"
                  </p>
                </div>
              ) : null}
              {order.measurement.waist ? (
                <div>
                  <p className="text-xs text-blue-300 mb-1">WAIST</p>
                  <p className="text-lg font-semibold">
                    {order.measurement.waist}"
                  </p>
                </div>
              ) : null}
              {order.measurement.hip ? (
                <div>
                  <p className="text-xs text-blue-300 mb-1">HIPS</p>
                  <p className="text-lg font-semibold">
                    {order.measurement.hip}"
                  </p>
                </div>
              ) : null}
              {order.measurement.shoulder ? (
                <div>
                  <p className="text-xs text-blue-300 mb-1">SHOULDER</p>
                  <p className="text-lg font-semibold">
                    {order.measurement.shoulder}"
                  </p>
                </div>
              ) : null}
              {order.measurement.sleeve ? (
                <div>
                  <p className="text-xs text-blue-300 mb-1">SLEEVE</p>
                  <p className="text-lg font-semibold">
                    {order.measurement.sleeve}"
                  </p>
                </div>
              ) : null}
              {order.measurement.neck ? (
                <div>
                  <p className="text-xs text-blue-300 mb-1">NECK</p>
                  <p className="text-lg font-semibold">
                    {order.measurement.neck}"
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-blue-300 mb-1">NECK</p>
                  <p className="text-lg font-semibold text-blue-300">--</p>
                </div>
              )}
            </div>
            <p className="text-xs text-blue-300 mt-4">
              Last updated: {formatDate(order.updatedAt || order.createdAt)} by Staff Member
            </p>
          </div>
        )}

        {/* Quote Section */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-1">Estimated Budget</p>
            <p className="text-lg font-semibold text-gray-900">
              {budgetRange !== "Chưa có"
                ? `${budgetRange} đ`
                : "Chưa có ngân sách dự kiến"}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              FINAL QUOTE AMOUNT (₫)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                ₫
              </span>
              <input
                type="number"
                value={finalQuote}
                onChange={(e) => setFinalQuote(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-lg font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Add internal notes..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <button className="w-10 h-10 border border-gray-300 rounded-lg flex items-center justify-center text-gray-600 hover:bg-gray-50">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmitQuote}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg"
        >
          <span>SUBMIT QUOTE</span>
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Helper functions
function extractProductNameFromNote(note) {
  if (!note) return null;
  const match = note.match(/Product:\s*([^.,\n]*)/i);
  return match ? match[1].trim() : null;
}

function extractProductTypeFromNote(note) {
  if (!note) return null;
  const match = note.match(/Type:\s*([^.,\n]*)/i);
  return match ? match[1].trim() : null;
}

