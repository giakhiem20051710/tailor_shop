import { useState, useEffect } from "react";
import { Edit, Save, X, Plus, Loader } from "lucide-react";
import categoryTemplateService from "../services/categoryTemplateService";
import TagInput from "../components/common/TagInput";

export default function CategoryTemplatePage() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const data = await categoryTemplateService.getAll();
            setTemplates(data || []);
        } catch (error) {
            console.error("Failed to load templates", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (editingTemplate.id) {
                await categoryTemplateService.update(editingTemplate.id, editingTemplate);
            } else {
                await categoryTemplateService.create(editingTemplate);
            }
            setEditingTemplate(null);
            fetchTemplates();
        } catch (error) {
            alert("Failed to save template");
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Template Danh mục</h1>
                    <p className="text-gray-500">Cấu hình thông số mặc định cho từng loại sản phẩm</p>
                </div>
                <button
                    onClick={() => setEditingTemplate({})}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800"
                >
                    <Plus size={18} /> Thêm mới
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-10"><Loader className="animate-spin text-emerald-700" /></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b text-gray-600 font-medium text-sm uppercase">
                            <tr>
                                <th className="p-4">Tên danh mục</th>
                                <th className="p-4">Mã (Code)</th>
                                <th className="p-4">Thời gian may</th>
                                <th className="p-4">Bảo hành</th>
                                <th className="p-4 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {templates.map((t) => (
                                <tr key={t.id} className="hover:bg-gray-50">
                                    <td className="p-4 font-medium text-gray-900">{t.categoryName}</td>
                                    <td className="p-4 text-gray-500 font-mono text-sm">{t.categoryCode}</td>
                                    <td className="p-4">{t.tailoringTime}</td>
                                    <td className="p-4">{t.warranty}</td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => setEditingTemplate(t)}
                                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                                        >
                                            <Edit size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {templates.length === 0 && (
                        <div className="p-8 text-center text-gray-500">Chưa có template nào.</div>
                    )}
                </div>
            )}

            {/* Edit Modal */}
            {editingTemplate && (
                <TemplateModal
                    template={editingTemplate}
                    onClose={() => setEditingTemplate(null)}
                    onSave={handleSave}
                    onChange={(field, val) => setEditingTemplate(prev => ({ ...prev, [field]: val }))}
                />
            )}
        </div>
    );
}

import { createPortal } from "react-dom";

function TemplateModal({ template, onClose, onSave, onChange }) {
    return createPortal(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b flex justify-between items-center sticky top-0 bg-white rounded-t-xl z-10">
                    <h2 className="text-xl font-bold">
                        {template.id ? `Chỉnh sửa: ${template.categoryName}` : "Tạo Template Mới"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg"><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Tên danh mục *</label>
                            <input
                                value={template.categoryName || ""}
                                onChange={e => onChange("categoryName", e.target.value)}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Mã code (Unique) *</label>
                            <input
                                value={template.categoryCode || ""}
                                onChange={e => onChange("categoryCode", e.target.value)}
                                className="w-full p-2 border rounded-lg bg-gray-50"
                                disabled={!!template.id} // Disable code edit on update
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Thời gian may</label>
                            <input
                                value={template.tailoringTime || ""}
                                onChange={e => onChange("tailoringTime", e.target.value)}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Số lần thử</label>
                            <input
                                value={template.fittingCount || ""}
                                onChange={e => onChange("fittingCount", e.target.value)}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Bảo hành</label>
                            <input
                                value={template.warranty || ""}
                                onChange={e => onChange("warranty", e.target.value)}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium mb-1">Form dáng (Silhouette)</label>
                            <input
                                value={template.silhouette || ""}
                                onChange={e => onChange("silhouette", e.target.value)}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="space-y-4 pt-4 border-t">
                        <TagInput
                            label="Chất liệu gợi ý"
                            value={template.materials || []}
                            onChange={v => onChange("materials", v)}
                        />
                        <TagInput
                            label="Màu sắc phổ biến"
                            value={template.colors || []}
                            onChange={v => onChange("colors", v)}
                        />
                        <TagInput
                            label="Dịp sử dụng"
                            value={template.occasions || []}
                            onChange={v => onChange("occasions", v)}
                        />
                        <TagInput
                            label="Gợi ý phong cách khách hàng"
                            value={template.customerStyles || []}
                            onChange={v => onChange("customerStyles", v)}
                        />
                        <TagInput
                            label="Hướng dẫn bảo quản"
                            value={template.careInstructions || []}
                            onChange={v => onChange("careInstructions", v)}
                        />
                    </div>
                </div>

                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3 sticky bottom-0">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg">Hủy</button>
                    <button onClick={onSave} className="px-6 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 font-medium shadow-sm">
                        Lưu thay đổi
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
