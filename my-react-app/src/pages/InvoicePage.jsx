import { useEffect, useMemo, useState } from "react";
import invoiceService from "../services/invoiceService";
import promotionService from "../services/promotionService";
import { showSuccess, showError, showWarning, showInfo } from "../components/NotificationToast.jsx";

const bankConfig = {
  bankName: "Vietcombank",
  bankCode: "VCB",
  accountNumber: "0123456789",
  accountName: "CTY TNHH MY HIEN FASHION",
};

const momoConfig = {
  phone: "0901234567",
  owner: "MY HIEN FASHION",
};

// Map backend status to frontend status
const mapBackendStatus = (status) => {
  const statusMap = {
    draft: "pending",
    issued: "pending",
    partial_paid: "processing",
    paid: "paid",
    voided: "pending",
    refunded: "pending",
  };
  return statusMap[status] || "pending";
};

// Map frontend status to backend status
const mapFrontendStatus = (status) => {
  const statusMap = {
    pending: "issued",
    processing: "partial_paid",
    paid: "paid",
  };
  return statusMap[status] || "issued";
};

// Map backend payment provider to frontend method
const mapPaymentProvider = (provider) => {
  const providerMap = {
    vnpay: "BANK",
    momo: "MOMO",
    zalopay: "BANK",
    cash: "CASH",
  };
  return providerMap[provider] || "BANK";
};

// Map frontend method to backend payment provider
const mapPaymentMethod = (method) => {
  const methodMap = {
    BANK: "vnpay",
    MOMO: "momo",
    CASH: "cash",
  };
  return methodMap[method] || "vnpay";
};

const STATUS_META = {
  pending: {
    label: "Chưa thanh toán",
    className: "bg-rose-50 text-rose-600 border border-rose-100",
  },
  processing: {
    label: "Đang thanh toán",
    className: "bg-amber-50 text-amber-600 border border-amber-100",
  },
  paid: {
    label: "Đã thanh toán",
    className: "bg-emerald-50 text-emerald-600 border border-emerald-100",
  },
};

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")} đ`;

const buildVietQRUrl = (amount, transferContent) => {
  const base = `https://img.vietqr.io/image/${bankConfig.bankCode}-${bankConfig.accountNumber}-qr_only.png`;
  const params = new URLSearchParams({
    amount: Math.round(amount || 0),
    addInfo: transferContent,
    accountName: bankConfig.accountName,
  });
  return `${base}?${params.toString()}`;
};

const buildMomoQrUrl = (amount, transferContent) => {
  const deeplink = `https://momo.vn/pay?phone=${momoConfig.phone}&amount=${Math.round(
    amount || 0
  )}&extra=${encodeURIComponent(transferContent)}`;
  return `https://chart.googleapis.com/chart?chs=400x400&cht=qr&chl=${encodeURIComponent(
    deeplink
  )}`;
};


