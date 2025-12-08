import { useState, useEffect } from "react";
import { getStyles, saveStyles } from "../utils/styleStorage.js";
import StyleModal from "../components/StyleModal";
import AddEditStyleModal from "../components/AddEditStyleModal";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=800&auto=format&fit=crop&q=80";

export default function StyleListPage() {
  const [styles, setStyles] = useState(() => getStyles());
  const [selected, setSelected] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const openView = (item) => setSelected(item);
  const openEdit = (item) => setEditItem(item);

  const handleSave = (newStyle) => {
    let updated;
    if (newStyle.id) {
      updated = styles.map((s) => (s.id === newStyle.id ? newStyle : s));
    } else {
      updated = [...styles, { ...newStyle, id: Date.now() }];
    }
    setStyles(updated);
    saveStyles(updated);
    setShowAdd(false);
    setEditItem(null);
  };

  const handleDelete = (id) => {
    if (confirm("Bạn chắc muốn xóa mẫu này?")) {
      const updated = styles.filter((s) => s.id !== id);
      setStyles(updated);
      saveStyles(updated);
    }
  };

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-gray-400">
            Thư viện mẫu
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-800">
            Mẫu thiết kế đang sử dụng tại tiệm
          </h1>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center justify-center px-3 py-2 text-sm md:text-base bg-green-700 text-white rounded-lg shadow hover:bg-green-800 transition w-full sm:w-auto"
        >
          + Thêm mẫu
        </button>
      </div>

      {/* GRID CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {styles.map((item) => (
          <div
            key={item.id}
            className="group rounded-2xl border border-emerald-100 bg-gradient-to-b from-white to-emerald-50/70 shadow-sm hover:shadow-xl hover:border-emerald-300 transition overflow-hidden flex flex-col"
          >
            <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
              <img
                src={item.image || FALLBACK_IMAGE}
                alt={item.name}
                className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
              <div className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/50 to-transparent" />
            </div>

            <div className="flex-1 flex flex-col p-3 md:p-4">
              <div className="font-semibold text-gray-800 line-clamp-2">
                {item.name}
              </div>
              <div className="text-xs md:text-sm text-emerald-700 mt-0.5">
                {item.category}
              </div>

              <div className="mt-2 text-sm md:text-base font-bold text-emerald-800">
              {item.price.toLocaleString()} đ
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => openView(item)}
                  className="flex-1 rounded-full border border-sky-500 text-sky-600 text-xs md:text-sm py-1.5 hover:bg-sky-500 hover:text-white transition"
              >
                Xem
              </button>
              <button
                onClick={() => openEdit(item)}
                  className="flex-1 rounded-full border border-amber-400 text-amber-700 text-xs md:text-sm py-1.5 hover:bg-amber-400 hover:text-white transition"
              >
                Sửa
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                  className="flex-1 rounded-full border border-red-400 text-red-600 text-xs md:text-sm py-1.5 hover:bg-red-500 hover:text-white transition"
              >
                Xóa
              </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <StyleModal item={selected} onClose={() => setSelected(null)} />
      )}

      {(showAdd || editItem) && (
        <AddEditStyleModal
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
