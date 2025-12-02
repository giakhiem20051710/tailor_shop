export default function TailorListPage() {
  const tailors = [
    { id: "T001", name: "Thợ Tuấn", skill: "Vest", phone: "0907777777", active: true },
    { id: "T002", name: "Thợ Hạnh", skill: "Áo dài", phone: "0906666666", active: true },
    { id: "T003", name: "Thợ Nam", skill: "Váy", phone: "0905555555", active: false },
  ];

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-700">Thợ may</h1>

        <button className="px-4 py-2 bg-green-700 text-white rounded-xl hover:bg-green-800">
          + Thêm thợ may
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow border border-gray-200 p-6">
        <table className="w-full">
          <thead>
            <tr className="text-gray-500 text-sm border-b">
              <th className="p-3 text-left">Mã</th>
              <th className="p-3 text-left">Tên</th>
              <th className="p-3 text-left">Kỹ năng</th>
              <th className="p-3 text-left">SĐT</th>
              <th className="p-3 text-left">Trạng thái</th>
              <th className="p-3 text-center">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {tailors.map((t) => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{t.id}</td>
                <td className="p-3">{t.name}</td>
                <td className="p-3">{t.skill}</td>
                <td className="p-3">{t.phone}</td>
                <td className="p-3">
                  {t.active ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      Đang làm
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs">
                      Nghỉ
                    </span>
                  )}
                </td>
                <td className="p-3 flex justify-center gap-2">
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
