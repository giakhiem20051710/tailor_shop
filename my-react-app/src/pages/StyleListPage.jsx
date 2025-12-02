import { useState } from "react";
import stylesData from "../data/styles";
import StyleModal from "../components/StyleModal";
import AddEditStyleModal from "../components/AddEditStyleModal";

export default function StyleListPage() {
  const [styles, setStyles] = useState(stylesData);
  const [selected, setSelected] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const openView = (item) => setSelected(item);
  const openEdit = (item) => setEditItem(item);

  const handleSave = (newStyle) => {
    if (newStyle.id) {
      // EDIT
      setStyles(
        styles.map((s) => (s.id === newStyle.id ? newStyle : s))
      );
    } else {
      // ADD
      newStyle.id = Date.now();
      setStyles([...styles, newStyle]);
    }
    setShowAdd(false);
    setEditItem(null);
  };

  const handleDelete = (id) => {
    if (confirm("Bạn chắc muốn xóa mẫu này?"))
      setStyles(styles.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-700">Mẫu thiết kế</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-green-700 text-white rounded-lg"
        >
          + Thêm mẫu
        </button>
      </div>

      {/* GRID CARD */}
      <div className="grid grid-cols-4 gap-6">
        {styles.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl shadow p-3 border hover:shadow-lg transition"
          >
            <img
              src={item.image}
              className="h-48 w-full object-cover rounded-lg"
            />

            <div className="mt-3 font-semibold text-gray-700">
              {item.name}
            </div>
            <div className="text-sm text-gray-500">{item.category}</div>

            <div className="text-green-700 font-bold mt-1">
              {item.price.toLocaleString()} đ
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => openView(item)}
                className="flex-1 bg-blue-600 text-white p-2 rounded"
              >
                Xem
              </button>
              <button
                onClick={() => openEdit(item)}
                className="flex-1 bg-yellow-500 text-white p-2 rounded"
              >
                Sửa
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="flex-1 bg-red-600 text-white p-2 rounded"
              >
                Xóa
              </button>
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
