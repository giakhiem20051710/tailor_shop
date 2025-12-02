export default function DeleteConfirmModal({ isOpen, onClose, onConfirm, orderInfo }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 text-center mb-2">
          Xác nhận xóa đơn hàng
        </h2>

        {orderInfo && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Mã đơn:</span> {orderInfo.id}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Khách hàng:</span> {orderInfo.name}
            </p>
          </div>
        )}

        <p className="text-gray-600 text-center mb-6">
          Bạn có chắc chắn muốn xóa đơn hàng này? Hành động này không thể hoàn tác.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

