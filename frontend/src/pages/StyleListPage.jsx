import { useState, useEffect } from "react";
import ProductForm from "../components/products/ProductForm";
import ProductService from "../services/productService";
import StyleModal from "../components/StyleModal";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&auto=format&fit=crop&q=80";

export default function StyleListPage() {
  const [styles, setStyles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch data on mount
  useEffect(() => {
    fetchStyles();
  }, []);

  const fetchStyles = async () => {
    try {
      setLoading(true);
      const response = await ProductService.list();
      const data = ProductService.parseResponse(response);
      // Ensure data is array (handle pagination structure if needed)
      const list = Array.isArray(data) ? data : data?.content || [];
      setStyles(list);
    } catch (error) {
      console.error("Error fetching styles:", error);
    } finally {
      setLoading(false);
    }
  };

  const openView = (item) => setSelected(item);
  const openEdit = (item) => setEditItem(item);

  const handleSave = async (formData) => {
    try {
      if (formData.id) {
        // Update
        await ProductService.update(formData.key, formData);
        alert("Cập nhật thành công!");
      } else {
        // Create
        await ProductService.create(formData);
        alert("Tạo mới thành công!");
      }
      // Refresh list
      fetchStyles();
      setShowAdd(false);
      setEditItem(null);
    } catch (error) {
      console.error("Error saving style:", error);
      alert("Lỗi khi lưu: " + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (key) => {
    if (confirm("Bạn chắc muốn xóa mẫu này?")) {
      try {
        await ProductService.delete(key);
        fetchStyles();
      } catch (error) {
        console.error("Error deleting style:", error);
        alert("Lỗi khi xóa: " + (error.response?.data?.message || error.message));
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-gray-400">
            Thư viện mẫu (Real API)
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
            Quản lý Sản phẩm & Mẫu thiết kế
          </h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center justify-center px-4 py-2 text-sm md:text-base bg-emerald-700 text-white rounded-lg shadow hover:bg-emerald-800 transition w-full sm:w-auto font-medium"
        >
          + Thêm sản phẩm mới
        </button>
      </div>

      {/* GRID CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {styles.map((item) => (
          <div
            key={item.id}
            className="group rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:border-emerald-200 transition overflow-hidden flex flex-col"
          >
            <div className="relative h-56 w-full bg-gray-100 overflow-hidden">
              <img
                src={item.image || (item.media && item.media.thumbnail) || FALLBACK_IMAGE}
                alt={item.name}
                className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
              <div className="absolute bottom-3 left-3 text-white">
                <p className="text-xs font-light opacity-90">{item.category}</p>
                <p className="font-semibold truncate w-48">{item.name}</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="bg-emerald-50 text-emerald-800 text-xs px-2 py-1 rounded font-medium">
                  {item.type || 'Mặc định'}
                </div>
                <div className="font-bold text-gray-900">
                  {Number(item.price ? (item.pricing ? item.pricing.basePrice : item.price) : 0).toLocaleString()} đ
                </div>
              </div>

              {/* Specs Summary if available */}
              {item.specifications && (
                <div className="mt-2 space-y-1 text-xs text-gray-500 border-t pt-2">
                  <div className="flex justify-between">
                    <span>Thời gian may:</span>
                    <span className="font-medium text-gray-700">{item.specifications.tailoringTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bảo hành:</span>
                    <span className="font-medium text-gray-700 truncate w-32 text-right">{item.specifications.warranty}</span>
                  </div>
                </div>
              )}

              <div className="mt-auto pt-4 flex gap-2">
                <button
                  onClick={() => openView(item)}
                  className="flex-1 bg-gray-50 text-gray-700 text-xs font-medium py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  Xem
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="flex-1 bg-emerald-50 text-emerald-700 text-xs font-medium py-2 rounded-lg hover:bg-emerald-100 transition"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(item.key)}
                  className="flex-1 bg-red-50 text-red-600 text-xs font-medium py-2 rounded-lg hover:bg-red-100 transition"
                >
                  Xóa
                </button>
              </div>
            </div>
          </div>
        ))}

        {styles.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed">
            Chưa có sản phẩm nào. Hãy tạo sản phẩm mới!
          </div>
        )}
      </div>

      {selected && (
        <StyleModal item={selected} onClose={() => setSelected(null)} />
      )}

      {(showAdd || editItem) && (
        <ProductForm
          item={editItem}
          onClose={() => {
            setShowAdd(false);
            setEditItem(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
