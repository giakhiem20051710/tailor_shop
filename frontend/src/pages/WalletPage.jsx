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

const mapTransactionType = (type) => {
  const map = {
    EARN: "Nhận xu",
    SPEND: "Đã dùng",
    EXPIRED: "Hết hạn",
  };
  return map[type] || type || "";
};

export default function WalletPage() {
  const navigate = useNavigate();
  usePageMeta({
    title: "Ví xu - My Hiền Tailor",
    description: "Quản lý xu, lịch sử giao dịch và ưu đãi",
  });

  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    fetchWallet();
    fetchTransactions(0, true);
  }, []);

  const fetchWallet = async () => {
    try {
      setLoadingWallet(true);
      const data = await pointsService.getWallet();
      setWallet(data || null);
    } catch (error) {
      console.error("Failed to load wallet:", error);
      showError("Không thể tải ví xu. Vui lòng thử lại.");
    } finally {
      setLoadingWallet(false);
    }
  };

  const fetchTransactions = async (pageIndex, reset = false) => {
    try {
      setLoadingTx(true);
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
      setLoadingTx(false);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || loadingTx) return;
    fetchTransactions(page + 1, false);
  };

  const balance = wallet?.balance || 0;
  const valueInVnd = wallet?.valueInVnd ?? pointsService.pointsToVnd(balance);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      <Header currentPage="/customer/wallet" />

      <main className="pt-[180px] pb-16 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">💎 Ví Xu của bạn</h1>
              <p className="text-slate-500 mt-1">Tích xu, đổi quà và theo dõi lịch sử giao dịch</p>
            </div>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => navigate("/customer/transactions")}
              >
                Lịch sử
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => navigate("/checkin")}
              >
                Điểm danh
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                onClick={() => navigate("/S")}
              >
                Thử thách
              </button>
            </div>
          </section>

          {/* Wallet Summary */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm">Số dư xu</p>
              {loadingWallet ? (
                <div className="h-8 w-28 bg-slate-100 rounded animate-pulse mt-2" />
              ) : (
                <div className="mt-2">
                  <p className="text-3xl font-bold text-indigo-600">{balance.toLocaleString()} xu</p>
                  <p className="text-slate-500 text-sm mt-1">≈ {valueInVnd.toLocaleString()}đ</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm">Tổng tích lũy</p>
              {loadingWallet ? (
                <div className="h-8 w-28 bg-slate-100 rounded animate-pulse mt-2" />
              ) : (
                <p className="text-2xl font-bold text-emerald-600 mt-2">
                  {Number(wallet?.totalEarned || 0).toLocaleString()} xu
                </p>
              )}
              <p className="text-slate-400 text-xs mt-2">Tổng xu đã nhận</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <p className="text-slate-500 text-sm">Tổng đã dùng</p>
              {loadingWallet ? (
                <div className="h-8 w-28 bg-slate-100 rounded animate-pulse mt-2" />
              ) : (
                <p className="text-2xl font-bold text-rose-600 mt-2">
                  {Number(wallet?.totalSpent || 0).toLocaleString()} xu
                </p>
              )}
              <p className="text-slate-400 text-xs mt-2">Tổng xu đã đổi</p>
            </div>
          </section>

          {/* Expiring Points */}
          {wallet?.expiringPoints > 0 && (
            <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <p className="font-semibold text-amber-800">
                    {wallet.expiringPoints.toLocaleString()} xu sắp hết hạn
                  </p>
                  <p className="text-amber-700 text-sm">
                    Hết hạn sau {wallet.expiringInDays || 0} ngày. Hãy sử dụng sớm để không bị mất!
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Transactions */}
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-slate-800">Lịch sử giao dịch</h2>
              <button
                className="text-sm text-indigo-600 hover:text-indigo-700"
                onClick={() => fetchTransactions(0, true)}
              >
                Làm mới
              </button>
            </div>

            {loadingTx && transactions.length === 0 ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-500">Chưa có giao dịch nào</p>
                <button
                  className="mt-3 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={() => navigate("/checkin")}
                >
                  Điểm danh nhận xu
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
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
                        <p className="font-semibold text-slate-800">{mapTransactionType(tx.transactionType)}</p>
                        <p className="text-sm text-slate-500">
                          {tx.description || tx.source || "Giao dịch xu"}
                        </p>
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
                      onClick={handleLoadMore}
                      disabled={loadingTx}
                    >
                      {loadingTx ? "Đang tải..." : "Tải thêm"}
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
