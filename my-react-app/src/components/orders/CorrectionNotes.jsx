import { useState } from "react";
import { updateOrder } from "../../utils/orderStorage";

export default function CorrectionNotes({ order, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(order?.correctionNotes || "");

  const handleSave = () => {
    if (!order) return;
    
    const updated = updateOrder(order.id, { correctionNotes: note });
    if (updated && onUpdate) {
      onUpdate(updated);
    }
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <label className="text-sm text-gray-500 block mb-2">Ghi chú sửa lại</label>
            {order?.correctionNotes ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-gray-700 whitespace-pre-wrap">{order.correctionNotes}</p>
              </div>
            ) : (
              <p className="text-gray-400">Chưa có ghi chú sửa lại</p>
            )}
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition text-sm"
          >
            {order?.correctionNotes ? "Sửa" : "Thêm ghi chú"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      <div>
        <label className="text-sm text-gray-500 block mb-2">Ghi chú sửa lại</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ví dụ: Sửa eo, lên lai 2cm, rộng vai 1cm..."
          className="w-full p-3 border rounded-lg focus:ring-yellow-500 h-32"
        />
        <p className="text-xs text-gray-400 mt-1">
          Ghi chú các thay đổi cần thiết sau khi khách thử đồ
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
        >
          Lưu
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setNote(order?.correctionNotes || "");
          }}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}

