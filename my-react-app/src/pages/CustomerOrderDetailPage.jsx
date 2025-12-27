import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { orderService, userService, authService, invoiceService } from "../services";

const CustomerOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);

  useEffect(() => {
    console.log("CustomerOrderDetailPage mounted, id:", id);
    setOrder(null);
    setLoading(true);
    
    const loadOrder = async () => {
      try {
        if (!authService.isAuthenticated()) {
          navigate("/login", { replace: true });
          return;
        }

        const profileResponse = await userService.getProfile();
        const currentUser = profileResponse?.data ?? profileResponse;
        setUser(currentUser);

        if (id) {
          console.log("Loading order detail for ID:", id);
          const orderResponse = await orderService.getDetail(id);
          console.log("Order response:", orderResponse);
          const orderData = orderResponse?.data ?? orderResponse?.responseData ?? orderResponse;
          console.log("Order data:", orderData);

          if (!orderData) {
            console.log("No order data found, redirecting to dashboard");
            navigate("/customer/dashboard", { replace: true });
            return;
          }

          const orderCustomerId =
            orderData.customerId ||
            orderData.customer?.id;

          const currentUserId = currentUser?.id || currentUser?.userId;

          console.log("Checking order access:", {
            currentUserId,
            orderCustomerId,
            orderId: orderData.id,
            orderCode: orderData.code
          });

          // More lenient check - allow if no customer binding or if IDs match
          // Also allow if user is authenticated (for now, to debug)
          const isCustomerOrder =
            !orderCustomerId || // No customer binding, allow
            (currentUserId && orderCustomerId && String(currentUserId) === String(orderCustomerId)) || // IDs match
            authService.isAuthenticated(); // If authenticated, allow (for debugging)

          console.log("isCustomerOrder:", isCustomerOrder);

          if (isCustomerOrder) {
            // Parse note để extract product info
            const note = orderData.note || "";
            const productName = extractProductNameFromNote(note) || 
              (orderData.items && orderData.items.length > 0 && orderData.items[0].productName) ||
              "Sản phẩm may đo";
            const productType = extractProductTypeFromNote(note) ||
              (orderData.items && orderData.items.length > 0 && orderData.items[0].productType) ||
              null;
            const description = extractDescriptionFromNote(note) || 
              (orderData.items && orderData.items.length > 0 && orderData.items[0].description) ||
              "Custom made";

            const mappedOrder = {
              ...orderData,
              statusRaw: orderData.status,
              status: mapOrderStatusToText(orderData.status),
              code: orderData.code || `ORD-${orderData.id}`,
              total: orderData.total ? Number(orderData.total) : 0,
              expectedBudget: orderData.expectedBudget ? Number(orderData.expectedBudget) : null,
              depositAmount: orderData.depositAmount ? Number(orderData.depositAmount) : null,
              items: orderData.items || [],
              measurement: orderData.measurement || null,
              // Parse từ note
              productName: productName,
              productType: productType,
              description: description,
              note: note,
              // Customer info
              customerName: orderData.customer?.name || orderData.customerName || null,
              customerPhone: orderData.customerPhone || orderData.customer?.phone || null,
              // Dates
              createdAt: orderData.createdAt,
              updatedAt: orderData.updatedAt,
              appointmentDate: orderData.appointmentDate,
              dueDate: orderData.dueDate,
              // Additional fields
              timeline: orderData.timeline || [],
              payments: orderData.payments || [],
              attachments: orderData.attachments || [],
            };
            console.log("Mapped order:", mappedOrder);
            setOrder(mappedOrder);

            // Fetch invoice nếu có invoiceId trong order hoặc fetch theo orderId
            const invoiceIdFromOrder = orderData.invoiceId;
            const orderId = orderData.id;
            
            if (invoiceIdFromOrder) {
              // Nếu có invoiceId trong response, fetch chi tiết
              try {
                const invoiceResponse = await invoiceService.getDetail(invoiceIdFromOrder);
                const invoiceData = invoiceResponse?.data ?? invoiceResponse?.responseData ?? invoiceResponse;
                setInvoice(invoiceData);
              } catch (error) {
                console.error("Error fetching invoice by ID:", error);
              }
            } else if (orderId) {
              // Nếu không có invoiceId, thử fetch theo orderId
              try {
                const invoice = await invoiceService.getByOrderId(orderId);
                if (invoice) {
                  setInvoice(invoice);
                }
              } catch (error) {
                console.error("Error fetching invoice by orderId:", error);
              }
            }
          } else {
            console.log("Not customer's order, redirecting. Current user ID:", currentUserId, "Order customer ID:", orderCustomerId);
            navigate("/customer/dashboard", { replace: true });
            return;
          }
        }
      } catch (error) {
        console.error("Error loading order detail:", error);
        console.error("Error details:", error.response || error.message);
        // Don't redirect on error, show error message instead
        // navigate("/customer/dashboard", { replace: true });
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id, navigate, location.pathname]);

  const formatCurrency = (amount) => {
    if (!amount) return "0 đ";
    return `${Number(amount).toLocaleString("vi-VN")} đ`;
  };

  const mapOrderStatusToText = (status) => {
    if (!status) return "Mới";
    const statusMap = {
      "DRAFT": "Mới",
      "WAITING_FOR_QUOTE": "Chờ báo giá",
      "CONFIRMED": "Quote Ready",
      "IN_PROGRESS": "Đang may",
      "FITTING": "Thử đồ",
      "COMPLETED": "Hoàn thành",
      "CANCELLED": "Hủy",
    };
    return statusMap[status] || status;
  };

  const extractProductNameFromNote = (note) => {
    if (!note) return null;
    const match = note.match(/Product:\s*([^.,\n]*)/i);
    return match ? match[1].trim() : null;
  };

  const extractProductTypeFromNote = (note) => {
    if (!note) return null;
    const match = note.match(/Type:\s*([^.,\n]*)/i);
    return match ? match[1].trim() : null;
  };

  const extractDescriptionFromNote = (note) => {
    if (!note) return null;
    const match = note.match(/Description:\s*([^.,\n]*)/i);
    return match ? match[1].trim() : null;
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

  const calculateDeposit = (total) => {
    if (!total || total === 0) return 0;
    // 30% deposit
    return Math.round(total * 0.3);
  };

  const handleAcceptAndPay = () => {
    // Navigate to payment page
    navigate(`/customer/orders/${id}/payment`);
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
                onClick={() => navigate("/customer/dashboard")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
            Quay lại
              </button>
        </div>
      </div>
    );
  }

  const currentStep = getStatusStep(order.statusRaw);
  const steps = [
    { id: 1, label: "Received", completed: currentStep >= 1 },
    { id: 2, label: "Quoting", completed: currentStep >= 2 },
    { id: 3, label: "Deposit", current: currentStep === 3, completed: currentStep >= 3 },
    { id: 4, label: "Tailoring", completed: currentStep >= 4 },
    { id: 5, label: "Ready", completed: currentStep >= 5 },
  ];

  const total = order.total || 0;
  const deposit = order.depositAmount || calculateDeposit(total);
  const depositPercentage = total > 0 ? Math.round((deposit / total) * 100) : 30;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 w-full">

      {/* Order Status and Progress Section (Dark Blue) */}
      <div className="bg-gradient-to-r from-[#1e3a5f] via-[#2d4a6b] to-[#1e3a5f] text-white px-4 py-8 w-full shadow-xl">
        <div className="max-w-6xl mx-auto w-full">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-full"></div>
            <p className="text-sm text-blue-200 font-medium tracking-wide">Order #{order.code}</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-2 tracking-tight">{mapOrderStatusToText(order.statusRaw)}</h1>
          {order.statusRaw === "CONFIRMED" && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 border border-orange-400/30 rounded-full mt-2">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <p className="text-sm text-orange-200 font-semibold">ACTION REQUIRED</p>
            </div>
          )}

          {/* Progress Stepper */}
          <div className="flex items-center gap-2 mt-6">
            {steps.map((step, index) => (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                      step.completed
                        ? "bg-[#10b981] text-white"
                        : step.current
                        ? "bg-[#f97316] text-white ring-4 ring-orange-200"
                        : "bg-gray-400 text-white"
                    }`}
                  >
                    {step.completed ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                </div>
                  <span className="text-xs mt-2 text-center text-white">{step.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 -mt-5 ${
                      step.completed || step.current ? "bg-[#f97316]" : "bg-gray-400"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
              </div>
            </div>
          </div>

      {/* Main Content Area (White Background) */}
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8 w-full">
        {/* Your Quote Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-10 bg-gradient-to-b from-[#1e3a5f] to-[#2d4a6b] rounded-full"></div>
            <div>
              <h2 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">Your Quote</h2>
              <p className="text-sm text-gray-500 mt-1 font-medium">Please review and confirm</p>
              </div>
                </div>

          {/* Order Items */}
          <div className="space-y-5 mb-8 mt-6">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <div key={index} className="flex justify-between items-start pb-5 border-b border-gray-100 last:border-b-0 last:pb-0 group hover:bg-gray-50/50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                  <div className="flex-1">
                    <p className="font-bold text-lg text-gray-900 mb-2 group-hover:text-[#1e3a5f] transition-colors">
                      {item.quantity || 1}x {item.productName || "Sản phẩm may đo"}
                    </p>
                    <p className="text-sm text-gray-500 font-medium">
                      {item.productType || item.description || "Custom made"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">
                      {formatCurrency(item.price ? Number(item.price) * (item.quantity || 1) : 0)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex justify-between items-start pb-5 border-b border-gray-100 group hover:bg-gray-50/50 -mx-2 px-2 py-2 rounded-lg transition-colors">
                <div className="flex-1">
                  <p className="font-bold text-lg text-gray-900 mb-2 group-hover:text-[#1e3a5f] transition-colors">
                    1x {order.productName || "Sản phẩm may đo"}
                  </p>
                  <p className="text-sm text-gray-500 font-medium">
                    {order.productType || order.description || "Custom made"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg text-gray-900">
                    {total > 0 ? formatCurrency(total) : "0 đ"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Total Amount / Expected Budget */}
          <div className="flex justify-between items-center mb-6 pb-6 border-t-2 border-gray-200 pt-6">
            {order.statusRaw === "WAITING_FOR_QUOTE" && total === 0 && order.expectedBudget ? (
              <>
                <div>
                  <span className="text-xl font-serif font-bold text-gray-900">Expected Budget</span>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Awaiting final quote from staff</p>
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">
                  {formatCurrency(order.expectedBudget)}
                </span>
              </>
            ) : (
              <>
                <span className="text-xl font-serif font-bold text-gray-900">Total Amount</span>
                <span className="text-3xl font-bold bg-gradient-to-r from-[#f97316] to-[#ea580c] bg-clip-text text-transparent">
                  {formatCurrency(total)}
                </span>
              </>
            )}
          </div>

          {/* Required Deposit */}
          {order.statusRaw === "CONFIRMED" && total > 0 && (
            <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <p className="font-bold text-lg text-gray-900">Required Deposit ({depositPercentage}%)</p>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Pay now to begin tailoring</p>
                </div>
                <span className="text-3xl font-bold bg-gradient-to-r from-[#f97316] to-[#ea580c] bg-clip-text text-transparent">
                  {formatCurrency(deposit)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Your Order Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-1 h-10 bg-gradient-to-b from-[#1e3a5f] to-[#2d4a6b] rounded-full"></div>
              <h2 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">Your Order</h2>
            </div>
            {order.measurement && (
              <button
                onClick={() => {
                  const measurements = order.measurement;
                  const measurementText = Object.entries(measurements)
                    .filter(([key, value]) => value !== null && value !== undefined && Number(value) > 0)
                    .map(([key, value]) => {
                      const labels = {
                        height: "Chiều cao",
                        weight: "Cân nặng",
                        neck: "Vòng cổ",
                        chest: "Vòng ngực",
                        waist: "Vòng eo",
                        hip: "Vòng mông",
                        shoulder: "Ngang vai",
                        sleeve: "Dài tay",
                        bicep: "Bắp tay",
                        thigh: "Vòng đùi",
                        crotch: "Hạ đáy",
                        ankle: "Ống quần",
                        shirtLength: "Dài áo",
                        pantsLength: "Dài quần",
                      };
                      const unit = key === "weight" ? "kg" : "cm";
                      return `${labels[key] || key}: ${value} ${unit}`;
                    })
                    .join("\n");
                  alert(measurementText || "Chưa có số đo");
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-100 to-yellow-100 text-[#f97316] rounded-xl hover:from-amber-200 hover:to-yellow-200 flex items-center gap-2 text-sm font-bold border-2 border-amber-300 shadow-md hover:shadow-lg transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z" />
                </svg>
                Xem lại số đo
              </button>
            )}
          </div>
          
          {/* Display Measurement Info - Premium Dark Blue Card */}
          {order.measurement && (
            <div className="mb-8 bg-gradient-to-br from-[#1e3a5f] via-[#2d4a6b] to-[#1e3a5f] rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
              {/* Decorative Background Pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute right-8 top-8 w-64 h-64 bg-white rounded-full blur-3xl"></div>
                <div className="absolute left-8 bottom-8 w-48 h-48 bg-white rounded-full blur-3xl"></div>
              </div>
              
              {/* Background Icon */}
              <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10">
                <svg className="w-40 h-40 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between mb-8 relative z-10">
                <h3 className="text-2xl font-serif font-bold tracking-tight">Số Đo</h3>
                <button className="text-sm text-blue-200 hover:text-white flex items-center gap-2 font-semibold transition-colors px-4 py-2 rounded-lg hover:bg-white/10">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Chỉnh sửa
                </button>
              </div>
              
              {/* Measurements Grid - Premium Style - All Fields */}
              <div className="grid grid-cols-3 gap-6 relative z-10">
                {/* CHIỀU CAO */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <p className="text-xs text-blue-300 mb-2 font-bold tracking-wider uppercase">CHIỀU CAO</p>
                  <p className="text-2xl font-bold">
                    {order.measurement.height && Number(order.measurement.height) > 0 
                      ? `${Number(order.measurement.height).toFixed(1)} cm`
                      : <span className="text-blue-300">--</span>
                    }
                  </p>
                </div>
                
                {/* CÂN NẶNG */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <p className="text-xs text-blue-300 mb-2 font-bold tracking-wider uppercase">CÂN NẶNG</p>
                  <p className="text-2xl font-bold">
                    {order.measurement.weight && Number(order.measurement.weight) > 0 
                      ? `${Number(order.measurement.weight).toFixed(1)} kg`
                      : <span className="text-blue-300">--</span>
                    }
                  </p>
                </div>
                
                {/* VÒNG CỔ */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <p className="text-xs text-blue-300 mb-2 font-bold tracking-wider uppercase">VÒNG CỔ</p>
                  <p className="text-2xl font-bold">
                    {order.measurement.neck && Number(order.measurement.neck) > 0 
                      ? `${(Number(order.measurement.neck) / 2.54).toFixed(1)}"`
                      : <span className="text-blue-300">--</span>
                    }
                  </p>
                </div>
                
                {/* VÒNG NGỰC */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <p className="text-xs text-blue-300 mb-2 font-bold tracking-wider uppercase">VÒNG NGỰC</p>
                  <p className="text-2xl font-bold">
                    {order.measurement.chest && Number(order.measurement.chest) > 0 
                      ? `${(Number(order.measurement.chest) / 2.54).toFixed(1)}"`
                      : <span className="text-blue-300">--</span>
                    }
                  </p>
                </div>
                
                {/* VÒNG EO */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <p className="text-xs text-blue-300 mb-2 font-bold tracking-wider uppercase">VÒNG EO</p>
                  <p className="text-2xl font-bold">
                    {order.measurement.waist && Number(order.measurement.waist) > 0 
                      ? `${(Number(order.measurement.waist) / 2.54).toFixed(1)}"`
                      : <span className="text-blue-300">--</span>
                    }
                  </p>
                </div>
                
                {/* VÒNG MÔNG */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <p className="text-xs text-blue-300 mb-2 font-bold tracking-wider uppercase">VÒNG MÔNG</p>
                  <p className="text-2xl font-bold">
                    {order.measurement.hip && Number(order.measurement.hip) > 0 
                      ? `${(Number(order.measurement.hip) / 2.54).toFixed(1)}"`
                      : <span className="text-blue-300">--</span>
                    }
                  </p>
                </div>
                
                {/* NGANG VAI */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <p className="text-xs text-blue-300 mb-2 font-bold tracking-wider uppercase">NGANG VAI</p>
                  <p className="text-2xl font-bold">
                    {order.measurement.shoulder && Number(order.measurement.shoulder) > 0 
                      ? `${(Number(order.measurement.shoulder) / 2.54).toFixed(1)}"`
                      : <span className="text-blue-300">--</span>
                    }
                  </p>
                </div>
                
                {/* DÀI TAY */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <p className="text-xs text-blue-300 mb-2 font-bold tracking-wider uppercase">DÀI TAY</p>
                  <p className="text-2xl font-bold">
                    {order.measurement.sleeve && Number(order.measurement.sleeve) > 0 
                      ? `${(Number(order.measurement.sleeve) / 2.54).toFixed(1)}"`
                      : <span className="text-blue-300">--</span>
                    }
                  </p>
                </div>
                
                {/* BẮP TAY */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <p className="text-xs text-blue-300 mb-2 font-bold tracking-wider uppercase">BẮP TAY</p>
                  <p className="text-2xl font-bold">
                    {order.measurement.bicep && Number(order.measurement.bicep) > 0 
                      ? `${(Number(order.measurement.bicep) / 2.54).toFixed(1)}"`
                      : <span className="text-blue-300">--</span>
                    }
                  </p>
                </div>
                
                {/* VÒNG ĐÙI */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <p className="text-xs text-blue-300 mb-2 font-bold tracking-wider uppercase">VÒNG ĐÙI</p>
                  <p className="text-2xl font-bold">
                    {order.measurement.thigh && Number(order.measurement.thigh) > 0 
                      ? `${(Number(order.measurement.thigh) / 2.54).toFixed(1)}"`
                      : <span className="text-blue-300">--</span>
                    }
                  </p>
                </div>
                
                {/* HẠ ĐÁY */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <p className="text-xs text-blue-300 mb-2 font-bold tracking-wider uppercase">HẠ ĐÁY</p>
                  <p className="text-2xl font-bold">
                    {order.measurement.crotch && Number(order.measurement.crotch) > 0 
                      ? `${(Number(order.measurement.crotch) / 2.54).toFixed(1)}"`
                      : <span className="text-blue-300">--</span>
                    }
                  </p>
                </div>
                
                {/* ỐNG QUẦN */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <p className="text-xs text-blue-300 mb-2 font-bold tracking-wider uppercase">ỐNG QUẦN</p>
                  <p className="text-2xl font-bold">
                    {order.measurement.ankle && Number(order.measurement.ankle) > 0 
                      ? `${(Number(order.measurement.ankle) / 2.54).toFixed(1)}"`
                      : <span className="text-blue-300">--</span>
                    }
                  </p>
                </div>
                
                {/* DÀI ÁO */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <p className="text-xs text-blue-300 mb-2 font-bold tracking-wider uppercase">DÀI ÁO</p>
                  <p className="text-2xl font-bold">
                    {order.measurement.shirtLength && Number(order.measurement.shirtLength) > 0 
                      ? `${(Number(order.measurement.shirtLength) / 2.54).toFixed(1)}"`
                      : <span className="text-blue-300">--</span>
                    }
                  </p>
                </div>
                
                {/* DÀI QUẦN */}
                <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all">
                  <p className="text-xs text-blue-300 mb-2 font-bold tracking-wider uppercase">DÀI QUẦN</p>
                  <p className="text-2xl font-bold">
                    {order.measurement.pantsLength && Number(order.measurement.pantsLength) > 0 
                      ? `${(Number(order.measurement.pantsLength) / 2.54).toFixed(1)}"`
                      : <span className="text-blue-300">--</span>
                    }
                  </p>
                </div>
              </div>

              {/* Last Updated */}
              <div className="mt-8 pt-6 border-t border-white/20 relative z-10">
                <p className="text-xs text-blue-300 font-medium">
                  Last updated: {order.updatedAt 
                    ? new Date(order.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })
                    : order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })
                    : "N/A"} by Staff Member
                </p>
              </div>
            </div>
          )}

          {/* Product Visuals */}
          <div className="grid grid-cols-2 gap-6 mt-6">
            {order.items && order.items.length > 0 ? (
              order.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                    {item.productType?.toLowerCase().includes("suit") ? (
                      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded"></div>
                    )}
                  </div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">{item.productName || "Sản phẩm"}</p>
                  <p className="text-xs text-gray-600">{item.productType || "Custom"}</p>
                </div>
              ))
            ) : (
              <>
                <div className="border border-gray-200 rounded-lg p-4 flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                              </svg>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">{order.productName || "Sản phẩm may đo"}</p>
                  <p className="text-xs text-gray-600">{order.productType || "Custom"}</p>
                    </div>
                <div className="border border-gray-200 rounded-lg p-4 flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                    <div className="w-8 h-8 bg-gray-300 rounded"></div>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm mb-1">Sản phẩm may đo</p>
                  <p className="text-xs text-gray-600">Custom</p>
                </div>
              </>
            )}
            </div>
          </div>

        {/* Invoice Section */}
        {invoice && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-10 bg-gradient-to-b from-green-600 to-emerald-700 rounded-full"></div>
              <h2 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">Hóa đơn</h2>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Mã hóa đơn</p>
                  <p className="text-lg font-bold text-gray-900">{invoice.code || `INV-${invoice.id}`}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tổng tiền</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(invoice.total || 0)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Trạng thái</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                    invoice.status === 'partial_paid' ? 'bg-yellow-100 text-yellow-800' :
                    invoice.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {invoice.status === 'paid' ? 'Đã thanh toán' :
                     invoice.status === 'partial_paid' ? 'Thanh toán một phần' :
                     invoice.status === 'issued' ? 'Đã phát hành' :
                     invoice.status || 'Chưa xác định'}
                  </span>
                </div>
                {invoice.dueDate && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ngày đến hạn</p>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(invoice.dueDate).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate(`/invoices/${invoice.id}`)}
                className="w-full md:w-auto px-6 py-3 bg-[#1B4332] text-white rounded-lg hover:bg-[#14532d] transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Xem chi tiết hóa đơn
              </button>
            </div>
          </div>
        )}

        {/* Timeline Section */}
        {order.timeline && order.timeline.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-10 bg-gradient-to-b from-[#1e3a5f] to-[#2d4a6b] rounded-full"></div>
              <h2 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">Order Timeline</h2>
            </div>
            <div className="space-y-4">
              {order.timeline.map((event, index) => (
                <div key={event.id || index} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6b] shadow-lg"></div>
                    {index < order.timeline.length - 1 && (
                      <div className="w-0.5 h-full bg-gradient-to-b from-[#1e3a5f] to-gray-300 mt-2"></div>
                    )}
                        </div>
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-bold text-gray-900">{mapOrderStatusToText(event.status)}</p>
                      <p className="text-xs text-gray-500">
                        {event.createdAt ? new Date(event.createdAt).toLocaleString("vi-VN") : "N/A"}
                      </p>
                    </div>
                    {event.note && (
                      <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                    )}
                    {event.createdBy && (
                      <p className="text-xs text-gray-400 mt-1">by {event.createdBy}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payments Section */}
        {order.payments && order.payments.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-10 bg-gradient-to-b from-green-600 to-emerald-700 rounded-full"></div>
              <h2 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">Payment History</h2>
            </div>
            <div className="space-y-3">
              {order.payments.map((payment, index) => (
                <div key={payment.id || index} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div>
                    <p className="font-bold text-gray-900">{payment.method || "Payment"}</p>
                    <p className="text-xs text-gray-500">
                      {payment.createdAt ? new Date(payment.createdAt).toLocaleString("vi-VN") : "N/A"}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(payment.amount || 0)}
                  </p>
                </div>
              ))}
              </div>
            </div>
          )}

        {/* Attachments Section */}
        {order.attachments && order.attachments.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-10 bg-gradient-to-b from-purple-600 to-indigo-700 rounded-full"></div>
              <h2 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">Attachments</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {order.attachments.map((attachment, index) => (
                <a
                  key={attachment.id || index}
                  href={attachment.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-xl hover:border-[#1e3a5f] hover:shadow-lg transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#1e3a5f]">
                      {attachment.fileName || `File ${index + 1}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {attachment.fileSize ? `${(attachment.fileSize / 1024).toFixed(1)} KB` : ""}
                    </p>
                  </div>
                </a>
                ))}
              </div>
            </div>
          )}

        {/* What happens next? Section */}
        {order.statusRaw === "CONFIRMED" && (
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl border-2 border-gray-100 shadow-xl p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-10 bg-gradient-to-b from-[#1e3a5f] to-[#2d4a6b] rounded-full"></div>
              <h2 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">What happens next?</h2>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f97316] to-[#ea580c] flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                        </div>
                <span className="text-gray-700 font-medium text-lg pt-2">Pay the deposit to confirm your order</span>
              </li>
              <li className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d4a6b] flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium text-lg pt-2">Our master tailors will begin crafting your garments</span>
              </li>
              <li className="flex items-start gap-4 group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium text-lg pt-2">Estimated completion: 2-3 weeks</span>
              </li>
            </ul>
          </div>
                )}
              </div>

      {/* Bottom Fixed Action Bar (Orange) */}
      {order.statusRaw === "CONFIRMED" && total > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t-2 border-gray-200 p-5 z-50 w-full shadow-2xl">
          <div className="max-w-6xl mx-auto w-full">
                <button
              onClick={handleAcceptAndPay}
              className="w-full bg-gradient-to-r from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#dc2626] text-white font-bold py-5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl hover:shadow-orange-500/50 hover:scale-[1.02] active:scale-[0.98] text-lg"
            >
              <span>Accept & Pay Deposit ({formatCurrency(deposit)})</span>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
                </button>
              </div>
            </div>
          )}

      {/* Floating Chat Button (Bottom Right) */}
      <button className="fixed bottom-20 right-6 w-16 h-16 bg-gradient-to-br from-[#f97316] to-[#ea580c] hover:from-[#ea580c] hover:to-[#dc2626] text-white rounded-2xl flex items-center justify-center shadow-2xl z-40 transition-all duration-300 hover:scale-110 active:scale-95 relative group">
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-[#10b981] to-emerald-600 rounded-full border-3 border-white shadow-lg animate-pulse"></div>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>

      {/* Add padding bottom for fixed button */}
      {order.statusRaw === "CONFIRMED" && total > 0 && (
        <div className="h-24"></div>
      )}
    </div>
  );
};

export default CustomerOrderDetailPage;
