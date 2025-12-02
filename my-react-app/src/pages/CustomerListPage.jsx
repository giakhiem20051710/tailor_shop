export default function CustomerListPage() {
  const customers = [
    { id: "C001", name: "Nguyễn Văn A", phone: "0901234567", orders: 5, last: "2025-11-20" },
    { id: "C002", name: "Trần Thị B", phone: "0908888888", orders: 3, last: "2025-11-28" },
    { id: "C003", name: "Lê Văn C", phone: "0933333333", orders: 1, last: "2025-10-15" },
  ];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-700">Khách hàng</h1>

        <button className="px-4 py-2 bg-green-700 text-white rounded-xl hover:bg-green-800">
          + Thêm khách hàng
        </button>
      </div>

      {/* FILTER */}
      <div className="bg-white p-6 rounded-3xl shadow border border-gray-200">
        <input
          type="text"
          placeholder="Tìm theo tên hoặc SĐT..."
          className="w-full p-3 border rounded-xl"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-3xl shadow border border-gray-200 p-6">
        <table className="w-full">
          <thead>
            <tr className="text-gray-500 text-sm border-b">
              <th className="p-3 text-left">Mã KH</th>
              <th className="p-3 text-left">Tên</th>
              <th className="p-3 text-left">Số điện thoại</th>
              <th className="p-3 text-left">Số đơn</th>
              <th className="p-3 text-left">Lần cuối giao dịch</th>
              <th className="p-3 text-center w-32">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{c.id}</td>
                <td className="p-3">{c.name}</td>
                <td className="p-3">{c.phone}</td>
                <td className="p-3">{c.orders}</td>
                <td className="p-3">{c.last}</td>
                <td className="p-3 text-center flex gap-2 justify-center">
                  <button className="p-2 bg-blue-500 text-white rounded">✎</button>
                  <button className="p-2 bg-red-500 text-white rounded">🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
