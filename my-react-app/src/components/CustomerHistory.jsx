import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getCustomerMeasurements, getLatestMeasurements } from "../utils/customerMeasurementsStorage";
import { getOrders } from "../utils/orderStorage";
import { getCurrentUser } from "../utils/authStorage";

const CustomerHistory = ({ customerId }) => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("measurements"); // measurements | products | recommendations
  const [measurements, setMeasurements] = useState([]);
  const [purchasedProducts, setPurchasedProducts] = useState([]);
  const user = getCurrentUser();
  
  const currentCustomerId = customerId || user?.username || user?.phone;

  useEffect(() => {
    try {
      if (currentCustomerId) {
        // Load measurements
        const customerMeasurements = getCustomerMeasurements(currentCustomerId);
        setMeasurements(customerMeasurements || []);

        // Load purchased products from orders
        const allOrders = getOrders() || [];
        const currentUser = getCurrentUser(); // Get fresh user data
        const customerOrders = allOrders.filter(
          (order) =>
            order && (
              order.phone === currentUser?.phone ||
              order.name === currentUser?.name ||
              order.customerId === currentCustomerId ||
              order.email === currentUser?.email
            )
        );
        
      // Extract products from orders
      // Bao gồm cả đơn hàng may đo (status = "Hoàn thành") và đơn hàng vải (isFabricOrder = true)
      const products = customerOrders
        .filter(order => {
          if (!order) return false;
          // Đơn hàng may đo: chỉ hiển thị khi "Hoàn thành"
          if (!order.isFabricOrder && order.status === "Hoàn thành") return true;
          // Đơn hàng vải: hiển thị tất cả (vì đã thanh toán)
          if (order.isFabricOrder === true) return true;
          return false;
        })
        .map(order => {
          // Lấy hình ảnh từ đơn hàng vải (nếu có items)
          let productImage = null;
          try {
            // Ưu tiên 1: sampleImages (cho đơn may đo)
            if (order.sampleImages && Array.isArray(order.sampleImages) && order.sampleImages.length > 0) {
              const img = order.sampleImages[0];
              if (img && typeof img === 'string' && img.trim() !== '') {
                productImage = img;
              }
            } 
            // Ưu tiên 2: items từ đơn hàng vải
            else if (order.isFabricOrder) {
              if (order.items && Array.isArray(order.items) && order.items.length > 0) {
                // Lấy hình ảnh từ item đầu tiên
                const firstItem = order.items[0];
                if (firstItem && firstItem.image && typeof firstItem.image === 'string' && firstItem.image.trim() !== '') {
                  productImage = firstItem.image;
                }
              }
            }
          } catch (error) {
            console.error("Error getting product image for order:", order.id, error);
            productImage = null;
          }
          
          return {
            id: order.id || `order-${Date.now()}`,
            name: order.styleName || order.style || order.productName || (order.isFabricOrder ? "Đơn mua vải" : "Sản phẩm may đo"),
            date: order.receive || order.createdAt || new Date().toISOString(),
            price: order.total || order.budget || 0,
            measurements: order.measurements || {},
            status: order.isFabricOrder ? "Hoàn thành" : (order.status || "Hoàn thành"), // Đơn vải coi như đã hoàn thành
            category: order.productType || order.style || (order.isFabricOrder ? "Vải" : "—"),
            image: productImage,
            isFabricOrder: order.isFabricOrder || false,
          };
        })
        .sort((a, b) => {
          // Sắp xếp theo ngày mới nhất trước
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB - dateA;
        });
        
        setPurchasedProducts(products);
      } else {
        // Reset if no customer ID
        setMeasurements([]);
        setPurchasedProducts([]);
      }
    } catch (error) {
      console.error("Error loading customer history:", error);
      setMeasurements([]);
      setPurchasedProducts([]);
    }
  }, [currentCustomerId]); // Chỉ depend on currentCustomerId, không depend on user object

  // Get latest measurements first
  const latestMeasurements = useMemo(() => {
    try {
      if (!measurements || measurements.length === 0) return null;
      const sorted = [...measurements].sort((a, b) => {
        if (!a.savedAt || !b.savedAt) return 0;
        return new Date(b.savedAt) - new Date(a.savedAt);
      });
      return sorted[0];
    } catch (error) {
      console.error("Error getting latest measurements:", error);
      return null;
    }
  }, [measurements]);

  // Get recommendations based on history - THÔNG MINH HƠN
  const recommendations = useMemo(() => {
    try {
      const recs = [];
      
      // 1. PHÂN TÍCH SẢN PHẨM ĐÃ MUA
      const productTypes = (purchasedProducts || []).map(p => {
        if (!p || !p.name) return "khác";
        const name = p.name.toLowerCase();
        if (name.includes("áo dài") || name.includes("ao dai") || name.includes("aodai")) return "áo dài";
        if (name.includes("vest") || name.includes("áo vest")) return "vest";
        if (name.includes("đầm") || name.includes("dam") || name.includes("váy")) return "đầm";
        if (name.includes("quần") || name.includes("quan")) return "quần";
        if (name.includes("sơ mi") || name.includes("so mi")) return "sơ mi";
        if (name.includes("cưới") || name.includes("cuoi")) return "cưới";
        if (name.includes("công sở") || name.includes("cong so")) return "công sở";
        if (name.includes("dạ hội") || name.includes("da hoi")) return "dạ hội";
        return "khác";
      });

    // Đếm số lượng từng loại
    const typeCount = productTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // 2. PHÂN TÍCH SỐ ĐO ĐỂ GỢI Ý PHONG CÁCH
    let bodyType = null;
    if (latestMeasurements) {
      const chest = parseFloat(latestMeasurements.chest) || 0;
      const waist = parseFloat(latestMeasurements.waist) || 0;
      const hip = parseFloat(latestMeasurements.hip || latestMeasurements.hips) || 0;
      
      if (chest > 0 && waist > 0) {
        const ratio = chest / waist;
        if (ratio > 1.15) bodyType = "vai rộng";
        else if (ratio < 0.95) bodyType = "eo nhỏ";
      }
      
      if (hip > 0 && waist > 0) {
        const hipWaistRatio = hip / waist;
        if (hipWaistRatio > 1.3) bodyType = "quả lê";
        else if (hipWaistRatio < 1.1) bodyType = "thẳng";
      }
    }

    // 3. PHÂN TÍCH GIÁ TRỊ ĐƠN HÀNG
    const totalSpent = purchasedProducts.reduce((sum, p) => {
      const price = typeof p.price === "string" 
        ? parseFloat(p.price.replace(/[^\d]/g, "")) 
        : parseFloat(p.price) || 0;
      return sum + price;
    }, 0);
    const avgPrice = purchasedProducts.length > 0 ? totalSpent / purchasedProducts.length : 0;
    const priceRange = avgPrice > 3000000 ? "cao cấp" : avgPrice > 1500000 ? "trung bình" : "phổ thông";

    // 4. PHÂN TÍCH TẦN SUẤT MUA HÀNG
    const purchaseDates = purchasedProducts
      .map(p => new Date(p.date))
      .sort((a, b) => b - a);
    
    let purchaseFrequency = "thỉnh thoảng";
    if (purchaseDates.length >= 2) {
      const daysBetween = (purchaseDates[0] - purchaseDates[1]) / (1000 * 60 * 60 * 24);
      if (daysBetween < 90) purchaseFrequency = "thường xuyên";
      else if (daysBetween < 180) purchaseFrequency = "định kỳ";
    }

    // 5. PHÂN TÍCH DỊP (từ tên sản phẩm)
    const occasions = {
      wedding: typeCount["cưới"] > 0 || typeCount["áo dài"] > 0,
      office: typeCount["vest"] > 0 || typeCount["công sở"] > 0 || typeCount["sơ mi"] > 0,
      party: typeCount["dạ hội"] > 0 || typeCount["đầm"] > 0,
    };

    // 6. GỢI Ý DỰA TRÊN LỊCH SỬ MUA HÀNG
    if (purchasedProducts.length > 0) {
      // Gợi ý phối hợp (complementary items)
      if (typeCount["áo dài"] > 0) {
        recs.push({
          type: "complement",
          title: "✨ Phối hợp hoàn hảo với áo dài",
          items: [
            { 
              name: "Quần ống rộng may đo", 
              reason: "Tạo bộ áo dài truyền thống hoàn chỉnh",
              price: "Từ 800.000₫"
            },
            { 
              name: "Áo khoác ngoài", 
              reason: "Giữ ấm trong dịp lễ Tết, tiệc tối",
              price: "Từ 1.200.000₫"
            },
          ],
        });
      }

      if (typeCount["vest"] > 0 || typeCount["công sở"] > 0) {
        recs.push({
          type: "similar",
          title: "💼 Hoàn thiện tủ đồ công sở",
          items: [
            { 
              name: "Sơ mi may đo", 
              reason: "Phối với vest tạo bộ đồ công sở chuyên nghiệp",
              price: "Từ 1.000.000₫"
            },
            { 
              name: "Quần âu may đo", 
              reason: "Tạo bộ đồ công sở hoàn chỉnh, lịch sự",
              price: "Từ 1.200.000₫"
            },
          ],
        });
      }

      if (typeCount["đầm"] > 0 || typeCount["dạ hội"] > 0) {
        recs.push({
          type: "complement",
          title: "👗 Phụ kiện cho đầm dạ hội",
          items: [
            { 
              name: "Áo khoác nhẹ", 
              reason: "Che vai, tạo điểm nhấn cho đầm dạ hội",
              price: "Từ 1.500.000₫"
            },
            { 
              name: "Đầm dự tiệc khác", 
              reason: "Đa dạng tủ đồ cho các sự kiện",
              price: "Từ 2.500.000₫"
            },
          ],
        });
      }

      // Gợi ý dựa trên số đo (body type)
      if (bodyType === "vai rộng") {
        recs.push({
          type: "body-fit",
          title: "📐 Gợi ý phù hợp dáng người",
          items: [
            { 
              name: "Áo dài form suông", 
              reason: "Tôn dáng, che vai rộng hiệu quả",
              price: "Từ 2.500.000₫"
            },
            { 
              name: "Đầm cổ chữ V", 
              reason: "Tạo cảm giác vai nhỏ hơn",
              price: "Từ 2.800.000₫"
            },
          ],
        });
      } else if (bodyType === "eo nhỏ") {
        recs.push({
          type: "body-fit",
          title: "📐 Gợi ý phù hợp dáng người",
          items: [
            { 
              name: "Áo dài eo cao", 
              reason: "Tôn vòng eo nhỏ của bạn",
              price: "Từ 2.500.000₫"
            },
            { 
              name: "Đầm ôm eo", 
              reason: "Làm nổi bật vòng eo",
              price: "Từ 2.200.000₫"
            },
          ],
        });
      }

      // Gợi ý dựa trên mức giá
      if (priceRange === "cao cấp") {
        recs.push({
          type: "price-based",
          title: "💎 Sản phẩm cao cấp phù hợp",
          items: [
            { 
              name: "Áo dài lụa cao cấp", 
              reason: "Phù hợp với phong cách của bạn",
              price: "Từ 3.500.000₫"
            },
            { 
              name: "Vest dạ nhập khẩu", 
              reason: "Chất liệu cao cấp, bền đẹp",
              price: "Từ 4.000.000₫"
            },
          ],
        });
      }

      // Gợi ý dựa trên dịp
      if (occasions.wedding && !occasions.office) {
        recs.push({
          type: "occasion",
          title: "💒 Mở rộng tủ đồ cho dịp đặc biệt",
          items: [
            { 
              name: "Áo dài cưới khác màu", 
              reason: "Đa dạng cho các dịp lễ",
              price: "Từ 2.500.000₫"
            },
            { 
              name: "Đầm dự tiệc", 
              reason: "Cho các sự kiện khác",
              price: "Từ 2.800.000₫"
            },
          ],
        });
      }

      if (occasions.office && !occasions.wedding) {
        recs.push({
          type: "occasion",
          title: "💼 Bổ sung cho tủ đồ công sở",
          items: [
            { 
              name: "Áo dài công sở", 
              reason: "Thay đổi phong cách, vẫn lịch sự",
              price: "Từ 2.200.000₫"
            },
            { 
              name: "Vest màu khác", 
              reason: "Đa dạng màu sắc cho công sở",
              price: "Từ 1.800.000₫"
            },
          ],
        });
      }

      // Gợi ý dựa trên tần suất mua
      if (purchaseFrequency === "thường xuyên") {
        recs.push({
          type: "loyalty",
          title: "🎁 Ưu đãi cho khách hàng thân thiết",
          items: [
            { 
              name: "Bất kỳ sản phẩm nào", 
              reason: "Bạn được giảm 10% cho đơn hàng tiếp theo",
              price: "Giảm 10%"
            },
          ],
        });
      }
    }

    // 7. GỢI Ý THEO MÙA
    const currentMonth = new Date().getMonth() + 1;
    if (currentMonth >= 10 || currentMonth <= 2) {
      recs.push({
        type: "seasonal",
        title: "❄️ Xu hướng mùa đông 2025",
        items: [
          { 
            name: "Áo khoác len may đo", 
            reason: "Giữ ấm, thanh lịch, vừa vặn",
            price: "Từ 2.500.000₫"
          },
          { 
            name: "Vest dạ", 
            reason: "Phù hợp thời tiết lạnh, sang trọng",
            price: "Từ 3.200.000₫"
          },
        ],
      });
    } else if (currentMonth >= 3 && currentMonth <= 5) {
      recs.push({
        type: "seasonal",
        title: "🌸 Xu hướng mùa xuân 2025",
        items: [
          { 
            name: "Áo dài lụa mỏng", 
            reason: "Thoáng mát, nhẹ nhàng, màu sắc tươi",
            price: "Từ 2.500.000₫"
          },
          { 
            name: "Đầm suông", 
            reason: "Dễ mặc, dễ phối, phù hợp thời tiết",
            price: "Từ 2.200.000₫"
          },
        ],
      });
    } else {
      recs.push({
        type: "seasonal",
        title: "☀️ Xu hướng mùa hè 2025",
        items: [
          { 
            name: "Áo dài lụa mỏng", 
            reason: "Thoáng mát, nhẹ nhàng",
            price: "Từ 2.500.000₫"
          },
          { 
            name: "Đầm suông", 
            reason: "Dễ mặc, dễ phối",
            price: "Từ 2.200.000₫"
          },
        ],
      });
    }

    // 8. GỢI Ý CHO KHÁCH HÀNG MỚI
    if (purchasedProducts.length === 0) {
      recs.push({
        type: "first-time",
        title: "🎯 Bắt đầu với những món cơ bản",
        items: [
          { 
            name: "Áo dài cưới", 
            reason: "Phù hợp nhiều dịp quan trọng: cưới hỏi, lễ Tết",
            price: "Từ 2.500.000₫"
          },
          { 
            name: "Vest công sở", 
            reason: "Sử dụng hàng ngày, lịch sự, chuyên nghiệp",
            price: "Từ 1.800.000₫"
          },
          { 
            name: "Đầm dạ hội", 
            reason: "Cho các sự kiện đặc biệt, tiệc tối",
            price: "Từ 3.200.000₫"
          },
        ],
      });
    }

      return recs;
    } catch (error) {
      console.error("Error generating recommendations:", error);
      return [];
    }
  }, [purchasedProducts, latestMeasurements]);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-4">
        <TabButton
          active={activeSection === "measurements"}
          onClick={() => setActiveSection("measurements")}
        >
          📏 Số đo lưu trữ
        </TabButton>
        <TabButton
          active={activeSection === "products"}
          onClick={() => setActiveSection("products")}
        >
          🛍️ Sản phẩm đã mua
        </TabButton>
        <TabButton
          active={activeSection === "recommendations"}
          onClick={() => setActiveSection("recommendations")}
        >
          💡 Gợi ý cho bạn
        </TabButton>
      </div>

      {/* Content */}
      {activeSection === "measurements" && (
        <MeasurementsSection measurements={measurements} latestMeasurements={latestMeasurements} />
      )}

      {activeSection === "products" && (
        <ProductsSection products={purchasedProducts} navigate={navigate} />
      )}

      {activeSection === "recommendations" && (
        <RecommendationsSection recommendations={recommendations || []} navigate={navigate} />
      )}
    </div>
  );
};

