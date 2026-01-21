/**
 * Invoice UI Components
 * Shared UI components for InvoicePage
 */
import { useState } from 'react';
import promotionService from '../../services/promotionService';
import { showWarning, showError } from '../NotificationToast.jsx';

// Status metadata
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

// Format currency
export const formatCurrency = (value) =>
    `${Number(value || 0).toLocaleString("vi-VN")} đ`;

/**
 * StatCard - Statistics display card
 */
export function StatCard({ label, value, sub, color = "from-slate-900 to-slate-800" }) {
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

/**
 * StatusBadge - Invoice status badge
 */
export function StatusBadge({ status, pill = false }) {
    if (!status) return null;
    const meta = STATUS_META[status] || STATUS_META.pending;
    return (
        <span
            className={`inline-flex items-center justify-center ${pill ? "px-4 py-1.5 text-xs font-semibold" : "px-3 py-1 text-[11px]"
                } rounded-full ${meta.className}`}
        >
            {meta.label}
        </span>
    );
}

/**
 * InfoRow - Labeled information row
 */
export function InfoRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-4 py-2 border-b border-dashed border-[#E5E7EB] last:border-0">
            <span className="text-[#6B7280] text-sm whitespace-nowrap">{label}</span>
            <span className="text-[#111827] font-medium text-sm text-right">
                {value || "—"}
            </span>
        </div>
    );
}

/**
 * QrCard - QR code display card
 */
export function QrCard({ title, subtitle, qrUrl, meta = [] }) {
    return (
        <div className="rounded-2xl border border-[#E5E7EB] p-5 flex flex-col items-center space-y-4 bg-white">
            <div className="text-center">
                <p className="font-semibold text-[#111827]">{title}</p>
                <p className="text-sm text-[#6B7280]">{subtitle}</p>
            </div>
            {qrUrl && (
                <div className="w-48 h-48 bg-[#F9FAFB] rounded-xl flex items-center justify-center p-2">
                    <img
                        src={qrUrl}
                        alt="QR Code"
                        className="w-full h-full object-contain rounded-lg"
                        onError={(e) => {
                            e.target.style.display = "none";
                        }}
                    />
                </div>
            )}
            <div className="w-full space-y-2 text-sm">
                {meta.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                        <span className="text-[#6B7280]">{item.label}</span>
                        <span className="font-semibold text-[#111827]">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * InvoiceList - List of invoices
 */
export function InvoiceList({ invoices, selectedId, onSelect }) {
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
                                className={`cursor-pointer border-b border-[#E5E7EB] last:border-0 ${invoice.id === selectedId ? "bg-white" : "hover:bg-white/70"
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
