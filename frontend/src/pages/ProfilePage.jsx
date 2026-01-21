export default function ProfilePage() {
  return (
    <div className="max-w-3xl mx-auto space-y-10">

      <h1 className="text-3xl font-semibold text-gray-700">Cài đặt tài khoản</h1>

      <div className="bg-white p-8 rounded-3xl shadow border">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="text-gray-500 text-sm">Tên chủ tiệm</label>
            <input className="w-full p-3 border rounded-xl mt-1" value="Lavi" />
          </div>

          <div>
            <label className="text-gray-500 text-sm">Số điện thoại</label>
            <input className="w-full p-3 border rounded-xl mt-1" value="0901234567" />
          </div>

          <div>
            <label className="text-gray-500 text-sm">Email</label>
            <input className="w-full p-3 border rounded-xl mt-1" value="owner@tailor.vn" />
          </div>

          <div>
            <label className="text-gray-500 text-sm">Mật khẩu</label>
            <input type="password" className="w-full p-3 border rounded-xl mt-1" value="******" />
          </div>
        </div>

        <button className="mt-6 px-6 py-3 bg-green-700 text-white rounded-xl">
          Lưu thay đổi
        </button>
      </div>
    </div>
  );
}
