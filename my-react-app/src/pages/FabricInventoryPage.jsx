import { useEffect, useMemo, useState } from "react";
import {
  getFabricInventory,
  saveFabricInventory,
} from "../utils/fabricInventoryStorage.js";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=900&auto=format&fit=crop&q=80";

export default function FabricInventoryPage() {
  const [items, setItems] = useState(() => getFabricInventory());
  const [editing, setEditing] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const emptyItem = {
    id: null,
    code: "",
    name: "",
    category: "",
    pricePerMeter: "",
    unit: "đ/m",
    quantity: "",
    image: "",
    status: "active",
  };

  const [form, setForm] = useState(emptyItem);

  const totalStats = useMemo(() => {
    const totalItems = items.length;
    const totalQuantity = items.reduce(
      (sum, f) => sum + Number(f.quantity || 0),
      0
    );
    const totalValue = items.reduce(
      (sum, f) =>
        sum + Number(f.quantity || 0) * Number(f.pricePerMeter || 0),
      0
    );
    return { totalItems, totalQuantity, totalValue };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((f) => {
      if (filterStatus !== "all" && f.status !== filterStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const text =
          (f.code || "") +
          " " +
          (f.name || "").toLowerCase() +
          " " +
          (f.category || "").toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [items, filterStatus, search]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyItem);
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      ...item,
      pricePerMeter: item.pricePerMeter || "",
      quantity: item.quantity || "",
    });
    setShowForm(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((prev) => ({
          ...prev,
          image: reader.result,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      pricePerMeter: Number(form.pricePerMeter || 0),
      quantity: Number(form.quantity || 0),
    };
    let updated;
    if (editing && editing.id) {
      updated = items.map((f) => (f.id === editing.id ? { ...payload, id: f.id } : f));
    } else {
      const nextId =
        items.reduce((max, f) => (f.id > max ? f.id : max), 0) + 1;
      updated = [...items, { ...payload, id: nextId }];
    }
    setItems(updated);
    saveFabricInventory(updated);
    setEditing(null);
    setForm(emptyItem);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (!confirm("Bạn chắc chắn muốn xóa cuộn vải này khỏi kho?")) return;
    const updated = items.filter((f) => f.id !== id);
    setItems(updated);
    saveFabricInventory(updated);
  };

  useEffect(() => {
    setItems(getFabricInventory());
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-emerald-700">
            Kho vải
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">
            Quản lý vải may đo
          </h1>
          <p className="text-[13px] text-slate-500 mt-1">
            Thêm, chỉnh sửa và theo dõi số lượng vải đang có trong kho để chủ
            động nhận đơn may.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center justify-center px-3 py-2 text-sm md:text-base bg-emerald-700 text-white rounded-full shadow-md hover:bg-emerald-800 transition w-full sm:w-auto"
        >
          <span className="mr-1">＋</span> Thêm cuộn vải
        </button>
      </div>

      {/* Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        <StatCard label="Số loại vải" value={totalStats.totalItems} />
        <StatCard label="Tổng mét vải" value={totalStats.totalQuantity} />
        <StatCard
          label="Giá trị ước tính"
          value={`${totalStats.totalValue.toLocaleString("vi-VN")} đ`}
        />
      </section>

      {/* Filters */}
      <section className="bg-white rounded-2xl border border-slate-200 p-4 md:p-5 shadow-sm space-y-3 md:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-slate-600">Trạng thái:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 rounded-full border border-slate-200 text-sm"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang bán</option>
              <option value="inactive">Tạm ẩn</option>
            </select>
          </div>
          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Mã vải, tên vải, nhóm vải..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </section>

      {/* Inventory grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {filteredItems.map((fabric) => (
          <article
            key={fabric.id}
            className="group rounded-2xl border border-emerald-100 bg-gradient-to-b from-white via-emerald-50/40 to-white shadow-sm hover:shadow-xl hover:border-emerald-300 transition overflow-hidden flex flex-col"
          >
            <div className="relative h-40 w-full bg-gray-100 overflow-hidden">
              <img
                src={fabric.image || FALLBACK_IMAGE}
                alt={fabric.name}
                className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
              <div className="absolute left-3 top-3 px-2 py-1 rounded-full text-[11px] font-semibold bg-black/50 text-white">
                {fabric.code || `F-${String(fabric.id).padStart(3, "0")}`}
              </div>
              <div className="absolute right-3 top-3">
                <span
                  className={`px-2 py-1 rounded-full text-[11px] font-semibold ${
                    fabric.status === "active"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {fabric.status === "active" ? "Đang bán" : "Tạm ẩn"}
                </span>
              </div>
            </div>

            <div className="flex-1 flex flex-col p-3 md:p-4">
              <h3 className="font-semibold text-slate-900 line-clamp-2">
                {fabric.name}
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                {fabric.category || "Chưa phân loại"}
              </p>

              <div className="mt-2 flex items-baseline justify-between text-sm">
                <div>
                  <p className="text-xs text-slate-500">Giá / mét</p>
                  <p className="font-semibold text-emerald-900">
                    {fabric.pricePerMeter.toLocaleString("vi-VN")}{" "}
                    {fabric.unit || "đ/m"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Số mét còn</p>
                  <p
                    className={`font-semibold ${
                      fabric.quantity <= 10 ? "text-red-600" : "text-slate-900"
                    }`}
                  >
                    {fabric.quantity} m
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => openEdit(fabric)}
                  className="flex-1 rounded-full border border-emerald-500 text-emerald-700 text-xs md:text-sm py-1.5 hover:bg-emerald-600 hover:text-white transition"
                >
                  Sửa
                </button>
                <button
                  onClick={() => handleDelete(fabric.id)}
                  className="flex-1 rounded-full border border-red-300 text-red-600 text-xs md:text-sm py-1.5 hover:bg-red-500 hover:text-white transition"
                >
                  Xóa
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* Edit / Add form - modal */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl mx-4">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h2 className="text-lg font-semibold text-slate-900">
                {editing ? "Chỉnh sửa cuộn vải" : "Thêm cuộn vải mới"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                  setForm(emptyItem);
                }}
                className="text-slate-500 hover:text-slate-800"
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 text-sm px-4 py-4"
            >
              <div>
                <label className="block mb-1 text-slate-600">Mã vải</label>
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={handleChange}
                  placeholder="VD: F-101"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1 text-slate-600">Tên vải</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="VD: Lụa tơ tằm kem, Linen mềm màu be..."
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block mb-1 text-slate-600">Nhóm vải</label>
                <input
                  type="text"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  placeholder="Lụa, Linen, Satin..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-600">Giá / mét (đ)</label>
                <input
                  type="number"
                  name="pricePerMeter"
                  value={form.pricePerMeter}
                  onChange={handleChange}
                  min="0"
                  step="1000"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-600">Số mét còn</label>
                <input
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  min="0"
                  step="0.5"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block mb-1 text-slate-600">
                  Ảnh minh họa
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    name="image"
                    value={form.image}
                    onChange={handleChange}
                    placeholder="Dán link ảnh vải (Unsplash, Pexels...)"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Hoặc tải ảnh từ máy:</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block mb-1 text-slate-600">Trạng thái</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="active">Đang bán</option>
                  <option value="inactive">Tạm ẩn</option>
                </select>
              </div>

              <div className="md:col-span-3 flex flex-wrap justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditing(null);
                    setForm(emptyItem);
                  }}
                  className="px-4 py-2 rounded-full border border-slate-300 text-slate-600 text-sm hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-full bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 shadow"
                >
                  {editing ? "Lưu thay đổi" : "Thêm vào kho"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}


