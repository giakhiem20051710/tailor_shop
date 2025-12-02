const STORAGE_KEY = "tailorShopInvoices";

const DEFAULT_INVOICES = [
  {
    id: "INV-001",
    customerName: "Nguyễn Văn A",
    phone: "0901234567",
    product: "Vest nam cao cấp",
    createdAt: "2025-11-28 09:15",
    dueDate: "2025-12-05",
    total: 1500000,
    status: "pending",
    note: "Thanh toán 100% trước khi giao đồ",
    transactions: [
      {
        id: "TX-001",
        invoiceId: "INV-001",
        amount: 500000,
        method: "BANK",
        reference: "VCB123456",
        note: "Đặt cọc ban đầu",
        createdAt: "2025-11-28 10:00",
      },
    ],
  },
  {
    id: "INV-002",
    customerName: "Trần Thị B",
    phone: "0902233333",
    product: "Đầm dạ hội cao cấp",
    createdAt: "2025-11-25 14:45",
    dueDate: "2025-12-10",
    total: 2100000,
    status: "processing",
    note: "Khách muốn giao trước Noel",
    transactions: [
      {
        id: "TX-002",
        invoiceId: "INV-002",
        amount: 1000000,
        method: "MOMO",
        reference: "MOMO776655",
        note: "Đặt cọc 50%",
        createdAt: "2025-11-25 15:10",
      },
    ],
  },
  {
    id: "INV-003",
    customerName: "Lê Văn C",
    phone: "0909999999",
    product: "Áo dài cưới truyền thống",
    createdAt: "2025-11-20 08:30",
    dueDate: "2025-12-01",
    total: 1800000,
    status: "paid",
    note: "Đã giao ngày 29/11",
    transactions: [
      {
        id: "TX-003",
        invoiceId: "INV-003",
        amount: 1800000,
        method: "BANK",
        reference: "VCB888222",
        note: "Thanh toán đủ",
        createdAt: "2025-11-27 09:00",
      },
    ],
  },
];

const getInvoices = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading invoices:", error);
    return [];
  }
};

const saveInvoices = (invoices) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    return true;
  } catch (error) {
    console.error("Error saving invoices:", error);
    return false;
  }
};

const initializeDefaultInvoices = () => {
  const current = getInvoices();
  if (!current.length) {
    saveInvoices(DEFAULT_INVOICES);
    return DEFAULT_INVOICES;
  }
  return current;
};

const generateInvoiceId = () => {
  const invoices = getInvoices();
  const max = invoices.reduce((acc, inv) => {
    const num = parseInt(inv.id.replace("INV-", ""), 10) || 0;
    return Math.max(acc, num);
  }, 0);
  return `INV-${String(max + 1).padStart(3, "0")}`;
};

const generateTransactionId = () => {
  const invoices = getInvoices();
  const allTransactions = invoices.flatMap((inv) => inv.transactions || []);
  const max = allTransactions.reduce((acc, tx) => {
    const num = parseInt(tx.id.replace("TX-", ""), 10) || 0;
    return Math.max(acc, num);
  }, 0);
  return `TX-${String(max + 1).padStart(3, "0")}`;
};

const addInvoice = (data) => {
  const invoices = getInvoices();
  const newInvoice = {
    id: generateInvoiceId(),
    status: "pending",
    transactions: [],
    createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    ...data,
  };
  invoices.unshift(newInvoice);
  saveInvoices(invoices);
  return newInvoice;
};

const updateInvoice = (invoiceId, updates) => {
  const invoices = getInvoices();
  const idx = invoices.findIndex((inv) => inv.id === invoiceId);
  if (idx === -1) return null;
  invoices[idx] = { ...invoices[idx], ...updates };
  saveInvoices(invoices);
  return invoices[idx];
};

const addTransactionToInvoice = (invoiceId, transactionData) => {
  const invoices = getInvoices();
  const idx = invoices.findIndex((inv) => inv.id === invoiceId);
  if (idx === -1) return null;
  const newTransaction = {
    id: generateTransactionId(),
    invoiceId,
    createdAt: new Date().toISOString().slice(0, 16).replace("T", " "),
    ...transactionData,
  };
  if (!invoices[idx].transactions) {
    invoices[idx].transactions = [];
  }
  invoices[idx].transactions.unshift(newTransaction);
  const paidAmount = invoices[idx].transactions.reduce(
    (sum, tx) => sum + (Number(tx.amount) || 0),
    0
  );
  if (paidAmount >= invoices[idx].total) {
    invoices[idx].status = "paid";
  } else if (paidAmount > 0) {
    invoices[idx].status = "processing";
  }
  saveInvoices(invoices);
  return { invoice: invoices[idx], transaction: newTransaction };
};

const getInvoiceById = (invoiceId) => {
  const invoices = getInvoices();
  return invoices.find((inv) => inv.id === invoiceId);
};

export {
  getInvoices,
  saveInvoices,
  addInvoice,
  updateInvoice,
  addTransactionToInvoice,
  initializeDefaultInvoices,
  getInvoiceById,
};