export default function InvoicePage() {
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("BANK");
  const [transactionForm, setTransactionForm] = useState({
    amount: "",
    method: "BANK",
    reference: "",
    note: "",
  });
  const [newInvoice, setNewInvoice] = useState({
    customerName: "",
    phone: "",
    product: "",
    dueDate: "",
    total: "",
    note: "",
    promoCode: "",
    promoDiscount: 0,
  });

  const [loading, setLoading] = useState(true);

  // Load invoices from API
  useEffect(() => {
    const loadInvoices = async () => {
      try {
        setLoading(true);
        console.log('[InvoicePage] Loading invoices from API...');
        const response = await invoiceService.list({}, { page: 0, size: 100 });
        console.log('[InvoicePage] Raw API response:', response);
        console.log('[InvoicePage] Response keys:', Object.keys(response || {}));
        
        // Backend trả về CommonResponse<Page<InvoiceResponse>> với cấu trúc:
        // { 
        //   responseStatus: {...}, 
        //   responseData: { 
        //     content: [...],  // Array of InvoiceResponse
        //     totalElements: ...,
        //     totalPages: ...,
        //     ...
        //   } 
        // }
        let invoicesData = [];
        
        // Ưu tiên responseData.content (cấu trúc chuẩn từ CommonResponse)
        if (response?.responseData?.content && Array.isArray(response.responseData.content)) {
          invoicesData = response.responseData.content;
          console.log('[InvoicePage] ✅ Found in responseData.content, count:', invoicesData.length);
        } 
        // Fallback: data.content
        else if (response?.data?.content && Array.isArray(response.data.content)) {
          invoicesData = response.data.content;
          console.log('[InvoicePage] ✅ Found in data.content, count:', invoicesData.length);
        } 
        // Fallback: responseData là Page object trực tiếp
        else if (response?.responseData && Array.isArray(response.responseData)) {
          invoicesData = response.responseData;
          console.log('[InvoicePage] ✅ Found in responseData (direct array), count:', invoicesData.length);
        }
        // Fallback: content trực tiếp
        else if (Array.isArray(response?.content)) {
          invoicesData = response.content;
          console.log('[InvoicePage] ✅ Found in content (direct array), count:', invoicesData.length);
        } 
        // Fallback: data trực tiếp
        else if (Array.isArray(response?.data)) {
          invoicesData = response.data;
          console.log('[InvoicePage] ✅ Found in data (direct array), count:', invoicesData.length);
        } 
        // Fallback: response là array trực tiếp
        else if (Array.isArray(response)) {
          invoicesData = response;
          console.log('[InvoicePage] ✅ Response is direct array, count:', invoicesData.length);
        } 
        // Không tìm thấy
        else {
          console.warn('[InvoicePage] ⚠️ Unknown response structure:', response);
          console.warn('[InvoicePage] Response type:', typeof response);
          if (response && typeof response === 'object') {
            console.warn('[InvoicePage] Response keys:', Object.keys(response));
            if (response.responseData) {
              console.warn('[InvoicePage] responseData type:', typeof response.responseData);
              console.warn('[InvoicePage] responseData keys:', Object.keys(response.responseData));
            }
          }
          invoicesData = [];
        }
        
        // Map backend invoices to frontend format
        // Backend InvoiceResponse structure:
        // { id, code, customer: {id, name, phone}, status, total, items: [{name, ...}], transactions: [{provider, amount, ...}], ... }
        const mappedInvoices = Array.isArray(invoicesData) 
          ? invoicesData.map(inv => {
              console.log('[InvoicePage] Mapping invoice:', inv.code || inv.id);
              return {
                id: inv.code || `INV-${inv.id}`,
                customerName: inv.customer?.name || "",
                phone: inv.customer?.phone || "",
                product: inv.items?.[0]?.name || "Dịch vụ may",
                dueDate: inv.dueDate || "",
                total: inv.total ? Number(inv.total) : 0,
                note: inv.notes || "",
                status: mapBackendStatus(inv.status),
                createdAt: inv.createdAt || inv.issuedAt || "",
                transactions: (inv.transactions || []).map(tx => ({
                  id: tx.id,
                  amount: tx.amount ? Number(tx.amount) : 0,
                  method: mapPaymentProvider(tx.provider),
                  reference: tx.providerRef || "",
                  note: "",
                  createdAt: tx.paidAt || tx.createdAt || "",
                })),
                // Store backend data for updates
                _backendId: inv.id,
                _backendData: inv,
              };
            })
          : [];
        
        console.log('[InvoicePage] Mapped invoices count:', mappedInvoices.length);
        if (mappedInvoices.length > 0) {
          console.log('[InvoicePage] First mapped invoice:', mappedInvoices[0]);
        }
        
        setInvoices(mappedInvoices);
        if (mappedInvoices.length > 0) {
          setSelectedInvoiceId(mappedInvoices[0].id);
        }
      } catch (error) {
        console.error("Error loading invoices:", error);
        showError("Không thể tải danh sách hóa đơn");
      } finally {
        setLoading(false);
      }
    };
    loadInvoices();
  }, []);

  const selectedInvoice =
    invoices.find((inv) => inv.id === selectedInvoiceId) || null;

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesStatus =
        filterStatus === "all" ? true : inv.status === filterStatus;
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch = term
        ? inv.id.toLowerCase().includes(term) ||
          inv.customerName.toLowerCase().includes(term) ||
          inv.phone.includes(term)
        : true;
      return matchesStatus && matchesSearch;
    });
  }, [invoices, filterStatus, searchTerm]);

  const stats = useMemo(() => {
    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((inv) => inv.status === "paid").length;
    const outstandingAmount = invoices.reduce((sum, inv) => {
      const paid = (inv.transactions || []).reduce(
        (txSum, tx) => txSum + (Number(tx.amount) || 0),
        0
      );
      const remaining = Math.max((inv.total || 0) - paid, 0);
      return sum + remaining;
    }, 0);
    return { totalInvoices, paidInvoices, outstandingAmount };
  }, [invoices]);

  const handleSelectInvoice = (invoiceId) => {
    setSelectedInvoiceId(invoiceId);
    setTransactionForm({
      amount: "",
      method: "BANK",
      reference: "",
      note: "",
    });
  };

  const handleStartPayment = async () => {
    if (!selectedInvoice) return;
    setPaymentMethod("BANK");
    setShowPaymentModal(true);
    // Status update will be handled when payment is added
  };

  const handleMarkPaid = async () => {
    if (!selectedInvoice || !selectedInvoice._backendId) return;
    
    try {
      setLoading(true);
      // Calculate remaining amount
      const paid = (selectedInvoice.transactions || []).reduce(
        (sum, tx) => sum + (Number(tx.amount) || 0),
        0
      );
      const remainingAmount = Math.max((selectedInvoice.total || 0) - paid, 0);
      
      if (remainingAmount > 0) {
        await invoiceService.addPayment({
          invoiceId: selectedInvoice._backendId,
          provider: mapPaymentMethod(paymentMethod),
          amount: remainingAmount,
          providerRef: `MANUAL_${Date.now()}`,
        });
      }
      
      // Reload invoice detail to get updated status
      const invoiceResponse = await invoiceService.getDetail(selectedInvoice._backendId);
      const invoiceData = invoiceResponse?.data ?? invoiceResponse?.responseData ?? invoiceResponse;
      
      // Update the invoice in the list
      const updatedInvoice = {
        id: invoiceData.code || `INV-${invoiceData.id}`,
        customerName: invoiceData.customer?.name || "",
        phone: invoiceData.customer?.phone || "",
        product: invoiceData.items?.[0]?.name || "",
        dueDate: invoiceData.dueDate || "",
        total: invoiceData.total ? Number(invoiceData.total) : 0,
        note: invoiceData.notes || "",
        status: mapBackendStatus(invoiceData.status),
        createdAt: invoiceData.createdAt || invoiceData.issuedAt || "",
        transactions: (invoiceData.transactions || []).map(tx => ({
          id: tx.id,
          amount: tx.amount ? Number(tx.amount) : 0,
          method: mapPaymentProvider(tx.provider),
          reference: tx.providerRef || "",
          note: "",
          createdAt: tx.paidAt || tx.createdAt || "",
        })),
        _backendId: invoiceData.id,
        _backendData: invoiceData,
      };
      
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === updatedInvoice.id ? updatedInvoice : inv))
      );
      setSelectedInvoiceId(updatedInvoice.id);
      setShowPaymentModal(false);
      showSuccess("Đã cập nhật trạng thái thanh toán thành công!");
    } catch (error) {
      console.error("Error marking invoice as paid:", error);
      showError("Không thể cập nhật trạng thái hóa đơn: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvoice = async (e) => {
    e.preventDefault();
    if (!newInvoice.customerName || !newInvoice.total) {
      showWarning("Vui lòng điền đầy đủ thông tin bắt buộc (Tên khách hàng và Tổng tiền)");
      return;
    }
    
    try {
      setLoading(true);
      const totalAmount = Number(newInvoice.total.toString().replace(/,/g, "")) || 0;
      
      if (totalAmount <= 0) {
        showWarning("Tổng tiền phải lớn hơn 0");
        return;
      }

      // Validate product name
      const productName = newInvoice.product?.trim() || "Dịch vụ may";
      
      // Create invoice via API - match backend InvoiceRequest structure
      const invoiceData = {
        orderId: null, // Manual invoice, no order
        customerId: null, // Will be found/created by backend from phone
        customerName: newInvoice.customerName.trim(),
        customerPhone: newInvoice.phone?.trim() || null,
        staffId: null, // Will use current user from auth
        currency: "VND", // Required by backend
        discountAmount: newInvoice.promoDiscount || 0,
        taxAmount: 0,
        dueDate: newInvoice.dueDate || null,
        promoCode: newInvoice.promoCode?.trim() || null, // Send promo code to backend
        notes: newInvoice.note?.trim() || null,
        items: [{
          name: productName,
          quantity: 1,
          unitPrice: totalAmount,
          discountAmount: 0,
          taxRate: 0
        }]
      };
      
      console.log('[InvoicePage] Creating invoice with data:', invoiceData);
      const response = await invoiceService.create(invoiceData);
      console.log('[InvoicePage] Invoice creation response:', response);
      
      const createdInvoice = response?.data ?? response?.responseData ?? response;
      
      if (!createdInvoice) {
        throw new Error("Không nhận được phản hồi từ server");
      }
      
      // Reload invoices
      const listResponse = await invoiceService.list({}, { page: 0, size: 100 });
      const invoicesData = listResponse?.data?.content || 
                          listResponse?.content || 
                          listResponse?.responseData?.content ||
                          listResponse?.data || 
                          [];
      
      const mappedInvoices = Array.isArray(invoicesData) 
        ? invoicesData.map(inv => ({
            id: inv.code || `INV-${inv.id}`,
            customerName: inv.customer?.name || "",
            phone: inv.customer?.phone || "",
            product: inv.items?.[0]?.name || "",
            dueDate: inv.dueDate || "",
            total: inv.total || 0,
            note: inv.notes || "",
            status: mapBackendStatus(inv.status),
            createdAt: inv.createdAt || inv.issuedAt || "",
            transactions: (inv.transactions || []).map(tx => ({
              id: tx.id,
              amount: tx.amount,
              method: mapPaymentProvider(tx.provider),
              reference: tx.providerRef || "",
              note: "",
              createdAt: tx.paidAt || tx.createdAt || "",
            })),
            _backendId: inv.id,
            _backendData: inv,
          }))
        : [];
      
      setInvoices(mappedInvoices);
      if (createdInvoice?.code || createdInvoice?.id) {
        const newId = createdInvoice.code || `INV-${createdInvoice.id}`;
        setSelectedInvoiceId(newId);
      }
    setShowCreateModal(false);
    setNewInvoice({
      customerName: "",
      phone: "",
      product: "",
      dueDate: "",
      total: "",
      note: "",
    });
      
      showSuccess("Tạo hóa đơn thành công!");
    } catch (error) {
      console.error("Error creating invoice:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          "Không thể tạo hóa đơn";
      showError("Lỗi: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) {
      showWarning("Vui lòng chọn hóa đơn");
      return;
    }
    const amountNumber = Number(transactionForm.amount);
    if (!amountNumber || amountNumber <= 0) {
      showWarning("Vui lòng nhập số tiền hợp lệ (lớn hơn 0)");
      return;
    }
    
    try {
      setLoading(true);
      const paymentPayload = {
        invoiceId: selectedInvoice._backendId,
        provider: mapPaymentMethod(transactionForm.method),
      amount: amountNumber,
        providerRef: transactionForm.reference || "",
        notes: transactionForm.note || "",
      };
      
      await invoiceService.addPayment(paymentPayload);
      
      // Reload invoice to get updated data
      const invoiceResponse = await invoiceService.getDetail(selectedInvoice._backendId);
      const invoiceData = invoiceResponse?.data ?? invoiceResponse?.responseData ?? invoiceResponse;
      
      const updated = {
        id: invoiceData.code || `INV-${invoiceData.id}`,
        customerName: invoiceData.customer?.name || "",
        phone: invoiceData.customer?.phone || "",
        product: invoiceData.items?.[0]?.name || "",
        dueDate: invoiceData.dueDate || "",
        total: invoiceData.total ? Number(invoiceData.total) : 0,
        note: invoiceData.notes || "",
        status: mapBackendStatus(invoiceData.status),
        createdAt: invoiceData.createdAt || invoiceData.issuedAt || "",
        transactions: (invoiceData.transactions || []).map(tx => ({
          id: tx.id,
          amount: tx.amount ? Number(tx.amount) : 0,
          method: mapPaymentProvider(tx.provider),
          reference: tx.providerRef || "",
          note: "",
          createdAt: tx.paidAt || tx.createdAt || "",
        })),
        _backendId: invoiceData.id,
        _backendData: invoiceData,
      };
      
      setInvoices((prev) =>
        prev.map((inv) => (inv.id === updated.id ? updated : inv))
      );
      setSelectedInvoiceId(updated.id);
      setTransactionForm({
        amount: "",
        method: "BANK",
        reference: "",
        note: "",
      });
      showSuccess("Đã thêm giao dịch thành công!");
    } catch (error) {
      console.error("Error adding payment:", error);
      showError("Không thể thêm giao dịch: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const paidAmount = selectedInvoice 
    ? (selectedInvoice.transactions || []).reduce(
        (sum, tx) => sum + (Number(tx.amount) || 0),
        0
      )
    : 0;
  const remainingAmount = Math.max(
    (selectedInvoice?.total || 0) - paidAmount,
    0
  );
  const transferContent = selectedInvoice
    ? `MH_${selectedInvoice.id}`
    : "MH_INVOICE";
  const bankQr = selectedInvoice
    ? buildVietQRUrl(selectedInvoice.total, transferContent)
    : "";
  const momoQr = selectedInvoice
    ? buildMomoQrUrl(selectedInvoice.total, transferContent)
    : "";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7F5F0] py-10 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1B4332] mx-auto mb-4"></div>
          <p className="text-[#6B7280]">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] py-10 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#AD7A2A]">
              Quản lý hóa đơn
            </p>
            <h1 className="text-3xl font-semibold text-[#1F2A37]">
              Invoices & Transactions
            </h1>
            <p className="text-sm text-[#6B7280]">
              Theo dõi tiền khách đã chuyển và trạng thái hóa đơn khách hàng.
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-3 rounded-full bg-[#0F172A] text-white text-sm font-semibold hover:bg-[#111827]"
          >
            + Tạo hóa đơn mới
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Tổng số hóa đơn"
            value={stats.totalInvoices}
            sub="Đã phát hành"
          />
          <StatCard
            label="Đã thanh toán"
            value={stats.paidInvoices}
            sub="Hoàn tất"
            color="from-emerald-500 to-emerald-600"
          />
          <StatCard
            label="Còn phải thu"
            value={formatCurrency(stats.outstandingAmount)}
            sub="Chưa thanh toán"
            color="from-amber-500 to-amber-600"
          />
        </section>

        <section className="bg-white rounded-3xl border border-[#ECE7DD] p-6 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <label className="text-[#6B7280]">Trạng thái</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-full border border-[#E5E7EB] text-sm"
              >
                <option value="all">Tất cả</option>
                <option value="pending">Chưa thanh toán</option>
                <option value="processing">Đang thanh toán</option>
                <option value="paid">Đã thanh toán</option>
              </select>
            </div>
            <div className="flex-1">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo mã, khách hàng, số điện thoại..."
                className="w-full px-4 py-2 rounded-full border border-[#E5E7EB] text-sm"
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <InvoiceList
              invoices={filteredInvoices}
              selectedId={selectedInvoiceId}
              onSelect={handleSelectInvoice}
            />
            <InvoiceDetail
              invoice={selectedInvoice}
              paidAmount={paidAmount}
              remainingAmount={remainingAmount}
              onStartPayment={handleStartPayment}
              transactionForm={transactionForm}
              setTransactionForm={setTransactionForm}
              onAddTransaction={handleAddTransaction}
            />
          </div>
        </section>

      </div>

      {showPaymentModal && selectedInvoice && (
        <PaymentModal
          invoice={selectedInvoice}
          bankQr={bankQr}
          momoQr={momoQr}
          transferContent={transferContent}
          paymentMethod={paymentMethod}
          onMethodChange={setPaymentMethod}
          onClose={() => setShowPaymentModal(false)}
          onMarkPaid={handleMarkPaid}
        />
      )}

      {showCreateModal && (
        <CreateInvoiceModal
          formData={newInvoice}
          onClose={() => setShowCreateModal(false)}
          onChange={setNewInvoice}
          onSubmit={handleAddInvoice}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color = "from-slate-900 to-slate-800" }) {
  return (
    <div className="rounded-2xl border border-[#ECE7DD] bg-white p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-[#9CA3AF]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold text-[#111827]">{value}</p>
      <p className="text-sm text-[#6B7280]">{sub}</p>
      <div
        className={`mt-4 h-2 rounded-full bg-gradient-to-r ${color}`}
      ></div>
    </div>
  );
}

function StatusBadge({ status, pill = false }) {
  if (!status) return null;
  const meta = STATUS_META[status] || STATUS_META.pending;
  return (
    <span
      className={`inline-flex items-center justify-center ${
        pill ? "px-4 py-1.5 text-xs font-semibold" : "px-3 py-1 text-[11px]"
      } rounded-full ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}

function InvoiceList({ invoices, selectedId, onSelect }) {
  return (
    <div className="bg-[#F9FAFB] rounded-2xl border border-[#E5E7EB] overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-[#111827] text-white uppercase text-[11px] tracking-[0.2em]">
          <tr>
            <th className="px-4 py-3 text-left">Hóa đơn</th>
            <th className="px-4 py-3 text-left">Khách hàng</th>
            <th className="px-4 py-3 text-right">Tổng</th>
            <th className="px-4 py-3 text-center">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length ? (
            invoices.map((invoice) => (
              <tr
                key={invoice.id}
                onClick={() => onSelect(invoice.id)}
                className={`cursor-pointer border-b border-[#E5E7EB] last:border-0 ${
                  invoice.id === selectedId ? "bg-white" : "hover:bg-white/70"
                }`}
              >
                <td className="px-4 py-3">
                  <p className="font-semibold text-[#111827]">{invoice.id}</p>
                  <p className="text-[12px] text-[#6B7280]">
                    Đến hạn: {invoice.dueDate || "—"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-[#111827]">
                    {invoice.customerName}
                  </p>
                  <p className="text-[12px] text-[#6B7280]">{invoice.phone}</p>
                </td>
                <td className="px-4 py-3 text-right font-semibold text-[#111827]">
                  {formatCurrency(invoice.total)}
                </td>
                <td className="px-4 py-3 text-center">
                  <StatusBadge status={invoice.status} />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-[#6B7280]">
                Không tìm thấy hóa đơn phù hợp.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function InvoiceDetail({
  invoice,
  paidAmount,
  remainingAmount,
  onStartPayment,
  transactionForm,
  setTransactionForm,
  onAddTransaction,
}) {
  if (!invoice) {
    return (
      <div className="rounded-2xl border border-[#E5E7EB] p-6 flex flex-col items-center justify-center text-center text-[#6B7280]">
        Hãy chọn một hóa đơn để xem chi tiết.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E5E7EB] p-6 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[#AD7A2A]">
            Thông tin hóa đơn
          </p>
          <h2 className="text-2xl font-semibold text-[#1F2A37]">
            {invoice.id}
          </h2>
          <p className="text-sm text-[#6B7280]">Tạo lúc: {invoice.createdAt}</p>
        </div>
        <StatusBadge status={invoice.status} pill />
      </div>

      <div className="grid gap-3 text-sm">
        <InfoRow label="Khách hàng" value={invoice.customerName} />
        <InfoRow label="Số điện thoại" value={invoice.phone} />
        <InfoRow label="Mẫu may" value={invoice.product || "—"} />
        <InfoRow label="Ngày hoàn tất" value={invoice.dueDate || "—"} />
        <InfoRow label="Ghi chú" value={invoice.note || "—"} />
      </div>

      <div className="rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] p-4 text-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[#6B7280]">Đã thanh toán</span>
          <span className="font-semibold text-[#111827]">
            {formatCurrency(paidAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#6B7280]">Còn phải thu</span>
          <span className="font-semibold text-rose-600">
            {formatCurrency(remainingAmount)}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <button className="flex-1 px-4 py-3 rounded-full border border-[#0F172A] text-[#0F172A] font-semibold hover:bg-[#0F172A] hover:text-white transition-colors">
          In hóa đơn
        </button>
        <button className="flex-1 px-4 py-3 rounded-full bg-[#0F172A] text-white font-semibold hover:bg-[#111827] transition-colors">
          Gửi email
        </button>
      </div>

      <button
        onClick={onStartPayment}
        className="w-full px-4 py-3 rounded-2xl bg-[#111827] text-white font-semibold hover:bg-[#0B1324] transition-colors"
      >
        {invoice.status === "paid" ? "Xem QR thanh toán" : "Thanh toán hóa đơn"}
      </button>

      <div className="border-t border-dashed border-[#E5E7EB] pt-4 space-y-4">
        <h3 className="text-sm font-semibold text-[#111827]">
          Giao dịch của khách
        </h3>

        {invoice.transactions?.length ? (
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {invoice.transactions.map((tx) => (
              <div
                key={tx.id}
                className="rounded-2xl border border-[#E5E7EB] p-3 text-sm bg-[#FDFDFD]"
              >
                <div className="flex items-center justify-between text-xs text-[#6B7280]">
                  <span>{tx.createdAt}</span>
                  <span>
                    {tx.method === "MOMO"
                      ? "MoMo"
                      : tx.method === "CASH"
                      ? "Cash"
                      : "Bank"}
                  </span>
                </div>
                <p className="mt-1 text-lg font-semibold text-[#111827]">
                  {formatCurrency(tx.amount)}
                </p>
                <p className="text-xs text-[#6B7280]">
                  Mã tham chiếu: {tx.reference || "N/A"}
                </p>
                {tx.note && (
                  <p className="text-xs text-[#4B5563] mt-1">{tx.note}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[#6B7280]">Chưa có giao dịch nào.</p>
        )}

        <form
          onSubmit={onAddTransaction}
          className="rounded-2xl border border-[#E5E7EB] p-4 space-y-3 bg-[#FDFBF7]"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-[#9CA3AF]">
            Ghi nhận giao dịch
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              required
              type="number"
              min="10000"
              placeholder="Số tiền (đ)"
              value={transactionForm.amount}
              onChange={(e) =>
                setTransactionForm((prev) => ({
                  ...prev,
                  amount: e.target.value,
                }))
              }
              className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm"
            />
            <select
              value={transactionForm.method}
              onChange={(e) =>
                setTransactionForm((prev) => ({
                  ...prev,
                  method: e.target.value,
                }))
              }
              className="px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm"
            >
              <option value="BANK">Banking</option>
              <option value="MOMO">MoMo</option>
              <option value="CASH">Tiền mặt</option>
            </select>
          </div>
          <input
            placeholder="Mã giao dịch / Nội dung CK"
            value={transactionForm.reference}
            onChange={(e) =>
              setTransactionForm((prev) => ({
                ...prev,
                reference: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm"
          />
          <textarea
            placeholder="Ghi chú thêm..."
            value={transactionForm.note}
            onChange={(e) =>
              setTransactionForm((prev) => ({
                ...prev,
                note: e.target.value,
              }))
            }
            className="w-full px-3 py-2 rounded-xl border border-[#E5E7EB] text-sm"
            rows={2}
          />
          <button className="w-full px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700">
            Lưu giao dịch
          </button>
        </form>
      </div>
    </div>
  );
}

function PaymentModal({
  invoice,
  bankQr,
  momoQr,
  transferContent,
  paymentMethod,
  onMethodChange,
  onClose,
  onMarkPaid,
}) {
  const renderPaymentContent = () => {
    if (paymentMethod === "CASH") {
      return (
        <div className="rounded-2xl border border-[#E5E7EB] p-5 bg-[#FFFBF2] text-sm text-[#4B5563] space-y-3">
          <p className="text-base font-semibold text-[#111827]">
            Thanh toán tiền mặt tại tiệm
          </p>
          <p>
            Vui lòng thu tiền mặt trực tiếp từ khách hàng. Ghi nhận đầy đủ vào
            sổ quỹ trước khi xác nhận đã thanh toán.
          </p>
          <div className="rounded-xl bg-white border border-[#E5E7EB] p-3 text-sm">
            <p className="text-[#6B7280]">Số tiền phải thu</p>
            <p className="text-2xl font-semibold text-[#111827] mt-1">
              {formatCurrency(invoice.total)}
            </p>
          </div>
          <ul className="list-disc list-inside space-y-1 text-[#6B7280]">
            <li>Thu tiền đủ và kiểm đếm trước mặt khách.</li>
            <li>
              Nếu khách đặt cọc, hãy tạo giao dịch tương ứng sau khi nhận tiền.
            </li>
            <li>Giữ hóa đơn, ký xác nhận để đối soát cuối ngày.</li>
          </ul>
        </div>
      );
    }

    if (paymentMethod === "MOMO") {
      return (
        <QrCard
          title="Ví MoMo"
          subtitle={`${momoConfig.owner} · ${momoConfig.phone}`}
          qrUrl={momoQr}
          meta={[
            { label: "Số tiền", value: formatCurrency(invoice.total) },
            { label: "Nội dung CK", value: transferContent },
          ]}
        />
      );
    }

    return (
      <QrCard
        title="Ngân hàng (VietQR)"
        subtitle={`${bankConfig.bankName} · ${bankConfig.accountNumber}`}
        qrUrl={bankQr}
        meta={[
          { label: "Tên tài khoản", value: bankConfig.accountName },
          { label: "Nội dung CK", value: transferContent },
        ]}
      />
    );
  };

  const methodTabs = [
    { key: "BANK", label: "Ngân hàng" },
    { key: "MOMO", label: "MoMo" },
    { key: "CASH", label: "Tiền mặt" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white max-w-3xl w-full rounded-3xl shadow-2xl border border-[#ECE7DD] p-8 space-y-6 relative">
        <button
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB]"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#AD7A2A]">
            Thanh toán hóa đơn
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[#1F2A37]">
            Chọn phương thức
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">
            Số tiền áp dụng cho hóa đơn {invoice.id}
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          {methodTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onMethodChange(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
                paymentMethod === tab.key
                  ? "bg-[#111827] text-white border-[#111827]"
                  : "border-[#E5E7EB] text-[#111827] hover:bg-[#F3F4F6]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {renderPaymentContent()}

        {invoice.status !== "paid" ? (
          <button
            onClick={onMarkPaid}
            className="w-full px-4 py-3 rounded-2xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors"
          >
            {paymentMethod === "CASH"
              ? "Xác nhận đã nhận tiền mặt"
              : "Xác nhận đã thanh toán"}
          </button>
        ) : (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-800 text-center">
            ✅ Hóa đơn đã thanh toán. Xin cảm ơn!
          </div>
        )}

        <div className="bg-[#F9FAFB] rounded-2xl p-4 text-sm text-[#4B5563] space-y-2">
          <p className="font-semibold text-[#111827]">Lưu ý</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Đảm bảo nội dung chuyển khoản đúng mã hóa đơn.</li>
            <li>Sau khi thanh toán, hệ thống sẽ tự động cập nhật trạng thái.</li>
            <li>Nếu gặp lỗi, vui lòng liên hệ 0901 134 256.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function CreateInvoiceModal({ formData, onClose, onChange, onSubmit }) {
  const [applyingPromo, setApplyingPromo] = useState(false);
  const [showPromoList, setShowPromoList] = useState(false);
  const [availablePromos, setAvailablePromos] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  
  const updateField = (field, value) => {
    onChange((prev) => ({ ...prev, [field]: value }));
  };

  // Load available promotions
  const loadAvailablePromos = async () => {
    if (!formData.total || Number(formData.total) <= 0) {
      showWarning("Vui lòng nhập tổng tiền trước");
      return;
    }

    try {
      setLoadingPromos(true);
      const orderAmount = Number(formData.total.toString().replace(/,/g, "")) || 0;
      
      // Load active promotions
      const response = await promotionService.listActivePublic({ page: 0, size: 20 });
      const promosData = response?.data?.content || 
                        response?.responseData?.content || 
                        response?.content || 
                        [];
      
      // Filter promotions that can be applied to this order amount
      const applicablePromos = promosData.filter(promo => {
        if (!promo.minOrderValue) return true;
        return orderAmount >= promo.minOrderValue;
      });
      
      setAvailablePromos(applicablePromos);
      setShowPromoList(true);
    } catch (error) {
      console.error('[CreateInvoiceModal] Failed to load promotions:', error);
      showError("Không thể tải danh sách mã giảm giá");
    } finally {
      setLoadingPromos(false);
    }
  };

  const handleSelectPromo = async (promo) => {
    if (!formData.total || Number(formData.total) <= 0) {
      showWarning("Vui lòng nhập tổng tiền trước");
      return;
    }

    try {
      setApplyingPromo(true);
      setSelectedPromo(promo);
      const orderAmount = Number(formData.total.toString().replace(/,/g, "")) || 0;
      
      const applyData = {
        code: promo.code,
        orderAmount: orderAmount,
        productIds: null,
        categoryIds: null
      };

      const response = await promotionService.applyPromoCode(applyData);
      const promoResponse = response?.data ?? response?.responseData ?? response;
      
      if (promoResponse && promoResponse.discountAmount) {
        onChange((prev) => ({
          ...prev,
          promoCode: promo.code,
          promoDiscount: promoResponse.discountAmount
        }));
        setShowPromoList(false);
        showSuccess(`Đã áp dụng mã ${promo.code}! Giảm ${promoResponse.discountAmount.toLocaleString('vi-VN')} VND`);
      } else {
        showError("Không thể áp dụng mã giảm giá này");
      }
    } catch (error) {
      console.error('[CreateInvoiceModal] Failed to apply promo code:', error);
      const errorMsg = error?.response?.data?.responseMessage || 
                       error?.message || 
                       "Mã giảm giá không hợp lệ hoặc đã hết hạn";
      showError(errorMsg);
      setSelectedPromo(null);
      onChange((prev) => ({
        ...prev,
        promoDiscount: 0
      }));
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleApplyPromoCode = async () => {
    if (!formData.promoCode?.trim()) {
      showWarning("Vui lòng nhập mã giảm giá");
      return;
    }
    
    if (!formData.total || Number(formData.total) <= 0) {
      showWarning("Vui lòng nhập tổng tiền trước khi áp dụng mã giảm giá");
      return;
    }

    try {
      setApplyingPromo(true);
      const orderAmount = Number(formData.total.toString().replace(/,/g, "")) || 0;
      
      const applyData = {
        code: formData.promoCode.trim().toUpperCase(),
        orderAmount: orderAmount,
        productIds: null,
        categoryIds: null
      };

      const response = await promotionService.applyPromoCode(applyData);
      const promoResponse = response?.data ?? response?.responseData ?? response;
      
      if (promoResponse && promoResponse.discountAmount) {
        onChange((prev) => ({
          ...prev,
          promoDiscount: promoResponse.discountAmount
        }));
        showSuccess(`Đã áp dụng mã giảm giá! Giảm ${promoResponse.discountAmount.toLocaleString('vi-VN')} VND`);
      } else {
        showError("Không thể áp dụng mã giảm giá này");
      }
    } catch (error) {
      console.error('[CreateInvoiceModal] Failed to apply promo code:', error);
      const errorMsg = error?.response?.data?.responseMessage || 
                       error?.message || 
                       "Mã giảm giá không hợp lệ hoặc đã hết hạn";
      showError(errorMsg);
      onChange((prev) => ({
        ...prev,
        promoDiscount: 0
      }));
    } finally {
      setApplyingPromo(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <form
        onSubmit={onSubmit}
        className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl border border-[#ECE7DD] p-8 space-y-5"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#AD7A2A]">
              Hóa đơn mới
            </p>
            <h3 className="text-2xl font-semibold text-[#1F2A37]">
              Tạo hóa đơn khách hàng
            </h3>
          </div>
          <button
            type="button"
            className="w-10 h-10 rounded-full bg-[#F3F4F6] text-[#111827] hover:bg-[#E5E7EB]"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">
              Tên khách hàng <span className="text-red-500">*</span>
            </label>
          <input
            required
              placeholder="Nhập tên khách hàng"
            value={formData.customerName}
            onChange={(e) => updateField("customerName", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
          />
          </div>
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">
              Số điện thoại
            </label>
          <input
              type="tel"
              placeholder="Nhập số điện thoại"
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
          />
          </div>
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">
              Tên sản phẩm / Dịch vụ
            </label>
          <input
              placeholder="Ví dụ: Áo sơ mi, Quần âu..."
            value={formData.product}
            onChange={(e) => updateField("product", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
          />
          </div>
          <div>
            <label className="block text-xs text-[#6B7280] mb-1">
              Ngày đến hạn
            </label>
          <input
            type="date"
            value={formData.dueDate}
            onChange={(e) => updateField("dueDate", e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
          />
          </div>
        </div>

        <div>
          <label className="block text-xs text-[#6B7280] mb-1">
            Tổng tiền (VND) <span className="text-red-500">*</span>
          </label>
        <input
          required
          type="number"
            min="1000"
            step="1000"
            placeholder="Nhập tổng tiền"
          value={formData.total}
          onChange={(e) => updateField("total", e.target.value)}
          className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
        />
        </div>

        <div>
          <label className="block text-xs text-[#6B7280] mb-1">
            Mã giảm giá (tùy chọn)
          </label>
          <div className="flex gap-2 relative">
            <input
              type="text"
              placeholder="Nhập mã giảm giá hoặc chọn từ danh sách"
              value={formData.promoCode || ""}
              onChange={(e) => {
                updateField("promoCode", e.target.value.toUpperCase());
                // Reset discount when code changes
                if (formData.promoDiscount > 0) {
                  updateField("promoDiscount", 0);
                  setSelectedPromo(null);
                }
              }}
              className="flex-1 px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
            />
            <button
              type="button"
              onClick={loadAvailablePromos}
              disabled={loadingPromos || !formData.total}
              className="px-4 py-3 rounded-2xl bg-[#EE4D2D] text-white text-sm font-semibold hover:bg-[#D73211] disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loadingPromos ? "..." : "Chọn mã"}
            </button>
            <button
              type="button"
              onClick={handleApplyPromoCode}
              disabled={applyingPromo || !formData.promoCode?.trim() || !formData.total}
              className="px-4 py-3 rounded-2xl bg-[#111827] text-white text-sm font-semibold hover:bg-[#0B1324] disabled:bg-gray-300 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {applyingPromo ? "Đang kiểm tra..." : "Áp dụng"}
            </button>
          </div>
          
          {/* Promo List Dropdown */}
          {showPromoList && availablePromos.length > 0 && (
            <div className="mt-2 border border-[#E5E7EB] rounded-2xl bg-white shadow-lg max-h-64 overflow-y-auto">
              {availablePromos.map((promo) => (
                <div
                  key={promo.id}
                  onClick={() => handleSelectPromo(promo)}
                  className={`p-4 border-b border-[#E5E7EB] last:border-0 cursor-pointer hover:bg-[#F9FAFB] transition-colors ${
                    selectedPromo?.id === promo.id ? 'bg-[#FEF3E2] border-l-4 border-l-[#EE4D2D]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-[#EE4D2D]">{promo.code}</span>
                        {promo.type === 'PERCENTAGE' && (
                          <span className="text-xs bg-[#EE4D2D] text-white px-2 py-1 rounded">
                            Giảm {promo.value}%
                          </span>
                        )}
                        {promo.type === 'FIXED_AMOUNT' && (
                          <span className="text-xs bg-[#EE4D2D] text-white px-2 py-1 rounded">
                            Giảm {promo.value?.toLocaleString('vi-VN')}₫
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#6B7280]">{promo.name}</p>
                      {promo.minOrderValue && (
                        <p className="text-xs text-[#9CA3AF] mt-1">
                          Áp dụng cho đơn từ {promo.minOrderValue.toLocaleString('vi-VN')}₫
                        </p>
                      )}
                      {promo.endDate && (
                        <p className="text-xs text-[#9CA3AF]">
                          HSD: {new Date(promo.endDate).toLocaleDateString('vi-VN')}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-[#EE4D2D] text-white text-xs font-semibold hover:bg-[#D73211]"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPromo(promo);
                      }}
                    >
                      Chọn
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {formData.promoDiscount && formData.promoDiscount > 0 && (
            <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-700 font-semibold">
                    ✓ Đã áp dụng mã: {formData.promoCode}
                  </p>
                  <p className="text-sm text-green-600 font-bold mt-1">
                    Giảm: {formData.promoDiscount.toLocaleString('vi-VN')} VND
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateField("promoCode", "");
                    updateField("promoDiscount", 0);
                    setSelectedPromo(null);
                  }}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Xóa
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs text-[#6B7280] mb-1">
            Ghi chú
          </label>
        <textarea
            placeholder="Nhập ghi chú (nếu có)"
          value={formData.note}
          onChange={(e) => updateField("note", e.target.value)}
          rows={3}
            maxLength={500}
          className="w-full px-4 py-3 rounded-2xl border border-[#E5E7EB] text-sm"
        />
          <p className="text-xs text-[#9CA3AF] mt-1">
            {formData.note?.length || 0}/500 ký tự
          </p>
        </div>

        <button className="w-full px-4 py-3 rounded-full bg-[#111827] text-white font-semibold hover:bg-[#0B1324]">
          Lưu hóa đơn
        </button>
      </form>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#6B7280]">{label}</span>
      <span className="font-medium text-[#111827] text-right">
        {value || "—"}
      </span>
    </div>
  );
}

function QrCard({ title, subtitle, qrUrl, meta = [] }) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] p-5">
      <div className="text-center mb-4">
        <p className="text-sm font-semibold text-[#111827]">{title}</p>
        <p className="text-xs text-[#6B7280] mt-1">{subtitle}</p>
      </div>
      <div className="aspect-square bg-white rounded-2xl border border-dashed border-[#E5E7EB] p-4 flex items-center justify-center">
        <img
          src={qrUrl}
          alt={title}
          className="w-full h-full object-contain rounded-xl"
        />
      </div>
      <div className="mt-4 space-y-1 text-sm text-[#4B5563]">
        {meta.map((item) => (
          <div key={item.label} className="flex justify-between">
            <span>{item.label}</span>
            <span className="font-medium text-[#111827]">
              {item.value || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
