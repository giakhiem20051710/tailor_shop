export default function StyleModal({ item, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-96 shadow-xl animate-fade">
        <h2 className="text-xl font-semibold">{item.name}</h2>
        <img
          src={item.image}
          className="w-full mt-3 rounded-xl shadow"
        />

        <p className="mt-3 text-gray-600">{item.category}</p>
        <p className="text-green-700 font-bold text-lg mt-1">
          {item.price.toLocaleString()} đ
        </p>

        <button
          onClick={onClose}
          className="mt-5 w-full bg-gray-200 p-2 rounded hover:bg-gray-300"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}
