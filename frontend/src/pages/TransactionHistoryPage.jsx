import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import usePageMeta from "../hooks/usePageMeta";
import pointsService from "../services/pointsService.js";
import { isAuthenticated } from "../utils/authStorage.js";
import { showError } from "../components/NotificationToast.jsx";

const PAGE_SIZE = 20;

const formatDate = (value) => {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const typeLabel = (type) => {
  const map = {
    EARN: "Nhận xu",
    SPEND: "Đã dùng",
    EXPIRED: "Hết hạn",
  };
  return map[type] || type || "";
};

export default function TransactionHistoryPage() {
  const navigate = useNavigate();
  usePageMeta({
    title: "Lịch sử giao dịch xu - My Hiền Tailor",
    description: "Theo dõi các giao dịch xu của bạn",
  });

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState("ALL");

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    fetchTransactions(0, true);
  }, []);

  const fetchTransactions = async (pageIndex, reset = false) => {
    try {
      setLoading(true);
      const data = await pointsService.getTransactions({ page: pageIndex, size: PAGE_SIZE });
      const list = Array.isArray(data)
        ? data
        : data?.content || data?.data || [];

      setTransactions((prev) => (reset ? list : [...prev, ...list]));
      setPage(pageIndex);
      setHasMore(list.length === PAGE_SIZE);
    } catch (error) {
      console.error("Failed to load transactions:", error);
      showError("Không thể tải lịch sử giao dịch.");
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = filterType === "ALL"
    ? transactions
    : transactions.filter((tx) => tx.transactionType === filterType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <Header currentPage="/customer/transactions" />

      <main className="pt-[180px] pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header */}
          <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">📜 Lịch sử giao dịch</h1>
              <p className="text-slate-500 mt-1">Theo dõi các giao dịch xu của bạn</p>
            </div>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => navigate("/customer/wallet")}
              >
                Quay lại ví xu
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={() => fetchTransactions(0, true)}
              >
                Làm mới
              </button>
            </div>
          </section>

          {/* Filters */}
          <section className="flex flex-wrap gap-2">
            {[
              { label: "Tất cả", value: "ALL" },
              { label: "Nhận xu", value: "EARN" },
              { label: "Đã dùng", value: "SPEND" },
              { label: "Hết hạn", value: "EXPIRED" },
            ].map((item) => (
              <button
                key={item.value}
                className={`px-3 py-1.5 rounded-full text-sm border ${filterType === item.value
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                onClick={() => setFilterType(item.value)}
              >
                {item.label}
              </button>
            ))}
          </section>

          {/* List */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            {loading && transactions.length === 0 ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                Chưa có giao dịch nào
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTransactions.map((tx) => (
                  <div
                    key={tx.id || `${tx.source}-${tx.createdAt}`}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 p-4 rounded-xl border border-slate-100 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${tx.transactionType === "SPEND"
                            ? "bg-rose-100 text-rose-600"
                            : tx.transactionType === "EXPIRED"
                              ? "bg-amber-100 text-amber-600"
                              : "bg-emerald-100 text-emerald-600"
                          }`}
                      >
                        {tx.transactionType === "SPEND" ? "💸" : tx.transactionType === "EXPIRED" ? "⏰" : "💰"}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{typeLabel(tx.transactionType)}</p>
                        <p className="text-sm text-slate-500">
                          {tx.description || tx.source || "Giao dịch xu"}
                        </p>
                        {tx.expiresAt && (
                          <p className="text-xs text-amber-600">
                            Hết hạn: {formatDate(tx.expiresAt)}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${tx.transactionType === "SPEND"
                            ? "text-rose-600"
                            : tx.transactionType === "EXPIRED"
                              ? "text-amber-600"
                              : "text-emerald-600"
                          }`}
                      >
                        {tx.transactionType === "SPEND" || tx.transactionType === "EXPIRED" ? "-" : "+"}
                        {Math.abs(tx.amount || 0).toLocaleString()} xu
                      </p>
                      <p className="text-xs text-slate-400">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                ))}

                {hasMore && (
                  <div className="pt-2">
                    <button
                      className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                      onClick={() => fetchTransactions(page + 1, false)}
                      disabled={loading}
                    >
                      {loading ? "Đang tải..." : "Tải thêm"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
