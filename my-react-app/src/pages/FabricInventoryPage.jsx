import { useEffect, useMemo, useState, useRef } from "react";
import { fabricService } from "../services";
import { analyzeFabricImage } from "../services/fabricAIService";
import { showSuccess, showError } from "../components/NotificationToast.jsx";

// Helper: Convert base64 to File object
const base64ToFile = (base64String, filename = 'image.jpg') => {
  const arr = base64String.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  const ext = mime.split('/')[1] || 'jpg';
  return new File([u8arr], `${filename}.${ext}`, { type: mime });
};

// Helper: Check if string is a base64 data URL
const isBase64Image = (str) => {
  return typeof str === 'string' && str.startsWith('data:image/');
};

// Helper: Upload base64 images to S3 via backend and return URLs
const uploadBase64Images = async (images, prefix = 'fabric') => {
  const uploadedUrls = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (isBase64Image(img)) {
      try {
        const file = base64ToFile(img, `${prefix}-${Date.now()}-${i}`);
        // Use fabricService to upload to S3
        const response = await fabricService.uploadImage(file);
        const parsed = fabricService.parseResponse(response);
        const url = parsed?.url || parsed?.s3Url || parsed;
        if (typeof url === 'string' && url.startsWith('http')) {
          uploadedUrls.push(url);
          console.log(`✅ Uploaded image ${i + 1} to S3:`, url);
        } else {
          console.warn('Could not get URL from upload response:', parsed);
          uploadedUrls.push(img); // Fallback to original
        }
      } catch (error) {
        console.error(`Failed to upload image ${i}:`, error);
        uploadedUrls.push(img); // Fallback to original on error
      }
    } else {
      // Already a URL, keep it
      uploadedUrls.push(img);
    }
  }
  return uploadedUrls;
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&auto=format&fit=crop&q=80";

