import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Upload, Smartphone, Monitor, ChevronRight, Check } from "lucide-react";
import TagInput from "../common/TagInput";

export default function ProductForm({ item, onClose, onSave }) {
    // --- Form State ---
    const [formData, setFormData] = useState({
        key: "",
        name: "",
        category: "",
        type: "",
        price: "",
        description: "",
        image: "",
        gallery: [],
        // Tailoring Specs
        tailoringTime: "7-14 ngày",
        fittingCount: "1-2 lần",
        warranty: "Chỉnh sửa miễn phí 1 lần",
        silhouette: "",
        materials: [],
        colors: [],
        occasions: [],
        customerStyles: [],
        careInstructions: [],
        // Additional
        lengthInfo: "",
        lining: "Có, chống hằn & thoáng",
        accessories: "",
    });

    const [previewMode, setPreviewMode] = useState("mobile"); // 'mobile' | 'desktop'
    const [activeTab, setActiveTab] = useState("general"); // 'general' | 'media' | 'specs'

    // Initialize data if editing
    useEffect(() => {
        if (item) {
            setFormData({
                key: item.key || "",
                name: item.name || "",
                category: item.category || "",
                type: item.type || "",
                price: item.price || "",
                description: item.description || "",
                image: item.image || item.media?.thumbnail || "",
                gallery: item.gallery || item.media?.gallery || [],
                tailoringTime: item.specifications?.tailoringTime || "7-14 ngày",
                fittingCount: item.specifications?.fittingCount || "1-2 lần",
                warranty: item.specifications?.warranty || "Chỉnh sửa miễn phí 1 lần",
                silhouette: item.specifications?.silhouette || "",
                materials: item.specifications?.materials || [],
                colors: item.specifications?.colors || [],
                occasions: item.occasions || item.specifications?.occasions || [], // Handle both locations from API response
                customerStyles: item.customerStyles || item.specifications?.styleRecommendations || [],
                careInstructions: item.careInstructions || item.specifications?.careInstructions || [],
                lengthInfo: item.specifications?.length || "",
                lining: item.specifications?.lining || "Có, chống hằn & thoáng",
                accessories: item.specifications?.accessories || "",
            });
        }
    }, [item]);

    // --- Auto-fill Logic ---
    useEffect(() => {
        // Only auto-fill for new products or if user hasn't heavily customized yet
        if (!item && formData.category) {
            const timer = setTimeout(() => {
                applyTemplateDefaults(formData.category);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [formData.category]); // Removed item from deps as it's checked inside

    const applyTemplateDefaults = async (categoryInput) => {
        if (!categoryInput) return;

        // Simple client-side normalization to match backend seed codes
        let code = "";
        const lower = categoryInput.toLowerCase();
        if (lower.includes("vest") || lower.includes("suit")) code = "vest";
        else if (lower.includes("ao dai") || lower.includes("áo dài")) code = "ao_dai";
        else if (lower.includes("vay") || lower.includes("váy") || lower.includes("đầm") || lower.includes("dam")) code = "vay";

        if (!code) return;

        try {
            const template = await import("../../services/categoryTemplateService").then(m => m.default.getByCode(code));
            if (template) {
                setFormData(prev => ({
                    ...prev,
                    tailoringTime: template.tailoringTime || prev.tailoringTime,
                    fittingCount: template.fittingCount || prev.fittingCount,
                    warranty: template.warranty || prev.warranty,
                    silhouette: template.silhouette || prev.silhouette,
                    materials: template.materials?.length > 0 ? template.materials : prev.materials,
                    colors: template.colors?.length > 0 ? template.colors : prev.colors,
                    occasions: template.occasions?.length > 0 ? template.occasions : prev.occasions,
                    customerStyles: template.customerStyles?.length > 0 ? template.customerStyles : prev.customerStyles,
                    careInstructions: template.careInstructions?.length > 0 ? template.careInstructions : prev.careInstructions,
                    lengthInfo: template.lengthInfo || prev.lengthInfo,
                    lining: template.lining || prev.lining,
                    accessories: template.accessories || prev.accessories,
                }));
            }
        } catch (err) {
            // Valid case: no template found, just ignore
        }
    };

    const handleChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleGalleryAdd = (url) => {
        if (url && !formData.gallery.includes(url)) {
            setFormData((prev) => ({ ...prev, gallery: [...prev.gallery, url] }));
        }
    };

    const handleSubmit = () => {
        // Basic validation
        if (!formData.key || !formData.name || !formData.price) {
            alert("Vui lòng nhập Tên, Mã định danh và Giá sản phẩm");
            return;
        }

        // Prepare data for API
        const payload = {
            ...formData,
            id: item?.id, // Keep ID for updates
            price: Number(formData.price),
        };

        onSave(payload);
    };

    // --- Render Helpers ---
    const SectionTitle = ({ title, active }) => (
        <h3 className={`font-semibold text-lg mb-4 ${active ? 'text-emerald-700' : 'text-gray-600'}`}>{title}</h3>
    );

    return createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-7xl h-[90vh] flex shadow-2xl overflow-hidden">

                {/* LEFT: Form Input */}
                <div className="w-full lg:w-3/5 flex flex-col border-r bg-gray-50/50">
                    {/* Header */}
                    <div className="p-5 border-b bg-white flex justify-between items-center sticky top-0 z-10">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">
                                {item ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">Điền đầy đủ thông tin chi tiết may đo</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                                Hủy
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-medium shadow-md transition-all active:scale-95"
                            >
                                {item ? "Cập nhật" : "Tạo mới"}
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex border-b bg-white px-5 space-x-6 text-sm font-medium">
                        {['general', 'media', 'specs'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`py-3 border-b-2 px-1 capitalize transition ${activeTab === tab
                                    ? 'border-emerald-600 text-emerald-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab === 'general' ? 'Thông tin chung' : tab === 'media' ? 'Hình ảnh' : 'Chi tiết may đo'}
                            </button>
                        ))}
                    </div>

                    {/* Scrollable Form Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">

                        {/* GENERAL INFO TAB */}
                        {activeTab === 'general' && (
                            <div className="space-y-5 animate-in slide-in-from-left-4 duration-300">
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-1">Tên sản phẩm *</label>
                                        <input
                                            value={formData.name}
                                            onChange={(e) => handleChange("name", e.target.value)}
                                            className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                                            placeholder="Ví dụ: Áo dài lụa tơ tằm..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Mã định danh (Slug/Key) *</label>
                                        <input
                                            value={formData.key}
                                            onChange={(e) => handleChange("key", e.target.value)}
                                            className="w-full p-2.5 border rounded-lg bg-gray-50"
                                            placeholder="ao-dai-lua-to-tam"
                                        />
                                        <p className="text-xs text-gray-400 mt-1">Dùng cho URL (không dấu, gạch ngang)</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Giá (VNĐ) *</label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => handleChange("price", e.target.value)}
                                            className="w-full p-2.5 border rounded-lg"
                                            placeholder="500000"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Danh mục (Category)</label>
                                        <input
                                            value={formData.category}
                                            onChange={(e) => handleChange("category", e.target.value)}
                                            className="w-full p-2.5 border rounded-lg"
                                            placeholder="Áo dài, Vest, Váy..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Loại (Type)</label>
                                        <input
                                            value={formData.type}
                                            onChange={(e) => handleChange("type", e.target.value)}
                                            className="w-full p-2.5 border rounded-lg"
                                            placeholder="Truyền thống, Cách tân..."
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium mb-1">Mô tả ngắn</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleChange("description", e.target.value)}
                                            className="w-full p-2.5 border rounded-lg h-24"
                                            placeholder="Mô tả chi tiết về sản phẩm..."
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* MEDIA TAB */}
                        {activeTab === 'media' && (
                            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Ảnh đại diện (URL)</label>
                                    <div className="flex gap-3">
                                        <input
                                            value={formData.image}
                                            onChange={(e) => handleChange("image", e.target.value)}
                                            className="flex-1 p-2.5 border rounded-lg"
                                            placeholder="https://..."
                                        />
                                    </div>
                                    {formData.image && (
                                        <div className="mt-3 relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden border">
                                            <img src={formData.image} alt="Preview" className="w-full h-full object-contain" />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Bộ sưu tập (Gallery)</label>
                                    <div className="flex gap-3 mb-3">
                                        <input
                                            id="gallery-input"
                                            className="flex-1 p-2.5 border rounded-lg"
                                            placeholder="Nhập URL ảnh và nhấn Enter"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleGalleryAdd(e.target.value);
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                const input = document.getElementById('gallery-input');
                                                handleGalleryAdd(input.value);
                                                input.value = '';
                                            }}
                                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
                                        >
                                            Thêm
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-4 gap-3">
                                        {formData.gallery.map((url, idx) => (
                                            <div key={idx} className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border">
                                                <img src={url} className="w-full h-full object-cover" />
                                                <button
                                                    onClick={() => handleChange("gallery", formData.gallery.filter((_, i) => i !== idx))}
                                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        {formData.gallery.length === 0 && (
                                            <div className="col-span-4 py-8 text-center text-gray-400 border-2 border-dashed rounded-lg">
                                                Chưa có ảnh nào trong bộ sưu tập
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAILORING SPECS TAB */}
                        {activeTab === 'specs' && (
                            <div className="space-y-6 animate-in slide-in-from-left-4 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="col-span-2 p-4 bg-emerald-50 rounded-lg border border-emerald-100 text-sm text-emerald-800">
                                        <h4 className="font-semibold mb-1 flex items-center gap-2">
                                            <Check size={16} /> Thông tin chi tiết may đo
                                        </h4>
                                        Những thông tin này sẽ giúp khách hàng hình dung rõ hơn về dịch vụ may đo cao cấp của tiệm.
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Thời gian may</label>
                                        <input
                                            value={formData.tailoringTime}
                                            onChange={(e) => handleChange("tailoringTime", e.target.value)}
                                            className="w-full p-2.5 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Số lần thử đồ</label>
                                        <input
                                            value={formData.fittingCount}
                                            onChange={(e) => handleChange("fittingCount", e.target.value)}
                                            className="w-full p-2.5 border rounded-lg"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Bảo hành</label>
                                        <input
                                            value={formData.warranty}
                                            onChange={(e) => handleChange("warranty", e.target.value)}
                                            className="w-full p-2.5 border rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Form dáng (Silhouette)</label>
                                        <input
                                            value={formData.silhouette}
                                            onChange={(e) => handleChange("silhouette", e.target.value)}
                                            className="w-full p-2.5 border rounded-lg"
                                            placeholder="Ví dụ: Body fit, A-line..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t">
                                    <TagInput
                                        label="Chất liệu gợi ý"
                                        value={formData.materials}
                                        onChange={(v) => handleChange("materials", v)}
                                        suggestions={["Lụa tơ tằm", "Cotton", "Linen", "Velvet", "Gấm"]}
                                    />

                                    <TagInput
                                        label="Màu sắc có sẵn"
                                        value={formData.colors}
                                        onChange={(v) => handleChange("colors", v)}
                                        suggestions={["Trắng", "Đen", "Đỏ", "Xanh Navy", "Be"]}
                                    />

                                    <TagInput
                                        label="Dịp sử dụng"
                                        value={formData.occasions}
                                        onChange={(v) => handleChange("occasions", v)}
                                        suggestions={["Đi làm", "Dự tiệc", "Đám cưới", "Dạo phố"]}
                                    />

                                    <TagInput
                                        label="Hướng dẫn bảo quản"
                                        value={formData.careInstructions}
                                        onChange={(v) => handleChange("careInstructions", v)}
                                        suggestions={["Giặt tay", "Giặt máy nhẹ", "Ủi hơi nước", "Không tẩy"]}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT: Live Preview */}
                <div className="hidden lg:flex w-2/5  bg-gray-100 flex-col border-l">
                    <div className="p-4 border-b bg-white flex items-center justify-between">
                        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                            <Smartphone size={18} /> Live Preview
                        </h3>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setPreviewMode('mobile')}
                                className={`p-1.5 rounded ${previewMode === 'mobile' ? 'bg-white shadow' : 'text-gray-500'}`}
                            >
                                <Smartphone size={16} />
                            </button>
                            <button
                                onClick={() => setPreviewMode('desktop')}
                                className={`p-1.5 rounded ${previewMode === 'desktop' ? 'bg-white shadow' : 'text-gray-500'}`}
                            >
                                <Monitor size={16} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto flex justify-center items-start">
                        <div className={`bg-white shadow-2xl overflow-hidden transition-all duration-300 border-gray-800 ${previewMode === 'mobile'
                            ? 'w-[375px] rounded-[30px] border-[8px] min-h-[700px]'
                            : 'w-[800px] rounded-lg border min-h-[600px]'
                            }`}>
                            {/* Fake Mobile Header */}
                            {previewMode === 'mobile' && (
                                <div className="bg-white px-4 py-3 flex justify-between items-center border-b sticky top-0 z-10">
                                    <ChevronRight className="rotate-180" size={20} />
                                    <span className="font-medium text-sm">Chi tiết sản phẩm</span>
                                    <div className="w-5" />
                                </div>
                            )}

                            {/* Product Content */}
                            <div>
                                <div className="aspect-[3/4] bg-gray-100 relative">
                                    <img src={formData.image || "https://via.placeholder.com/400x600?text=No+Image"} className="w-full h-full object-cover" />
                                    {formData.gallery.length > 0 && (
                                        <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                                            1/{formData.gallery.length + 1}
                                        </div>
                                    )}
                                </div>

                                <div className="p-4 space-y-4">
                                    <div>
                                        <h2 className="font-serif text-xl text-gray-900 leading-tight">
                                            {formData.name || "Tên sản phẩm..."}
                                        </h2>
                                        <p className="text-emerald-700 font-medium mt-1">
                                            {Number(formData.price).toLocaleString()} đ
                                        </p>
                                    </div>

                                    {/* Tailoring Card */}
                                    <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100 space-y-3">
                                        <h4 className="text-xs font-bold text-orange-800 uppercase tracking-widest mb-2">Chi tiết may đo</h4>

                                        <div className="grid grid-cols-2 gap-y-3 text-sm">
                                            <div>
                                                <p className="text-gray-500 text-xs">THỜI GIAN</p>
                                                <p className="font-medium text-gray-800">{formData.tailoringTime}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">THỬ ĐỒ</p>
                                                <p className="font-medium text-gray-800">{formData.fittingCount}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">CHẤT LIỆU</p>
                                                <p className="font-medium text-gray-800">
                                                    {formData.materials.length > 0 ? formData.materials[0] : "Tùy chọn"}
                                                    {formData.materials.length > 1 && ` +${formData.materials.length - 1}`}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs">FORM DÁNG</p>
                                                <p className="font-medium text-gray-800">{formData.silhouette || "Chuẩn"}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-gray-900">Mô tả</p>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                            {formData.description || "Mô tả sản phẩm sẽ hiển thị ở đây..."}
                                        </p>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="pt-4 flex gap-3">
                                        <button className="flex-1 bg-emerald-800 text-white py-3 rounded-full font-medium text-sm shadow-lg shadow-emerald-200">
                                            Đặt may mẫu này
                                        </button>
                                        <button className="p-3 border rounded-full text-emerald-800 border-emerald-200">
                                            <Smartphone size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>,
        document.body
    );
}
