import { createPortal } from "react-dom";

export default function StyleModal({ item, onClose }) {
  return createPortal(
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-200">
      <div className="bg-white p-6 rounded-xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
        <h2 className="text-xl font-semibold text-gray-800">{item.name}</h2>
        <div className="aspect-[3/4] rounded-lg overflow-hidden mt-3 bg-gray-100">
          <img
            src={item.image}
            className="w-full h-full object-cover"
          />
        </div>

        <p className="mt-3 text-sm font-medium text-gray-500 uppercase tracking-widest">{item.category}</p>
        <p className="text-emerald-700 font-bold text-xl mt-1">
          {Number(item.price).toLocaleString()} đ
        </p>

        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-100 text-gray-700 font-medium py-3 rounded-lg hover:bg-gray-200 transition"
        >
          Đóng
        </button>
      </div>
    </div>,
    document.body
  );
}
