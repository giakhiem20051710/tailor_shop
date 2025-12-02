import { useState } from "react";

export default function AddEditStyleModal({ item, onClose, onSave }) {
  const [name, setName] = useState(item?.name || "");
  const [category, setCategory] = useState(item?.category || "");
  const [price, setPrice] = useState(item?.price || "");
  const [image, setImage] = useState(item?.image || "");
  const [preview, setPreview] = useState(item?.image || "");

  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const link = URL.createObjectURL(file);
    setPreview(link);
    setImage(link);
  };

  const handleSubmit = () => {
    onSave({
      id: item?.id,
      name,
      category,
      price: Number(price),
      image: preview,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-96 shadow-xl">
        <h2 className="text-xl font-semibold">
          {item ? "Chỉnh sửa mẫu" : "Thêm mẫu mới"}
        </h2>

        <div className="mt-3 space-y-3">
          <input
            className="w-full p-2 border rounded"
            placeholder="Tên mẫu"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <input
            className="w-full p-2 border rounded"
            placeholder="Loại (Vest, Áo dài...)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <input
            className="w-full p-2 border rounded"
            placeholder="Giá"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <div>
            <p className="text-sm text-gray-600 mb-1">Ảnh mẫu</p>
            <input type="file" onChange={handleUpload} />
          </div>

          {preview && (
            <img src={preview} className="w-full rounded-lg shadow mt-2" />
          )}
        </div>

        <button
          onClick={handleSubmit}
          className="mt-5 w-full bg-green-700 text-white p-2 rounded"
        >
          Lưu
        </button>

        <button
          onClick={onClose}
          className="mt-2 w-full bg-gray-200 p-2 rounded"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
