import { useEffect, useMemo, useState } from "react";
import { initializeDefaultInvoices } from "../utils/invoiceStorage";

const METHOD_LABELS = {
  BANK: "Ngân hàng",
  MOMO: "Ví MoMo",
  CASH: "Tiền mặt",
};

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")} đ`;

export default function TransactionManagementPage() {
  const [invoices, setInvoices] = useState([]);
  const [methodFilter, setMethodFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const data = initializeDefaultInvoices();
    setInvoices(data);
  }, []);

  const allTransactions = useMemo(() => {
    return invoices
      .flatMap((inv) =>
        (inv.transactions || []).map((tx) => ({
          ...tx,
          invoiceId: inv.id,
          customerName: inv.customerName,
          phone: inv.phone,
        }))
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt || "").getTime() -
          new Date(a.createdAt || "").getTime()
      );
  }, [invoices]);

  const filteredTransactions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allTransactions.filter((tx) => {
      const methodMatch =
        methodFilter === "all" ? true : tx.method === methodFilter;
      const searchMatch = term
        ? tx.customerName.toLowerCase().includes(term) ||
          tx.phone.includes(term) ||
          (tx.reference || "").toLowerCase().includes(term) ||
          (tx.invoiceId || "").toLowerCase().includes(term)
        : true;
      return methodMatch && searchMatch;
    });
  }, [allTransactions, methodFilter, searchTerm]);

  const stats = useMemo(() => {
    const totalAmount = filteredTransactions.reduce(
      (sum, tx) => sum + (Number(tx.amount) || 0),
      0
    );
    const momoCount = filteredTransactions.filter((tx) => tx.method === "MOMO")
      .length;
    const bankCount = filteredTransactions.filter((tx) => tx.method === "BANK")
      .length;
    const lastPayment = filteredTransactions[0]?.createdAt || "—";
    return {
      totalTx: filteredTransactions.length,
      totalAmount,
      momoCount,
      bankCount,
      lastPayment,
    };
  }, [filteredTransactions]);

  return (
    <div className="min-h-screen bg-[#F7F5F0] py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#AD7A2A]">
              Quản lý giao dịch
            </p>
            <h1 className="text-3xl font-semibold text-[#1F2A37]">
              Customer Transactions
            </h1>
            <p className="text-sm text-[#6B7280]">
              Theo dõi tất cả giao dịch thanh toán của khách hàng theo thời
              gian thực.
            </p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-4">
          <MiniStat label="Số giao dịch" value={stats.totalTx} />
          <MiniStat
            label="Tổng tiền"
            value={formatCurrency(stats.totalAmount)}
            accent="from-emerald-500 to-emerald-600"
          />
          <MiniStat
            label="Bank / MoMo"
            value={`${stats.bankCount} / ${stats.momoCount}`}
            accent="from-sky-500 to-blue-600"
          />
          <MiniStat label="Thanh toán mới nhất" value={stats.lastPayment} />
        </section>

        <section className="bg-white rounded-3xl border border-[#ECE7DD] p-6 space-y-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <label className="text-[#6B7280]">Phương thức</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="px-3 py-2 rounded-full border border-[#E5E7EB] text-sm"
              >
                <option value="all">Tất cả</option>
                <option value="BANK">Ngân hàng</option>
                <option value="MOMO">MoMo</option>
                <option value="CASH">Tiền mặt</option>
              </select>
            </div>
            <div className="flex-1">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo khách hàng, SĐT, hóa đơn hoặc mã tham chiếu..."
                className="w-full px-4 py-2 rounded-full border border-[#E5E7EB] text-sm"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#111827] text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Thời gian</th>
                  <th className="px-4 py-3 text-left">Khách hàng</th>
                  <th className="px-4 py-3 text-left">Hóa đơn</th>
                  <th className="px-4 py-3 text-left">Phương thức</th>
                  <th className="px-4 py-3 text-right">Số tiền</th>
                  <th className="px-4 py-3 text-left">Mã tham chiếu</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length ? (
                  filteredTransactions.map((tx) => (
                    <tr
                      key={tx.id}
                      className="border-b border-[#E5E7EB] last:border-0"
                    >
                      <td className="px-4 py-3">{tx.createdAt}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-[#111827]">
                          {tx.customerName}
                        </p>
                        <p className="text-xs text-[#6B7280]">{tx.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#1F2A37]">
                        {tx.invoiceId}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-3 py-1 rounded-full bg-[#F3F4F6] text-xs font-semibold text-[#111827]">
                          {METHOD_LABELS[tx.method] || tx.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-[#111827]">
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-4 py-3">{tx.reference || "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-6 text-center text-[#6B7280]"
                    >
                      Không có giao dịch nào phù hợp bộ lọc.
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

function MiniStat({ label, value, accent = "from-slate-900 to-slate-800" }) {
  return (
    <div className="rounded-2xl border border-[#ECE7DD] bg-white p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-[#9CA3AF]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-[#111827]">{value}</p>
      <div className={`mt-4 h-2 rounded-full bg-gradient-to-r ${accent}`} />
    </div>
  );
}

