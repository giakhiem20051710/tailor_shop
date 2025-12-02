import { useMemo, useState, useEffect } from "react";
import { getFabricHolds } from "../utils/fabricHoldStorage.js";

const formatDateTime = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN");
  } catch {
    return iso;
  }
};

const METHOD_LABEL = {
  hold: "Đặt giữ cuộn vải",
  visit: "Hẹn xem vải",
};

export default function FabricRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [filterType, setFilterType] = useState("all");

  useEffect(() => {
    setRequests(getFabricHolds());
  }, []);

  const filtered = useMemo(() => {
    return requests.filter((r) =>
      filterType === "all" ? true : r.type === filterType
    );
  }, [requests, filterType]);

  const stats = useMemo(() => {
    const total = requests.length;
    const holds = requests.filter((r) => r.type === "hold").length;
    const visits = requests.filter((r) => r.type === "visit").length;
    return { total, holds, visits };
  }, [requests]);

  return (
    <div className="min-h-screen bg-green-900/5 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-green-700">
              Vải & Booking
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Yêu cầu xem vải & giữ cuộn vải
            </h1>
            <p className="text-sm text-slate-600 max-w-xl">
              Dùng màn hình này để chuẩn bị vải trước khi khách đến và
              kiểm soát các cuộn đang được giữ.
            </p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard label="Tổng yêu cầu" value={stats.total} />
          <StatCard label="Đặt giữ vải" value={stats.holds} />
          <StatCard label="Hẹn xem vải" value={stats.visits} />
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-600">Loại yêu cầu:</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-1.5 rounded-full border border-slate-200 text-sm"
              >
                <option value="all">Tất cả</option>
                <option value="hold">Đặt giữ cuộn vải</option>
                <option value="visit">Hẹn xem vải</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Thời gian</th>
                  <th className="px-3 py-2 text-left">Khách hàng</th>
                  <th className="px-3 py-2 text-left">Loại</th>
                  <th className="px-3 py-2 text-left">Vải</th>
                  <th className="px-3 py-2 text-left">Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length ? (
                  filtered.map((req) => (
                    <tr
                      key={`${req.type}-${req.key}-${req.createdAt}`}
                      className="border-b border-slate-100 last:border-0"
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        {formatDateTime(req.createdAt)}
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-900">
                          {req.customerName || "Khách lẻ"}
                        </p>
                        {req.customerPhone && (
                          <p className="text-xs text-slate-500">
                            {req.customerPhone}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                            req.type === "hold"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {METHOD_LABEL[req.type] || req.type}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-900">
                          {req.name}
                        </p>
                        <p className="text-xs text-slate-500">{req.tag}</p>
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">
                        Giá tham khảo: {req.price}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-slate-500"
                    >
                      Hiện chưa có yêu cầu nào từ khách hàng.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}