export default function FabricInventoryPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null, name: "" });
  const [viewDetail, setViewDetail] = useState(null); // For viewing fabric details

  // AI Upload states
  const [aiUploadLoading, setAiUploadLoading] = useState(false);
  const [aiUploadResult, setAiUploadResult] = useState(null);
  const [aiPreviewImage, setAiPreviewImage] = useState(null);
  const [useGeminiAI, setUseGeminiAI] = useState(true);
  const [autoCreateProduct, setAutoCreateProduct] = useState(false);
  const singleUploadRef = useRef(null);

  const emptyItem = {
    id: null,
    code: "",
    name: "",
    description: "",
    category: "",
    material: "",
    color: "",
    pattern: "",
    width: "",
    weight: "",
    pricePerMeter: "",
    unit: "đ/m",
    quantity: "",
    image: "",
    gallery: [],
    origin: "",
    careInstructions: "",
    stretch: "",
    season: "",
    status: "active",
  };

  const [form, setForm] = useState(emptyItem);

  const totalStats = useMemo(() => {
    const totalItems = items.length;
    const totalQuantity = items.reduce(
      (sum, f) => sum + Number(f.quantity || 0),
      0
    );
    const totalValue = items.reduce(
      (sum, f) =>
        sum + Number(f.quantity || 0) * Number(f.pricePerMeter || 0),
      0
    );
    return { totalItems, totalQuantity, totalValue };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((f) => {
      if (filterStatus !== "all" && f.status !== filterStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const text =
          (f.code || "") +
          " " +
          (f.name || "").toLowerCase() +
          " " +
          (f.category || "").toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [items, filterStatus, search]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyItem);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      ...item,
      pricePerMeter: item.pricePerMeter || "",
      quantity: item.quantity || "",
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle multiple image file upload
  const handleImageFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setForm((prev) => {
            const currentGallery = prev.gallery || [];
            // Add to gallery if not already exists
            if (!currentGallery.includes(reader.result)) {
              const newGallery = [...currentGallery, reader.result];
              return {
                ...prev,
                gallery: newGallery,
                // Set first image as main image if not set
                image: prev.image || reader.result,
              };
            }
            return prev;
          });
        }
      };
      reader.readAsDataURL(file);
    });
    // Reset input to allow re-selecting same files
    e.target.value = '';
  };

  // Remove image from gallery
  const handleRemoveGalleryImage = (index) => {
    setForm((prev) => {
      const newGallery = [...(prev.gallery || [])];
      const removedImage = newGallery[index];
      newGallery.splice(index, 1);

      // If removed image was the main image, set first gallery image as main
      let newMainImage = prev.image;
      if (prev.image === removedImage) {
        newMainImage = newGallery.length > 0 ? newGallery[0] : '';
      }

      return {
        ...prev,
        gallery: newGallery,
        image: newMainImage,
      };
    });
  };

  // Set image as main
  const handleSetMainImage = (imageUrl) => {
    setForm((prev) => ({
      ...prev,
      image: imageUrl,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Step 1: Upload any base64 images to server first
      let uploadedGallery = form.gallery || [];
      let uploadedMainImage = form.image || null;

      // Check if there are base64 images that need uploading
      const hasBase64Images = uploadedGallery.some(isBase64Image) || isBase64Image(uploadedMainImage);

      if (hasBase64Images) {
        showSuccess('Đang tải ảnh lên server...');

        // Upload gallery images
        if (uploadedGallery.length > 0) {
          uploadedGallery = await uploadBase64Images(uploadedGallery, form.code || 'fabric');
        }

        // If main image is base64, find its uploaded version or upload separately
        if (isBase64Image(uploadedMainImage)) {
          const mainIndex = form.gallery?.indexOf(form.image);
          if (mainIndex >= 0 && uploadedGallery[mainIndex]) {
            uploadedMainImage = uploadedGallery[mainIndex];
          } else {
            const uploadedMain = await uploadBase64Images([uploadedMainImage], form.code || 'fabric');
            uploadedMainImage = uploadedMain[0];
          }
        }
      }

      // Step 2: Build payload with uploaded URLs
      const payload = {
        code: form.code || `F-${Date.now()}`,
        name: form.name,
        description: form.description || null,
        category: form.category || null,
        material: form.material || null,
        color: form.color || null,
        pattern: form.pattern || null,
        width: form.width ? Number(form.width) : null,
        weight: form.weight ? Number(form.weight) : null,
        quantity: form.quantity ? Number(form.quantity) : 0,
        pricePerMeter: Number(form.pricePerMeter || 0),
        image: uploadedMainImage,
        gallery: uploadedGallery.length > 0 ? uploadedGallery : (uploadedMainImage ? [uploadedMainImage] : null),
        origin: form.origin || null,
        careInstructions: form.careInstructions || null,
        stretch: form.stretch || null,
        season: form.season || null,
        isAvailable: form.status === "active",
        isFeatured: false,
        displayOrder: 0,
      };

      if (editing && editing.id) {
        // Update existing fabric
        await fabricService.update(editing.id, payload);

        // Also update inventory quantity if needed
        if (form.quantity !== undefined) {
          await fabricService.updateInventory(editing.id, {
            quantity: Number(form.quantity || 0),
            location: "Kho chính",
          });
        }
        showSuccess("Đã cập nhật thông tin vải.");
      } else {
        // Create new fabric
        const response = await fabricService.create(payload);
        const newFabric = response?.data ?? response?.responseData ?? response;

        // Create initial inventory
        if (newFabric?.id && form.quantity) {
          await fabricService.updateInventory(newFabric.id, {
            quantity: Number(form.quantity || 0),
            location: "Kho chính",
          });
        }
        showSuccess("Đã thêm vải mới vào kho.");
      }

      await loadInventory();
      setEditing(null);
      setForm(emptyItem);
      setShowForm(false);
    } catch (error) {
      console.error("Error saving fabric:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Không thể lưu thông tin vải. Vui lòng thử lại.";
      showError(errorMessage);
    }
  };

  // Map fabric category string to backend enum
  const mapCategoryToEnum = (category) => {
    if (!category) return null;
    const categoryLower = category.toLowerCase();
    if (categoryLower.includes("lụa") || categoryLower.includes("silk") || categoryLower.includes("tơ tằm")) {
      return "SILK";
    }
    if (categoryLower.includes("linen")) {
      return "LINEN";
    }
    if (categoryLower.includes("cotton") || categoryLower.includes("poplin")) {
      return "COTTON";
    }
    if (categoryLower.includes("satin")) {
      return "SATIN";
    }
    if (categoryLower.includes("cashmere") || categoryLower.includes("wool")) {
      return "WOOL";
    }
    if (categoryLower.includes("chiffon")) {
      return "CHIFFON";
    }
    if (categoryLower.includes("twill") || categoryLower.includes("suiting")) {
      return "TWILL";
    }
    return null; // Backend will handle null
  };

  const handleDeleteClick = (id, name) => {
    setDeleteConfirm({ show: true, id, name });
  };

  const handleDeleteConfirm = async () => {
    const id = deleteConfirm.id;
    setDeleteConfirm({ show: false, id: null, name: "" });
    try {
      await fabricService.delete(id);
      showSuccess("Đã xóa vải khỏi kho.");
      await loadInventory();
    } catch (error) {
      console.error("Error deleting fabric:", error);
      const errorMessage = error?.response?.data?.message || error?.message || "Không thể xóa vải. Vui lòng thử lại.";
      showError(errorMessage);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm({ show: false, id: null, name: "" });
  };

  // Load fabric inventory from API
  const loadInventory = async () => {
    try {
      setLoading(true);
      const response = await fabricService.list({}, { page: 0, size: 1000 });
      const responseData = response?.data ?? response?.responseData ?? response;
      const fabricsList = responseData?.content || responseData?.data || [];

      // Map ALL fabric fields from backend FabricResponse
      const inventoryItems = fabricsList.map((fabric) => ({
        // Basic info
        id: fabric.id,
        code: fabric.code || `F-${String(fabric.id).padStart(3, "0")}`,
        name: fabric.name,
        slug: fabric.slug,
        description: fabric.description,

        // Category & Classification
        category: fabric.category || "",
        material: fabric.material || "",
        color: fabric.color || "",
        pattern: fabric.pattern || "",

        // Dimensions & Specs
        width: fabric.width || null,
        weight: fabric.weight || null,
        stretch: fabric.stretch || "",
        season: fabric.season || "",

        // Pricing
        pricePerMeter: fabric.pricePerMeter || fabric.price || 0,
        unit: fabric.unit || "đ/m",

        // Inventory
        quantity: fabric.totalQuantity || fabric.availableQuantity || fabric.quantity || 0,
        totalQuantity: fabric.totalQuantity || 0,
        availableQuantity: fabric.availableQuantity || 0,
        isLowStock: fabric.isLowStock || false,

        // Media
        image: fabric.image || fabric.gallery?.[0] || "",
        gallery: fabric.gallery || [],

        // Source & Care
        origin: fabric.origin || "",
        careInstructions: fabric.careInstructions || "",

        // Status & Visibility
        status: fabric.isAvailable === true || fabric.isAvailable === "true" || fabric.status === "active" ? "active" : "inactive",
        isFeatured: fabric.isFeatured || false,
        displayOrder: fabric.displayOrder || 0,

        // Metrics
        viewCount: fabric.viewCount || 0,
        soldCount: fabric.soldCount || 0,
        ratingAvg: fabric.ratingAvg || 0,
        ratingCount: fabric.ratingCount || 0,

        // Tags
        tags: fabric.tags || [],

        // Metadata
        createdById: fabric.createdById,
        createdByName: fabric.createdByName || "",
        createdAt: fabric.createdAt,
        updatedAt: fabric.updatedAt,
      }));

      setItems(inventoryItems);
    } catch (error) {
      console.error("Error loading fabric inventory:", error);
      showError("Không thể tải danh sách vải.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventory();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-700">
            Kho vải
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Quản lý vải may đo
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Thêm, chỉnh sửa và theo dõi số lượng vải đang có trong kho để chủ
            động nhận đơn may.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center justify-center px-3 py-2 text-sm md:text-base bg-emerald-700 text-white rounded-full shadow-md hover:bg-emerald-800 transition w-full sm:w-auto"
        >
          <span className="mr-1">＋</span> Thêm cuộn vải
        </button>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <StatCard label="Số loại vải" value={totalStats.totalItems} />
        <StatCard label="Tổng mét vải" value={totalStats.totalQuantity} />
        <StatCard
          label="Giá trị ước tính"
          value={`${totalStats.totalValue.toLocaleString("vi-VN")} đ`}
        />
      </section>

      {/* AI Upload Section */}
      <section className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">📤</span>
          <h2 className="text-lg font-semibold text-slate-800">Upload Ảnh</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Single Upload Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 relative">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">📄</span>
                <span className="font-medium text-slate-700">Upload Đơn Lẻ</span>
              </div>
              <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700 font-medium">+ AI</span>
            </div>

            <input
              type="file"
              ref={singleUploadRef}
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async () => {
                  const base64 = reader.result;
                  setAiPreviewImage(base64);

                  if (useGeminiAI) {
                    try {
                      setAiUploadLoading(true);
                      const result = await analyzeFabricImage(base64);
                      setAiUploadResult(result);
                      showSuccess("Đã phân tích ảnh thành công!");

                      // Auto fill form and open it
                      setForm(prev => ({
                        ...prev,
                        name: result.name || prev.name,
                        description: result.description || prev.description,
                        category: result.category || prev.category,
                        material: result.material || prev.material,
                        color: result.color || prev.color,
                        pattern: result.pattern || prev.pattern,
                        width: result.width || prev.width,
                        weight: result.weight || prev.weight,
                        origin: result.origin || prev.origin,
                        stretch: result.stretch || prev.stretch,
                        season: result.season || prev.season,
                        careInstructions: result.careInstructions || prev.careInstructions,
                        pricePerMeter: result.estimatedPriceVND || prev.pricePerMeter,
                        image: base64,
                      }));
                      setShowForm(true);
                    } catch (err) {
                      showError(err.message || "Lỗi phân tích AI");
                    } finally {
                      setAiUploadLoading(false);
                    }
                  } else {
                    setForm(prev => ({ ...prev, image: base64 }));
                    setShowForm(true);
                  }
                };
                reader.readAsDataURL(file);
              }}
              className="hidden"
            />

            <button
              onClick={() => singleUploadRef.current?.click()}
              disabled={aiUploadLoading}
              className={`w-full py-2.5 rounded-lg font-medium text-sm transition flex items-center justify-center gap-2 ${aiUploadLoading
                ? 'bg-purple-100 text-purple-400 cursor-wait'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
                }`}
            >
              {aiUploadLoading ? (
                <><span className="animate-spin">⏳</span> Đang phân tích...</>
              ) : (
                <>✨ Chọn ảnh (AI phân tích)</>
              )}
            </button>

            <div className="mt-3 space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={useGeminiAI}
                  onChange={(e) => setUseGeminiAI(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-slate-600">🤖 Phân tích với Gemini AI (xem trước & chỉnh sửa)</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoCreateProduct}
                  onChange={(e) => setAutoCreateProduct(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-slate-600">🖼️ Tự động crop vùng đen bao quanh</span>
              </label>
            </div>
          </div>

          {/* AI Result Preview Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">🤖</span>
                <span className="font-medium text-slate-700">Kết quả AI</span>
              </div>
              {aiUploadResult && (
                <button
                  onClick={() => {
                    setAiUploadResult(null);
                    setAiPreviewImage(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕ Xóa
                </button>
              )}
            </div>

            {aiPreviewImage && aiUploadResult ? (
              <div className="space-y-3">
                <div className="flex gap-3">
                  <img
                    src={aiPreviewImage}
                    alt="Preview"
                    className="w-20 h-20 rounded-lg object-cover border"
                  />
                  <div className="flex-1 text-sm">
                    <p className="font-medium text-slate-900">{aiUploadResult.name}</p>
                    <p className="text-slate-500">{aiUploadResult.category}</p>
                    <p className="text-purple-600 font-semibold">
                      {aiUploadResult.estimatedPriceVND?.toLocaleString('vi-VN')} đ/m
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-slate-500">Chất liệu:</span> {aiUploadResult.material}
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <span className="text-slate-500">Màu:</span> {aiUploadResult.color}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-lg">
                {aiUploadLoading ? (
                  <span className="animate-pulse">🔄 Đang phân tích ảnh...</span>
                ) : (
                  <span>Upload ảnh để xem kết quả AI</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-100">
          <p className="text-sm font-medium text-purple-800 mb-1">💡 Hướng dẫn:</p>
          <ul className="text-xs text-purple-700 space-y-1 list-disc list-inside">
            <li>Chọn ảnh vải → AI tự động phân tích loại vải, chất liệu, giá gợi ý</li>
            <li>Kết quả sẽ tự động điền vào form → Xem trước và chỉnh sửa trước khi lưu</li>
            <li>Hỗ trợ định dạng: JPG, PNG, WEBP</li>
          </ul>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-sm space-y-3 md:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-600">Trạng thái:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-full border border-slate-200 text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang bán</option>
              <option value="inactive">Tạm ẩn</option>
            </select>
          </div>
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Mã vải, tên vải, nhóm vải..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* Inventory grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            Đang tải danh sách vải...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            Không có vải nào trong kho.
          </div>
        ) : (
          filteredItems.map((fabric) => (
            <article
              key={fabric.id}
              className="group rounded-2xl border border-emerald-100 bg-gradient-to-b from-white via-emerald-50/40 to-white shadow-sm hover:shadow-xl hover:border-emerald-300 transition overflow-hidden flex flex-col"
            >
              <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
                <img
                  src={fabric.image || FALLBACK_IMAGE}
                  alt={fabric.name}
                  className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = FALLBACK_IMAGE;
                  }}
                />
                <div className="absolute left-3 top-3 px-2 py-1 rounded-full text-[11px] font-semibold bg-black/50 text-white">
                  {fabric.code || `F-${String(fabric.id).padStart(3, "0")}`}
                </div>
                <div className="absolute right-3 top-3">
                  <span
                    className={`px-2 py-1 rounded-full text-[11px] font-semibold ${fabric.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-700"
                      }`}
                  >
                    {fabric.status === "active" ? "Đang bán" : "Tạm ẩn"}
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col p-3 md:p-4">
                <h3 className="font-semibold text-slate-900 line-clamp-2">
                  {fabric.name}
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5">
                  {fabric.category || "Chưa phân loại"}
                </p>

                <div className="mt-2 flex items-baseline justify-between text-sm">
                  <div>
                    <p className="text-xs text-slate-500">Giá / mét</p>
                    <p className="font-semibold text-emerald-900">
                      {fabric.pricePerMeter.toLocaleString("vi-VN")}{" "}
                      {fabric.unit || "đ/m"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Số mét còn</p>
                    <p
                      className={`font-semibold ${fabric.quantity <= 10 ? "text-red-600" : "text-slate-900"
                        }`}
                    >
                      {fabric.quantity} m
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setViewDetail(fabric)}
                    className="flex-1 rounded-full border border-blue-500 text-blue-700 text-xs md:text-sm py-1.5 hover:bg-blue-600 hover:text-white transition"
                  >
                    Xem
                  </button>
                  <button
                    onClick={() => openEdit(fabric)}
                    className="flex-1 rounded-full border border-emerald-500 text-emerald-700 text-xs md:text-sm py-1.5 hover:bg-emerald-600 hover:text-white transition"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteClick(fabric.id, fabric.name)}
                    className="flex-1 rounded-full border border-red-300 text-red-600 text-xs md:text-sm py-1.5 hover:bg-red-500 hover:text-white transition"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {/* Edit / Add form - modal */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                {editing ? "Chỉnh sửa cuộn vải" : "Thêm cuộn vải mới"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                  setForm(emptyItem);
                }}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 text-sm px-4 py-4 max-h-[70vh] overflow-y-auto"
            >
              {/* Row 1: Code, Name */}
              <div>
                <label className="block mb-1 text-slate-600">Mã vải</label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="VD: F-101"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block mb-1 text-slate-600">Tên vải *</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="VD: Lụa tơ tằm kem, Linen mềm màu be..."
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Row 2: Category, Material, Color, Pattern */}
              <div>
                <label className="block mb-1 text-slate-600">Loại vải</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Chọn loại --</option>
                  <option value="COTTON">Cotton</option>
                  <option value="SILK">Lụa (Silk)</option>
                  <option value="LINEN">Linen</option>
                  <option value="WOOL">Len (Wool)</option>
                  <option value="POLYESTER">Polyester</option>
                  <option value="DENIM">Denim</option>
                  <option value="LEATHER">Da (Leather)</option>
                  <option value="SYNTHETIC">Vải tổng hợp</option>
                  <option value="BLEND">Pha trộn</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-slate-600">Chất liệu</label>
                <input
                  type="text"
                  name="material"
                  value={form.material}
                  onChange={handleChange}
                  placeholder="100% Cotton, 70% Silk..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-600">Màu sắc</label>
                <input
                  type="text"
                  name="color"
                  value={form.color}
                  onChange={handleChange}
                  placeholder="Đỏ, Xanh navy..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-600">Họa tiết</label>
                <select
                  name="pattern"
                  value={form.pattern}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Chọn họa tiết --</option>
                  <option value="SOLID">Trơn</option>
                  <option value="STRIPED">Kẻ sọc</option>
                  <option value="CHECKED">Kẻ ca-rô</option>
                  <option value="FLORAL">Hoa văn</option>
                  <option value="GEOMETRIC">Hình học</option>
                  <option value="ABSTRACT">Trừu tượng</option>
                  <option value="POLKA_DOT">Chấm bi</option>
                  <option value="TEXTURED">Dệt vân</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              {/* Row 3: Price, Quantity, Width, Weight */}
              <div>
                <label className="block mb-1 text-slate-600">Giá / mét (đ) *</label>
                <input
                  type="number"
                  name="pricePerMeter"
                  value={form.pricePerMeter}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-600">Số mét còn *</label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-600">Khổ vải (cm)</label>
                <input
                  type="number"
                  name="width"
                  value={form.width}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="150"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-600">Định lượng (g/m²)</label>
                <input
                  type="number"
                  name="weight"
                  value={form.weight}
                  onChange={handleChange}
                  min="0"
                  step="1"
                  placeholder="200"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Row 4: Origin, Stretch, Season, Status */}
              <div>
                <label className="block mb-1 text-slate-600">Xuất xứ</label>
                <input
                  type="text"
                  name="origin"
                  value={form.origin}
                  onChange={handleChange}
                  placeholder="Việt Nam, Ý..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-600">Độ co giãn</label>
                <select
                  name="stretch"
                  value={form.stretch}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Chọn --</option>
                  <option value="NONE">Không co giãn</option>
                  <option value="LOW">Ít co giãn</option>
                  <option value="MEDIUM">Co giãn vừa</option>
                  <option value="HIGH">Co giãn nhiều</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-slate-600">Mùa phù hợp</label>
                <select
                  name="season"
                  value={form.season}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Chọn --</option>
                  <option value="SPRING">Xuân</option>
                  <option value="SUMMER">Hè</option>
                  <option value="AUTUMN">Thu</option>
                  <option value="WINTER">Đông</option>
                  <option value="ALL_SEASON">4 mùa</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-slate-600">Trạng thái</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="active">Đang bán</option>
                  <option value="inactive">Tạm ẩn</option>
                </select>
              </div>

              {/* Row 5: Description */}
              <div className="md:col-span-4">
                <label className="block mb-1 text-slate-600">Mô tả</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Mô tả chi tiết về vải..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Row 6: Care Instructions */}
              <div className="md:col-span-4">
                <label className="block mb-1 text-slate-600">Hướng dẫn bảo quản</label>
                <textarea
                  name="careInstructions"
                  value={form.careInstructions}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Giặt tay, phơi mát, không vắt..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Row 7: Gallery Images */}
              <div className="md:col-span-4">
                <label className="block mb-2 text-slate-600 font-medium">
                  🖼️ Ảnh sản phẩm (có thể chọn nhiều ảnh)
                </label>

                {/* Gallery Preview */}
                {(form.gallery?.length > 0 || form.image) && (
                  <div className="mb-3">
                    <p className="text-xs text-slate-500 mb-2">
                      📷 {form.gallery?.length || (form.image ? 1 : 0)} ảnh • Click vào ảnh để đặt làm ảnh chính
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {(form.gallery?.length > 0 ? form.gallery : (form.image ? [form.image] : [])).map((img, idx) => (
                        <div
                          key={idx}
                          className={`relative group cursor-pointer ${img === form.image
                            ? 'ring-2 ring-emerald-500 ring-offset-2'
                            : 'hover:ring-2 hover:ring-slate-300'
                            } rounded-lg overflow-hidden`}
                          onClick={() => handleSetMainImage(img)}
                        >
                          <img
                            src={img}
                            alt={`Ảnh ${idx + 1}`}
                            className="w-20 h-20 object-cover"
                          />
                          {/* Main image badge */}
                          {img === form.image && (
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-emerald-500 text-white text-[10px] font-semibold rounded">
                              Ảnh chính
                            </div>
                          )}
                          {/* Image index */}
                          <div className="absolute bottom-1 left-1 w-5 h-5 bg-black/60 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                            {idx + 1}
                          </div>
                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveGalleryImage(idx);
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Controls */}
                <div className="flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg cursor-pointer hover:from-emerald-600 hover:to-teal-600 transition shadow-sm">
                    <span>📷</span>
                    <span className="text-sm font-medium">Chọn ảnh</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>

                  <span className="text-xs text-slate-400">
                    Hoặc dán link ảnh:
                  </span>

                  <input
                    type="text"
                    placeholder="https://example.com/image.jpg"
                    className="flex-1 min-w-[200px] px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const url = e.target.value.trim();
                        if (url) {
                          setForm((prev) => {
                            const currentGallery = prev.gallery || [];
                            if (!currentGallery.includes(url)) {
                              return {
                                ...prev,
                                gallery: [...currentGallery, url],
                                image: prev.image || url,
                              };
                            }
                            return prev;
                          });
                          e.target.value = '';
                        }
                      }
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="https://example.com/image.jpg"]');
                      const url = input?.value?.trim();
                      if (url) {
                        setForm((prev) => {
                          const currentGallery = prev.gallery || [];
                          if (!currentGallery.includes(url)) {
                            return {
                              ...prev,
                              gallery: [...currentGallery, url],
                              image: prev.image || url,
                            };
                          }
                          return prev;
                        });
                        input.value = '';
                      }
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm transition"
                  >
                    Thêm link
                  </button>
                </div>

                {/* Tips */}
                <p className="mt-2 text-xs text-slate-400">
                  💡 Mẹo: Chọn nhiều ảnh cùng lúc (giữ Ctrl hoặc Shift khi chọn). Hỗ trợ JPG, PNG, WEBP.
                </p>
              </div>

              {/* Buttons */}
              <div className="md:col-span-4 flex flex-wrap justify-end gap-2 mt-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    setForm(emptyItem);
                  }}
                  className="px-4 py-2 rounded-full border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 shadow"
                >
                  {editing ? "Lưu thay đổi" : "Thêm vào kho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform animate-scaleIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-pink-500 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">⚠️</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Xác nhận xóa</h3>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <p className="text-slate-700 text-sm leading-relaxed">
                Bạn có chắc chắn muốn xóa cuộn vải{" "}
                <span className="font-semibold text-slate-900">"{deleteConfirm.name}"</span>{" "}
                khỏi kho không?
              </p>
              <p className="mt-2 text-xs text-slate-500">
                ⚠️ Hành động này không thể hoàn tác.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={handleDeleteCancel}
                className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-100 transition"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-semibold hover:from-red-600 hover:to-pink-600 shadow-md hover:shadow-lg transition"
              >
                Xóa vải
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fabric Detail View Modal */}
      {viewDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fadeIn p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-scaleIn">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div>
                <p className="text-xs text-emerald-600 uppercase tracking-wide font-semibold">Chi tiết vải</p>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">{viewDetail.name}</h2>
              </div>
              <button
                onClick={() => setViewDetail(null)}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="flex flex-col md:flex-row gap-6 p-6">
                {/* Left: Image Gallery */}
                <div className="md:w-2/5 space-y-3">
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={viewDetail.image || FALLBACK_IMAGE}
                      alt={viewDetail.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${viewDetail.status === 'active'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-400 text-white'
                        }`}>
                        {viewDetail.status === 'active' ? 'Đang bán' : 'Tạm ẩn'}
                      </span>
                    </div>
                  </div>

                  {/* Gallery Thumbnails */}
                  {viewDetail.gallery && viewDetail.gallery.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {viewDetail.gallery.map((img, idx) => (
                        <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0 border-2 border-transparent hover:border-emerald-500 cursor-pointer">
                          <img src={img} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Info */}
                <div className="md:w-3/5 space-y-5">
                  {/* Code, Category & Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      Mã: {viewDetail.code || `F-${String(viewDetail.id).padStart(3, '0')}`}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${viewDetail.category ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {viewDetail.category || "Chưa phân loại"}
                    </span>
                    {viewDetail.isFeatured && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        ⭐ Nổi bật
                      </span>
                    )}
                    {viewDetail.isLowStock && (
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        ⚠️ Sắp hết
                      </span>
                    )}
                  </div>

                  {/* Price & Stock Section */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
                    <div>
                      <p className="text-xs text-slate-500">Giá / mét</p>
                      <p className="text-xl font-bold text-emerald-700">
                        {viewDetail.pricePerMeter?.toLocaleString('vi-VN') || 0} <span className="text-xs font-normal">đ</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Tồn kho</p>
                      <p className={`text-xl font-bold ${viewDetail.quantity <= 10 ? 'text-red-600' : 'text-slate-900'}`}>
                        {viewDetail.quantity || 0} <span className="text-xs font-normal">m</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Đã bán</p>
                      <p className="text-xl font-bold text-slate-700">
                        {viewDetail.soldCount || 0} <span className="text-xs font-normal">cuộn</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Lượt xem</p>
                      <p className="text-xl font-bold text-slate-700">
                        {viewDetail.viewCount || 0}
                      </p>
                    </div>
                  </div>

                  {/* Rating */}
                  {(viewDetail.ratingAvg > 0 || viewDetail.ratingCount > 0) && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-amber-500">★</span>
                      <span className="font-semibold">{(viewDetail.ratingAvg || 0).toFixed(1)}</span>
                      <span className="text-slate-400">({viewDetail.ratingCount || 0} đánh giá)</span>
                    </div>
                  )}

                  {/* Specifications Grid - Always show all fields */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <span>📋</span> Thông số kỹ thuật
                    </h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm bg-slate-50 rounded-lg p-3">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Chất liệu:</span>
                        <span className={`font-medium ${viewDetail.material ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          {viewDetail.material || "Chưa cập nhật"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Màu sắc:</span>
                        <span className={`font-medium ${viewDetail.color ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          {viewDetail.color || "Chưa cập nhật"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Khổ vải:</span>
                        <span className={`font-medium ${viewDetail.width ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          {viewDetail.width ? `${viewDetail.width} cm` : "Chưa cập nhật"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Định lượng:</span>
                        <span className={`font-medium ${viewDetail.weight ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          {viewDetail.weight ? `${viewDetail.weight} gsm` : "Chưa cập nhật"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Họa tiết:</span>
                        <span className={`font-medium ${viewDetail.pattern ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          {viewDetail.pattern || "Chưa cập nhật"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Co giãn:</span>
                        <span className={`font-medium ${viewDetail.stretch ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          {viewDetail.stretch || "Chưa cập nhật"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Mùa phù hợp:</span>
                        <span className={`font-medium ${viewDetail.season ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          {viewDetail.season || "Chưa cập nhật"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Xuất xứ:</span>
                        <span className={`font-medium ${viewDetail.origin ? 'text-slate-800' : 'text-slate-400 italic'}`}>
                          {viewDetail.origin || "Chưa cập nhật"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {viewDetail.tags && viewDetail.tags.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <span>🏷️</span> Tags
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {viewDetail.tags.map((tag, idx) => (
                          <span key={idx} className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Care Instructions */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <span>🧺</span> Hướng dẫn bảo quản
                    </h3>
                    <p className={`text-sm bg-amber-50 border border-amber-100 rounded-lg p-3 ${viewDetail.careInstructions ? 'text-slate-600' : 'text-slate-400 italic'}`}>
                      {viewDetail.careInstructions || "Chưa có hướng dẫn bảo quản"}
                    </p>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <span>📝</span> Mô tả
                    </h3>
                    <p className={`text-sm leading-relaxed ${viewDetail.description ? 'text-slate-600' : 'text-slate-400 italic'}`}>
                      {viewDetail.description || "Chưa có mô tả chi tiết"}
                    </p>
                  </div>

                  {/* Metadata */}
                  <div className="pt-3 border-t border-slate-100 text-xs text-slate-400 space-y-1">
                    {viewDetail.slug && (
                      <p>Slug: <span className="font-mono text-slate-500">{viewDetail.slug}</span></p>
                    )}
                    {viewDetail.createdByName && (
                      <p>Người tạo: <span className="text-slate-500">{viewDetail.createdByName}</span></p>
                    )}
                    {viewDetail.createdAt && (
                      <p>Ngày tạo: <span className="text-slate-500">{new Date(viewDetail.createdAt).toLocaleDateString('vi-VN')}</span></p>
                    )}
                    {viewDetail.updatedAt && (
                      <p>Cập nhật: <span className="text-slate-500">{new Date(viewDetail.updatedAt).toLocaleDateString('vi-VN')}</span></p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setViewDetail(null)}
                className="px-5 py-2.5 rounded-full border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-100 transition"
              >
                Đóng
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setViewDetail(null);
                    openEdit(viewDetail);
                  }}
                  className="px-5 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition flex items-center gap-2"
                >
                  <span>✏️</span> Chỉnh sửa
                </button>
                <a
                  href={`/fabrics/${viewDetail.slug || viewDetail.code || viewDetail.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-full bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <span>🔗</span> Xem trang bán
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}


