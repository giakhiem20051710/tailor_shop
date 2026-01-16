import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, Loader, Sparkles, Edit3, Clock, UserCheck, Shield, Scissors, Palette, Heart, Info, AlertCircle } from 'lucide-react';

/**
 * AI Analysis Modal - Hiển thị kết quả phân tích AI và cho phép chỉnh sửa trước khi lưu
 */
export default function AIAnalysisModal({
    isOpen,
    onClose,
    analysisResult,
    imagePreview,
    onSave,
    saving,
    error
}) {
    const [editedResult, setEditedResult] = useState(analysisResult || {});
    const [isEditing, setIsEditing] = useState(false);

    // Update editedResult when analysisResult changes
    useEffect(() => {
        if (analysisResult) {
            setEditedResult(analysisResult);
            setIsEditing(false);
        }
    }, [analysisResult]);

    if (!isOpen) return null;

    const handleFieldChange = (field, value) => {
        setEditedResult(prev => ({ ...prev, [field]: value }));
        setIsEditing(true);
    };

    const handleArrayFieldChange = (field, index, value) => {
        setEditedResult(prev => {
            const newArray = [...(prev[field] || [])];
            newArray[index] = value;
            return { ...prev, [field]: newArray };
        });
        setIsEditing(true);
    };

    const handleAddArrayItem = (field, defaultValue = '') => {
        setEditedResult(prev => ({
            ...prev,
            [field]: [...(prev[field] || []), defaultValue]
        }));
        setIsEditing(true);
    };

    const handleRemoveArrayItem = (field, index) => {
        setEditedResult(prev => ({
            ...prev,
            [field]: (prev[field] || []).filter((_, i) => i !== index)
        }));
        setIsEditing(true);
    };

    const handleSave = () => {
        onSave(editedResult);
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-3xl max-w-7xl w-full max-h-[96vh] flex flex-col shadow-2xl animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex-shrink-0 bg-gradient-to-r from-purple-50 to-blue-50 border-b border-gray-200 px-6 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Sparkles className="text-white" size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Kết quả phân tích AI</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {isEditing ? '📝 Đã chỉnh sửa - Nhấn "Lưu" để hoàn tất' : 'Xem và chỉnh sửa thông tin trước khi lưu'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {analysisResult?.confidence && (
                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${analysisResult.confidence > 0.8 ? 'bg-green-100 text-green-700' :
                                analysisResult.confidence > 0.5 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                Độ tin cậy: {(analysisResult.confidence * 100).toFixed(0)}%
                            </span>
                        )}
                        <button
                            onClick={onClose}
                            className="w-9 h-9 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all shadow-sm hover:shadow"
                            title="Đóng"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 md:p-8 overflow-y-auto min-h-0 bg-gray-50">
                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="text-sm font-medium text-red-800">Lỗi</p>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-6 lg:gap-8">
                        {/* LEFT: IMAGE PREVIEW */}
                        <div className="flex flex-col">
                            <div className="relative rounded-2xl overflow-hidden shadow-xl bg-white border border-gray-200 aspect-[3/4]">
                                {imagePreview && (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-contain bg-gray-100"
                                    />
                                )}
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm z-10">
                                    <span className="text-xs font-semibold text-gray-700">Preview</span>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: EDITABLE FIELDS */}
                        <div className="space-y-5">
                            {/* THÔNG TIN PHÂN LOẠI */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                                        <Info className="text-indigo-600" size={18} />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900">Thông tin phân loại</h3>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                                        <select
                                            value={editedResult.category || 'template'}
                                            onChange={(e) => handleFieldChange('category', e.target.value)}
                                            className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="template">Template</option>
                                            <option value="fabric">Fabric</option>
                                            <option value="style">Style</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
                                        <select
                                            value={editedResult.type || 'unknown'}
                                            onChange={(e) => handleFieldChange('type', e.target.value)}
                                            className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="ao_dai">Áo dài</option>
                                            <option value="vest">Vest</option>
                                            <option value="vay_dam">Váy đầm</option>
                                            <option value="ao_so_mi">Áo sơ mi</option>
                                            <option value="quan_tay">Quần tây</option>
                                            <option value="ao_khoac">Áo khoác</option>
                                            <option value="jumpsuit">Jumpsuit</option>
                                            <option value="dam_da_hoi">Đầm dạ hội</option>
                                            <option value="chan_vay">Chân váy</option>
                                            <option value="unknown">Khác</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Gender</label>
                                        <select
                                            value={editedResult.gender || 'unisex'}
                                            onChange={(e) => handleFieldChange('gender', e.target.value)}
                                            className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        >
                                            <option value="male">Nam</option>
                                            <option value="female">Nữ</option>
                                            <option value="unisex">Unisex</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* MÔ TẢ SẢN PHẨM */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Edit3 className="text-blue-600" size={18} />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900">Mô tả sản phẩm</h3>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
                                        <textarea
                                            value={editedResult.description || ''}
                                            onChange={(e) => handleFieldChange('description', e.target.value)}
                                            className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                            rows={2}
                                            placeholder="Mô tả về sản phẩm..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                                                <Clock size={12} /> Thời gian may
                                            </label>
                                            <input
                                                type="text"
                                                value={editedResult.tailoringTime || ''}
                                                onChange={(e) => handleFieldChange('tailoringTime', e.target.value)}
                                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="7-14 ngày"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                                                <UserCheck size={12} /> Số lần thử đồ
                                            </label>
                                            <input
                                                type="text"
                                                value={editedResult.fittingCount || ''}
                                                onChange={(e) => handleFieldChange('fittingCount', e.target.value)}
                                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="1-2 lần"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
                                                <Shield size={12} /> Bảo hành
                                            </label>
                                            <input
                                                type="text"
                                                value={editedResult.warranty || ''}
                                                onChange={(e) => handleFieldChange('warranty', e.target.value)}
                                                className="w-full p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                                placeholder="Chỉnh sửa miễn phí 1 lần"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* CHI TIẾT MAY ĐO */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-sm">
                                        <Scissors className="text-white" size={18} />
                                    </div>
                                    <h3 className="text-base font-bold text-amber-900">Chi tiết may đo</h3>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-amber-800 mb-1">Form dáng</label>
                                        <input
                                            type="text"
                                            value={editedResult.silhouette || ''}
                                            onChange={(e) => handleFieldChange('silhouette', e.target.value)}
                                            className="w-full p-2 border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white/70"
                                            placeholder="Ôm nhẹ, tôn eo"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-amber-800 mb-1">Độ dài</label>
                                        <input
                                            type="text"
                                            value={editedResult.lengthInfo || ''}
                                            onChange={(e) => handleFieldChange('lengthInfo', e.target.value)}
                                            className="w-full p-2 border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white/70"
                                            placeholder="Qua gối / maxi"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-amber-800 mb-1">Lót trong</label>
                                        <input
                                            type="text"
                                            value={editedResult.lining || ''}
                                            onChange={(e) => handleFieldChange('lining', e.target.value)}
                                            className="w-full p-2 border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white/70"
                                            placeholder="Có, chống hằn & thoáng"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-amber-800 mb-1">Phụ kiện</label>
                                        <input
                                            type="text"
                                            value={editedResult.accessories || ''}
                                            onChange={(e) => handleFieldChange('accessories', e.target.value)}
                                            className="w-full p-2 border border-amber-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-white/70"
                                            placeholder="Belt, hoa cài..."
                                        />
                                    </div>
                                </div>

                                {/* Materials */}
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-amber-800 mb-1 flex items-center gap-1">
                                        <Palette size={12} /> Chất liệu gợi ý
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {(editedResult.materials || []).map((material, idx) => (
                                            <div key={idx} className="flex items-center gap-1 bg-white/80 rounded-lg px-2 py-1 border border-amber-200">
                                                <input
                                                    type="text"
                                                    value={material}
                                                    onChange={(e) => handleArrayFieldChange('materials', idx, e.target.value)}
                                                    className="w-20 text-xs border-none outline-none bg-transparent"
                                                />
                                                <button
                                                    onClick={() => handleRemoveArrayItem('materials', idx)}
                                                    className="text-amber-600 hover:text-red-600"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => handleAddArrayItem('materials', 'Chất liệu mới')}
                                            className="text-xs text-amber-700 hover:text-amber-900 px-2 py-1 border border-dashed border-amber-300 rounded-lg"
                                        >
                                            + Thêm
                                        </button>
                                    </div>
                                </div>

                                {/* Colors */}
                                <div className="mt-3">
                                    <label className="block text-xs font-medium text-amber-800 mb-1">Màu sắc</label>
                                    <div className="flex flex-wrap gap-2">
                                        {(editedResult.colors || []).map((color, idx) => (
                                            <div key={idx} className="flex items-center gap-1 bg-white/80 rounded-lg px-2 py-1 border border-amber-200">
                                                <input
                                                    type="text"
                                                    value={color}
                                                    onChange={(e) => handleArrayFieldChange('colors', idx, e.target.value)}
                                                    className="w-16 text-xs border-none outline-none bg-transparent"
                                                />
                                                <button
                                                    onClick={() => handleRemoveArrayItem('colors', idx)}
                                                    className="text-amber-600 hover:text-red-600"
                                                >
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => handleAddArrayItem('colors', '')}
                                            className="text-xs text-amber-700 hover:text-amber-900 px-2 py-1 border border-dashed border-amber-300 rounded-lg"
                                        >
                                            + Thêm
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* DỊP SỬ DỤNG & PHONG CÁCH */}
                            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                                        <Heart className="text-pink-600" size={18} />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900">Mẫu này phù hợp với</h3>
                                </div>

                                <div className="space-y-3">
                                    {/* Occasions */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Dịp sử dụng</label>
                                        <div className="space-y-2">
                                            {(editedResult.occasions || []).map((occasion, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={occasion}
                                                        onChange={(e) => handleArrayFieldChange('occasions', idx, e.target.value)}
                                                        className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                                                    />
                                                    <button
                                                        onClick={() => handleRemoveArrayItem('occasions', idx)}
                                                        className="text-gray-400 hover:text-red-600"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => handleAddArrayItem('occasions', '')}
                                                className="text-xs text-pink-600 hover:text-pink-800"
                                            >
                                                + Thêm dịp sử dụng
                                            </button>
                                        </div>
                                    </div>

                                    {/* Customer Styles */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Phong cách khách hàng</label>
                                        <div className="space-y-2">
                                            {(editedResult.customerStyles || []).map((style, idx) => (
                                                <div key={idx} className="flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={style}
                                                        onChange={(e) => handleArrayFieldChange('customerStyles', idx, e.target.value)}
                                                        className="flex-1 p-2 border rounded-lg text-sm focus:ring-2 focus:ring-pink-500 outline-none"
                                                    />
                                                    <button
                                                        onClick={() => handleRemoveArrayItem('customerStyles', idx)}
                                                        className="text-gray-400 hover:text-red-600"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => handleAddArrayItem('customerStyles', '')}
                                                className="text-xs text-pink-600 hover:text-pink-800"
                                            >
                                                + Thêm phong cách
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* HƯỚNG DẪN BẢO QUẢN */}
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center shadow-sm">
                                        <Shield className="text-white" size={18} />
                                    </div>
                                    <h3 className="text-base font-bold text-green-900">Gợi ý bảo quản</h3>
                                </div>

                                <div className="space-y-2">
                                    {(editedResult.careInstructions || []).map((instruction, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                            <span className="text-green-500 text-sm">•</span>
                                            <input
                                                type="text"
                                                value={instruction}
                                                onChange={(e) => handleArrayFieldChange('careInstructions', idx, e.target.value)}
                                                className="flex-1 p-2 border border-green-200 rounded-lg text-sm focus:ring-2 focus:ring-green-500 outline-none bg-white/70"
                                            />
                                            <button
                                                onClick={() => handleRemoveArrayItem('careInstructions', idx)}
                                                className="text-gray-400 hover:text-red-600"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        onClick={() => handleAddArrayItem('careInstructions', '')}
                                        className="text-xs text-green-700 hover:text-green-900"
                                    >
                                        + Thêm hướng dẫn
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 bg-white border-t px-6 py-4 flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                        {isEditing && <span className="text-amber-600 font-medium">⚠️ Có thay đổi chưa được lưu</span>}
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader className="animate-spin" size={18} />
                                    Đang lưu...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    {isEditing ? 'Lưu thay đổi' : 'Xác nhận & Lưu'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