// Tab Button Component
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-[#1B4332] text-white shadow-sm"
          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

// Measurements Section
function MeasurementsSection({ measurements, latestMeasurements }) {
  if (measurements.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
        <svg
          className="w-16 h-16 mx-auto text-slate-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-slate-500 mb-2">Chưa có số đo được lưu trữ</p>
        <p className="text-sm text-slate-400">
          Số đo của bạn sẽ được lưu tự động sau mỗi lần đặt may
        </p>
      </div>
    );
  }

  const measurementFields = [
    { key: "chest", label: "Vòng ngực (cm)", icon: "👕", altKeys: ["vongNguc"] },
    { key: "waist", label: "Vòng eo (cm)", icon: "📐", altKeys: ["vongEo"] },
    { key: "hip", label: "Vòng mông (cm)", icon: "👖", altKeys: ["hips", "vongMong"] },
    { key: "shoulder", label: "Ngang vai (cm)", icon: "👔", altKeys: ["ngangVai"] },
    { key: "sleeveLength", label: "Dài tay (cm)", icon: "👗", altKeys: ["sleeve", "daiTay"] },
    { key: "shirtLength", label: "Dài áo (cm)", icon: "👚", altKeys: ["daiAo"] },
    { key: "pantsLength", label: "Dài quần (cm)", icon: "👖", altKeys: ["daiQuan"] },
    { key: "neck", label: "Vòng cổ (cm)", icon: "👔", altKeys: ["vongCo"] },
    { key: "height", label: "Chiều cao (cm)", icon: "📏", altKeys: [] },
    { key: "weight", label: "Cân nặng (kg)", icon: "⚖️", altKeys: [] },
    { key: "waistband", label: "Vòng bụng (cm)", icon: "📐", altKeys: [] },
    { key: "inseam", label: "Dài trong (cm)", icon: "👖", altKeys: [] },
    { key: "thigh", label: "Vòng đùi (cm)", icon: "👖", altKeys: [] },
  ];

  // Helper function to get measurement value
  const getMeasurementValue = (measurement, field) => {
    if (measurement[field.key]) return measurement[field.key];
    // Try alternative keys
    if (field.altKeys) {
      for (const altKey of field.altKeys) {
        if (measurement[altKey]) return measurement[altKey];
      }
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Latest Measurements Highlight */}
      {latestMeasurements && (
        <div className="bg-gradient-to-br from-[#1B4332] to-[#14532d] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Số đo mới nhất</h3>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">
              {new Date(latestMeasurements.savedAt).toLocaleDateString("vi-VN")}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {measurementFields
              .filter(field => {
                const value = getMeasurementValue(latestMeasurements, field);
                return value && value !== "" && value !== "0";
              })
              .slice(0, 4)
              .map((field) => {
                const value = getMeasurementValue(latestMeasurements, field);
                const unit = field.key === "weight" ? " kg" : field.key === "height" ? " cm" : " cm";
                return (
                  <div key={field.key} className="bg-white/10 rounded-lg p-3">
                    <p className="text-xs text-white/80 mb-1">{field.label}</p>
                    <p className="text-xl font-bold">{value}{unit}</p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* All Measurements History */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Lịch sử số đo</h3>
        <div className="space-y-4">
          {measurements
            .sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
            .map((measurement) => (
              <div
                key={measurement.id}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-slate-900">
                      {new Date(measurement.savedAt).toLocaleDateString("vi-VN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    {measurement.orderId && (
                      <p className="text-xs text-slate-500 mt-1">
                        Đơn hàng: {measurement.orderId}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {measurementFields
                    .filter((field) => {
                      const value = getMeasurementValue(measurement, field);
                      return value && value !== "" && value !== "0";
                    })
                    .map((field) => {
                      const value = getMeasurementValue(measurement, field);
                      const unit = field.key === "weight" ? " kg" : field.key === "height" ? " cm" : " cm";
                      return (
                        <div key={field.key} className="flex items-center gap-2">
                          <span className="text-lg">{field.icon}</span>
                          <div>
                            <p className="text-xs text-slate-500">{field.label}</p>
                            <p className="text-sm font-semibold text-slate-900">
                              {value}{unit}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

// Products Section - Shopee Style với sub-tabs
function ProductsSection({ products, navigate }) {
  const [productType, setProductType] = useState("tailoring"); // "tailoring" | "fabric"
  
  // Tách sản phẩm thành 2 loại
  const tailoringProducts = products.filter(p => !p.isFabricOrder);
  const fabricProducts = products.filter(p => p.isFabricOrder === true);
  
  const currentProducts = productType === "tailoring" ? tailoringProducts : fabricProducts;

  const formatCurrency = (amount) => {
    if (!amount) return "0 đ";
    if (typeof amount === "string" && amount.includes("đ")) return amount;
    return `${Number(amount).toLocaleString("vi-VN")} đ`;
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setProductType("tailoring")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            productType === "tailoring"
              ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Đơn đã đặt may ({tailoringProducts.length})
        </button>
        <button
          onClick={() => setProductType("fabric")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            productType === "fabric"
              ? "bg-gradient-to-r from-indigo-500 to-slate-500 text-white shadow-md"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Mua vải thành công ({fabricProducts.length})
        </button>
      </div>

      {/* Empty State */}
      {currentProducts.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          <p className="text-gray-500 mb-2">
            {productType === "tailoring" 
              ? "Chưa có đơn đặt may nào" 
              : "Chưa có đơn mua vải nào"}
          </p>
          <p className="text-sm text-gray-400 mb-4">
            {productType === "tailoring"
              ? "Các đơn hàng may đo đã hoàn thành sẽ xuất hiện tại đây"
              : "Các đơn hàng mua vải đã thanh toán sẽ xuất hiện tại đây"}
          </p>
          <button
            onClick={() => navigate(productType === "tailoring" ? "/customer/order" : "/fabrics")}
            className="px-4 py-2 bg-[#1B4332] text-white rounded text-sm font-medium hover:bg-[#14532d] transition-colors"
          >
            {productType === "tailoring" ? "Đặt may ngay" : "Mua vải ngay"}
          </button>
        </div>
      )}

      {/* Products List */}
      {currentProducts.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              Tổng cộng {currentProducts.length} {productType === "tailoring" ? "đơn đặt may" : "đơn mua vải"}
            </h3>
          </div>
          
          {currentProducts.map((product) => (
        <div
          key={product.id}
          className={`bg-white rounded-lg shadow-sm border-2 overflow-hidden hover:shadow-lg transition-all ${
            product.isFabricOrder
              ? "border-indigo-200 hover:border-indigo-300"
              : "border-teal-200 hover:border-teal-300"
          }`}
        >
          {/* Shop Header - Shopee Style với màu chuyên nghiệp */}
          <div className={`px-4 py-3 border-b ${
            product.isFabricOrder 
              ? "bg-gradient-to-r from-indigo-50 to-slate-50 border-indigo-200" 
              : "bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button className="px-2 py-1 bg-red-500 text-white text-xs rounded font-medium">
                  Yêu thích+
                </button>
                <span className="font-medium text-gray-900">My Hiền Fashion Design Studio</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 bg-orange-500 text-white text-xs rounded flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Chat
                </button>
                <button className="px-3 py-1 border border-gray-300 text-gray-700 text-xs rounded flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Xem Shop
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Status - Shopee Style */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="text-sm font-medium text-green-600">Giao hàng thành công</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-semibold rounded">
              HOÀN THÀNH
            </span>
          </div>

          {/* Product Info - Shopee Style với màu chuyên nghiệp */}
          <div className={`p-4 ${
            product.isFabricOrder 
              ? "bg-gradient-to-br from-indigo-50/40 to-slate-50/40" 
              : "bg-gradient-to-br from-teal-50/40 to-cyan-50/40"
          }`}>
            <div className="flex gap-4">
              {/* Product Image với border màu chuyên nghiệp */}
              <div 
                className={`w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg border-2 overflow-hidden cursor-pointer relative shadow-md hover:shadow-lg transition-all duration-300 ${
                  product.isFabricOrder 
                    ? "border-indigo-300 bg-gradient-to-br from-indigo-100 to-slate-100 hover:border-indigo-400" 
                    : "border-teal-300 bg-gradient-to-br from-teal-100 to-cyan-100 hover:border-teal-400"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/customer/orders/${product.id}`);
                }}
              >
                {product.image && product.image.trim() !== "" ? (
                  <>
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Nếu hình ảnh lỗi, ẩn img và hiển thị placeholder
                        const imgElement = e.target;
                        const placeholder = imgElement.nextElementSibling;
                        if (imgElement) imgElement.style.display = 'none';
                        if (placeholder) placeholder.style.display = 'flex';
                      }}
                      onLoad={(e) => {
                        // Đảm bảo placeholder bị ẩn khi hình ảnh load thành công
                        const placeholder = e.target.nextElementSibling;
                        if (placeholder) placeholder.style.display = 'none';
                      }}
                    />
                    <div 
                      className="w-full h-full flex items-center justify-center text-gray-400 absolute inset-0 hidden"
                      style={{ display: 'none' }}
                    >
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h4 
                  className="font-medium text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:text-[#1B4332]"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    navigate(`/customer/orders/${product.id}`);
                  }}
                >
                  {product.name}
                </h4>
                {product.category && (
                  <p className="text-xs text-gray-600 mb-1">
                    <span className="text-gray-500">Phân loại hàng:</span> {product.category}
                  </p>
                )}
                <p className="text-xs text-gray-600 mb-2">x1</p>
                
                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-red-600">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 my-4"></div>

            {/* Review Section & Total - Shopee Style */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">
                  Đánh giá sản phẩm trước {new Date(new Date(product.date).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("vi-VN")}
                </p>
                <p className="text-xs text-orange-500 mt-1">
                  Đánh giá ngay và nhận 200 Xu
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 mb-1">Thành tiền:</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrency(product.price)}
                </p>
              </div>
            </div>

            {/* Action Buttons - Shopee Style */}
            <div className="flex gap-2 mt-4">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (product.id) {
                    navigate(`/customer/orders/${product.id}/review`, { 
                      state: { product } 
                    });
                  } else {
                    console.error("Product ID is missing:", product);
                    alert("Không tìm thấy mã đơn hàng. Vui lòng thử lại.");
                  }
                }}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors text-sm font-medium"
              >
                Đánh Giá
              </button>
              <button 
                onClick={() => {
                  // Trigger chat widget if available
                  const chatButton = document.querySelector('[aria-label="Mở chat"]');
                  if (chatButton) {
                    chatButton.click();
                  } else {
                    alert("Vui lòng sử dụng chat widget ở góc dưới màn hình");
                  }
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Liên Hệ Người Bán
              </button>
              <button 
                onClick={() => navigate("/customer/order")}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Mua Lại
              </button>
            </div>
          </div>
        </div>
          ))}
        </>
      )}
    </div>
  );
}

// Recommendations Section
function RecommendationsSection({ recommendations, navigate }) {
  if (recommendations.length === 0) {
    return (
      <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
        <svg
          className="w-16 h-16 mx-auto text-slate-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <p className="text-slate-500 mb-2">Chưa có gợi ý nào</p>
        <p className="text-sm text-slate-400">
          Hệ thống sẽ phân tích và đưa ra gợi ý dựa trên lịch sử mua hàng của bạn
        </p>
      </div>
    );
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "complement":
        return "from-blue-50 to-indigo-50 border-blue-200";
      case "similar":
        return "from-purple-50 to-pink-50 border-purple-200";
      case "seasonal":
        return "from-amber-50 to-orange-50 border-amber-200";
      case "body-fit":
        return "from-emerald-50 to-teal-50 border-emerald-200";
      case "price-based":
        return "from-yellow-50 to-amber-50 border-yellow-200";
      case "occasion":
        return "from-rose-50 to-pink-50 border-rose-200";
      case "loyalty":
        return "from-violet-50 to-purple-50 border-violet-200";
      case "first-time":
        return "from-cyan-50 to-blue-50 border-cyan-200";
      default:
        return "from-amber-50 to-rose-50 border-amber-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">💡 Gợi ý thông minh dựa trên:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Lịch sử sản phẩm đã mua</li>
              <li>Số đo và dáng người của bạn</li>
              <li>Mức giá bạn thường chọn</li>
              <li>Dịp sử dụng (cưới hỏi, công sở, dạ hội)</li>
              <li>Xu hướng theo mùa</li>
              <li>Tần suất mua hàng</li>
            </ul>
          </div>
        </div>
      </div>

      {recommendations.map((rec, index) => (
        <div
          key={index}
          className={`bg-gradient-to-br ${getTypeColor(rec.type)} rounded-2xl border p-6`}
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">{rec.title}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            {rec.items.map((item, itemIndex) => (
              <div
                key={itemIndex}
                className="bg-white rounded-xl p-4 border border-white/50 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900 mb-1">{item.name}</h4>
                    <p className="text-sm text-slate-600 mb-2">{item.reason}</p>
                    {item.price && (
                      <p className="text-xs font-semibold text-[#1B4332] bg-[#1B4332]/10 px-2 py-1 rounded-full inline-block">
                        {item.price}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate("/customer/order")}
                  className="w-full px-4 py-2 bg-[#1B4332] text-white rounded-full text-sm font-medium hover:bg-[#14532d] transition-colors"
                >
                  Đặt may ngay
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CustomerHistory;

