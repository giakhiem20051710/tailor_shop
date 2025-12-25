import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Header from "../components/Header.jsx";
import usePageMeta from "../hooks/usePageMeta";
import { productConfigurationService, imageAssetService } from "../services/index.js";
import OptimizedImage from "../components/OptimizedImage.jsx";

/**
 * Trang Customize Product - Mix & Match
 * Cho phép khách hàng chọn template → chọn vải → chọn kiểu → preview
 */
const CustomizeProductPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateIdFromUrl = searchParams.get("templateId");

  usePageMeta({
    title: "Tùy chỉnh sản phẩm - Mix & Match",
    description: "Chọn vải và kiểu dáng để tạo sản phẩm độc đáo của riêng bạn",
  });

  // State
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [fabrics, setFabrics] = useState([]);
  const [styles, setStyles] = useState([]);
  const [selectedFabric, setSelectedFabric] = useState(null);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [calculatedPrice, setCalculatedPrice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  // Load templates
  useEffect(() => {
    loadTemplates();
  }, []);

  // Load template images from image assets (optional enhancement)
  useEffect(() => {
    if (templates.length > 0) {
      loadTemplateImages();
    }
  }, [templates]);

  // Load template from URL
  useEffect(() => {
    if (templateIdFromUrl && templates.length > 0) {
      const template = templates.find((t) => t.id === parseInt(templateIdFromUrl));
      if (template) {
        handleTemplateSelect(template);
      }
    }
  }, [templateIdFromUrl, templates]);

  // Load fabrics and styles when template is selected
  useEffect(() => {
    if (selectedTemplate) {
      loadFabrics();
      loadStyles();
    }
  }, [selectedTemplate]);

  // Calculate price when selections change
  useEffect(() => {
    if (selectedTemplate && selectedFabric) {
      calculatePrice();
    }
  }, [selectedTemplate, selectedFabric, selectedStyle]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await productConfigurationService.getTemplates();
      console.log("Templates response:", response);
      
      // Cấu trúc response từ backend: { requestTrace, responseDateTime, responseStatus, responseData }
      // responseData chứa List<ProductTemplateResponse>
      let templatesData = null;
      
      // Kiểm tra nhiều cấu trúc response có thể có
      if (response?.responseData) {
        // Cấu trúc đúng: response.responseData
        templatesData = Array.isArray(response.responseData) ? response.responseData : null;
      } else if (response?.data?.responseData) {
        // Nếu httpClient wrap thêm một lớp
        templatesData = Array.isArray(response.data.responseData) ? response.data.responseData : null;
      } else if (response?.data?.data) {
        // Fallback cho các API khác
        templatesData = Array.isArray(response.data.data) ? response.data.data : null;
      } else if (Array.isArray(response?.data)) {
        // Nếu response.data là array trực tiếp
        templatesData = response.data;
      } else if (Array.isArray(response)) {
        // Nếu response là array trực tiếp
        templatesData = response;
      }
      
      console.log("Parsed templatesData:", templatesData);
      
      if (templatesData && Array.isArray(templatesData) && templatesData.length > 0) {
        setTemplates(templatesData);
        console.log(`✅ Loaded ${templatesData.length} templates`);
      } else {
        setError("Chưa có mẫu sản phẩm nào. Vui lòng liên hệ quản trị viên để thêm dữ liệu.");
        console.warn("No templates found in response. Full response:", response);
      }
    } catch (err) {
      console.error("Error loading templates:", err);
      const errorMessage = err?.response?.data?.message || err?.message || "Không thể tải danh sách mẫu sản phẩm";
      setError(`Lỗi: ${errorMessage}. Vui lòng kiểm tra kết nối hoặc liên hệ hỗ trợ.`);
    } finally {
      setLoading(false);
    }
  };

  const loadFabrics = async () => {
    if (!selectedTemplate) return;
    try {
      const response = await productConfigurationService.getFabricsByTemplate(
        selectedTemplate.id,
        { page: 0, size: 50 }
      );
      console.log("Fabrics response:", response);
      
      // Cấu trúc response: { responseData: { content: [...], totalElements, ... } }
      let fabricsData = null;
      if (response?.responseData?.content) {
        fabricsData = response.responseData.content;
      } else if (response?.data?.responseData?.content) {
        fabricsData = response.data.responseData.content;
      } else if (response?.data?.data?.content) {
        fabricsData = response.data.data.content;
      } else if (Array.isArray(response?.responseData)) {
        fabricsData = response.responseData;
      } else if (Array.isArray(response?.data)) {
        fabricsData = response.data;
      }
      
      if (fabricsData && Array.isArray(fabricsData) && fabricsData.length > 0) {
        setFabrics(fabricsData);
        console.log(`✅ Loaded ${fabricsData.length} fabrics`);
      }
    } catch (err) {
      console.error("Error loading fabrics:", err);
    }
  };

  const loadStyles = async () => {
    if (!selectedTemplate) return;
    try {
      const response = await productConfigurationService.getStylesByTemplate(
        selectedTemplate.id,
        { page: 0, size: 50 }
      );
      console.log("Styles response:", response);
      
      // Cấu trúc response: { responseData: { content: [...], totalElements, ... } }
      let stylesData = null;
      if (response?.responseData?.content) {
        stylesData = response.responseData.content;
      } else if (response?.data?.responseData?.content) {
        stylesData = response.data.responseData.content;
      } else if (response?.data?.data?.content) {
        stylesData = response.data.data.content;
      } else if (Array.isArray(response?.responseData)) {
        stylesData = response.responseData;
      } else if (Array.isArray(response?.data)) {
        stylesData = response.data;
      }
      
      if (stylesData && Array.isArray(stylesData) && stylesData.length > 0) {
        setStyles(stylesData);
        console.log(`✅ Loaded ${stylesData.length} styles`);
      }
    } catch (err) {
      console.error("Error loading styles:", err);
    }
  };

  const calculatePrice = async () => {
    if (!selectedTemplate || !selectedFabric) return;
    try {
      const response = await productConfigurationService.calculatePrice(
        selectedTemplate.id,
        selectedFabric.id,
        selectedStyle?.id || null
      );
      console.log("Price response:", response);
      
      // Cấu trúc response: { responseData: BigDecimal }
      let price = null;
      if (response?.responseData !== undefined && response?.responseData !== null) {
        price = response.responseData;
      } else if (response?.data?.responseData !== undefined && response?.data?.responseData !== null) {
        price = response.data.responseData;
      } else if (response?.data?.data !== undefined && response?.data?.data !== null) {
        price = response.data.data;
      } else if (typeof response?.data === 'number') {
        price = response.data;
      }
      
      if (price !== null && price !== undefined) {
        setCalculatedPrice(price);
        console.log(`✅ Calculated price: ${price}`);
      }
    } catch (err) {
      console.error("Error calculating price:", err);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setSelectedFabric(null);
    setSelectedStyle(null);
    setFabrics([]);
    setStyles([]);
  };

  const handleFabricSelect = (fabric) => {
    setSelectedFabric(fabric);
  };

  const handleStyleSelect = (style) => {
    setSelectedStyle(style);
  };

  const handleCreateConfiguration = async () => {
    if (!selectedTemplate || !selectedFabric) {
      setError("Vui lòng chọn mẫu sản phẩm và vải");
      return;
    }

    try {
      setCreating(true);
      setError(null);
      const response = await productConfigurationService.create({
        templateId: selectedTemplate.id,
        fabricId: selectedFabric.id,
        styleId: selectedStyle?.id || null,
      });

      console.log("Create configuration response:", response);
      
      // Cấu trúc response: { responseData: ProductConfigurationResponse }
      const configData = response?.responseData || response?.data?.responseData || response?.data?.data || response?.data;
      
      if (configData?.id) {
        // Navigate to product detail or show success
        const configId = configData.id;
        navigate(`/product-configuration/${configId}`);
      } else {
        setError("Tạo sản phẩm thành công nhưng không nhận được ID. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Error creating configuration:", err);
      setError(
        err?.response?.data?.message || "Không thể tạo cấu hình sản phẩm"
      );
    } finally {
      setCreating(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return "0";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tùy chỉnh sản phẩm
              </h1>
              <p className="text-gray-600">
                Chọn mẫu, vải và kiểu dáng để tạo sản phẩm độc đáo của riêng bạn
              </p>
            </div>
            <a
              href="#huong-dan"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              onClick={(e) => {
                e.preventDefault();
                alert(
                  "HƯỚNG DẪN NHANH:\n\n" +
                  "1️⃣ Chọn mẫu sản phẩm (Áo sơ mi, Quần tây...)\n" +
                  "2️⃣ Chọn vải (màu sắc, chất liệu...)\n" +
                  "3️⃣ (Tùy chọn) Chọn kiểu dáng\n" +
                  "4️⃣ Xem Preview và giá\n" +
                  "5️⃣ Click 'Tạo sản phẩm'\n\n" +
                  "Xem file HUONG_DAN_SU_DUNG_MIX_MATCH.md để biết chi tiết!"
                );
              }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Hướng dẫn
            </a>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <div className={`flex items-center gap-2 ${selectedTemplate ? 'text-blue-600 font-medium' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${selectedTemplate ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {selectedTemplate ? '✓' : '1'}
              </div>
              <span>Chọn mẫu</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${selectedFabric ? 'text-blue-600 font-medium' : ''}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${selectedFabric ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {selectedFabric ? '✓' : '2'}
              </div>
              <span>Chọn vải</span>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className={`flex items-center gap-2 ${selectedStyle ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${selectedStyle ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {selectedStyle ? '✓' : '3'}
              </div>
              <span>Chọn kiểu</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Select Template */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Bước 1: Chọn mẫu sản phẩm
              </h2>
              {loading ? (
                <div className="text-center py-8 text-gray-500">
                  Đang tải...
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template)}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        selectedTemplate?.id === template.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {template.baseImage && (
                        <OptimizedImage
                          src={template.baseImage}
                          alt={template.name}
                          className="w-full h-32 object-cover rounded mb-2"
                        />
                      )}
                      <h3 className="font-medium text-sm">{template.name}</h3>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Select Fabric */}
            {selectedTemplate && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Bước 2: Chọn vải
                </h2>
                {fabrics.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Đang tải danh sách vải...
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {fabrics.map((fabric) => (
                      <button
                        key={fabric.id}
                        onClick={() => handleFabricSelect(fabric)}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          selectedFabric?.id === fabric.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {fabric.image && (
                          <OptimizedImage
                            src={fabric.image}
                            alt={fabric.name}
                            className="w-full h-24 object-cover rounded mb-2"
                          />
                        )}
                        <h3 className="font-medium text-xs mb-1">
                          {fabric.name}
                        </h3>
                        {fabric.color && (
                          <p className="text-xs text-gray-500">{fabric.color}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Select Style (Optional) */}
            {selectedTemplate && styles.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">
                  Bước 3: Chọn kiểu dáng (Tùy chọn)
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => setSelectedStyle(null)}
                    className={`p-3 border-2 rounded-lg transition-all ${
                      selectedStyle === null
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <p className="font-medium text-sm">Không chọn</p>
                    </div>
                  </button>
                  {styles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleStyleSelect(style)}
                      className={`p-3 border-2 rounded-lg transition-all ${
                        selectedStyle?.id === style.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {style.image && (
                        <OptimizedImage
                          src={style.image}
                          alt={style.name}
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                      )}
                      <h3 className="font-medium text-xs">{style.name}</h3>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-semibold mb-4">Xem trước</h2>

              {/* Preview Image */}
              <div className="mb-4 bg-gray-100 rounded-lg p-4 min-h-[300px] flex items-center justify-center">
                {selectedTemplate && selectedFabric ? (
                  <div className="text-center">
                    {selectedTemplate.baseImage && (
                      <OptimizedImage
                        src={selectedTemplate.baseImage}
                        alt={selectedTemplate.name}
                        className="w-full h-64 object-contain rounded mb-2"
                      />
                    )}
                    <p className="text-sm text-gray-600 mt-2">
                      {selectedTemplate.name}
                    </p>
                    {selectedFabric.image && (
                      <div className="mt-4">
                        <p className="text-xs text-gray-500 mb-2">Vải đã chọn:</p>
                        <OptimizedImage
                          src={selectedFabric.image}
                          alt={selectedFabric.name}
                          className="w-full h-20 object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400">Chọn mẫu và vải để xem trước</p>
                )}
              </div>

              {/* Configuration Summary */}
              <div className="space-y-3 mb-4">
                {selectedTemplate && (
                  <div>
                    <p className="text-sm text-gray-600">Mẫu:</p>
                    <p className="font-medium">{selectedTemplate.name}</p>
                  </div>
                )}
                {selectedFabric && (
                  <div>
                    <p className="text-sm text-gray-600">Vải:</p>
                    <p className="font-medium">{selectedFabric.name}</p>
                    {selectedFabric.color && (
                      <p className="text-xs text-gray-500">
                        Màu: {selectedFabric.color}
                      </p>
                    )}
                  </div>
                )}
                {selectedStyle && (
                  <div>
                    <p className="text-sm text-gray-600">Kiểu:</p>
                    <p className="font-medium">{selectedStyle.name}</p>
                  </div>
                )}
              </div>

              {/* Price */}
              {calculatedPrice && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Giá ước tính:</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatPrice(calculatedPrice)}
                  </p>
                </div>
              )}

              {/* Create Button */}
              <button
                onClick={handleCreateConfiguration}
                disabled={!selectedTemplate || !selectedFabric || creating}
                className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                  selectedTemplate && selectedFabric && !creating
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {creating ? "Đang tạo..." : "Tạo sản phẩm"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizeProductPage;

