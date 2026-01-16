/**
 * AppointmentsTab Component  
 * Displays list of upcoming appointments
 */

export default function AppointmentsTab({ appointments }) {
    const formatDateVN = (dateStr) => {
        if (!dateStr) return "—";
        try {
            const date = new Date(dateStr + "T00:00:00");
            return date.toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "2-digit",
                month: "long",
                year: "numeric",
            });
        } catch {
            return dateStr;
        }
    };

    const getTypeIcon = (type) => {
        const icons = {
            consult: "💬",
            measure: "📏",
            fitting: "👔",
            pickup: "📦",
        };
        return icons[type] || "📅";
    };

    const getTypeLabel = (type) => {
        const labels = {
            consult: "Tư vấn / chọn mẫu",
            measure: "Đo số đo",
            fitting: "Thử đồ",
            pickup: "Nhận đồ",
        };
        return labels[type] || type;
    };

    const getStatusColor = (status) => {
        const statusLower = status?.toLowerCase() || "";
        if (statusLower.includes("done") || statusLower.includes("completed")) {
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        }
        if (statusLower.includes("pending") || statusLower.includes("confirmed")) {
            return "bg-amber-50 text-amber-700 border-amber-200";
        }
        if (statusLower.includes("cancelled")) {
            return "bg-red-50 text-red-700 border-red-200";
        }
        return "bg-slate-50 text-slate-700 border-slate-200";
    };

    if (appointments.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="inline-block p-6 rounded-[24px] bg-gradient-to-br from-[#FFF7E6] to-[#F8F4EC] border border-[#E4D8C3]">
                    <p className="text-[48px] mb-3">📅</p>
                    <p className="text-[16px] font-semibold text-[#1B4332] mb-1">
                        Chưa có lịch hẹn nào
                    </p>
                    <p className="text-[13px] text-[#6B7280]">
                        Bạn chưa đặt lịch hẹn nào với tiệm.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {appointments.map((apt) => (
                <article
                    key={apt.id}
                    className="bg-white rounded-[24px] border border-[#E4D8C3] overflow-hidden shadow-[0_8px_20px_rgba(148,114,80,0.12)] hover:shadow-[0_12px_32px_rgba(148,114,80,0.18)] transition-all duration-300"
                >
                    <div className="p-5">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-14 h-14 rounded-[16px] bg-gradient-to-br from-[#FFF7E6] to-[#F8F4EC] border border-[#E4D8C3] flex items-center justify-center text-[24px]">
                                {getTypeIcon(apt.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <h4 className="heading-font text-[16px] text-[#1B4332] font-semibold">
                                        {getTypeLabel(apt.type)}
                                    </h4>
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getStatusColor(apt.status)}`}>
                                        {apt.status === "done" ? "Hoàn thành" : apt.status === "cancelled" ? "Đã hủy" : "Đã xác nhận"}
                                    </span>
                                </div>
                                <div className="space-y-1.5 text-[13px] text-[#4B5563]">
                                    <p className="flex items-center gap-2">
                                        <span className="text-[#9CA3AF]">📅</span>
                                        <span className="font-medium">{formatDateVN(apt.date)}</span>
                                    </p>
                                    <p className="flex items-center gap-2">
                                        <span className="text-[#9CA3AF]">🕐</span>
                                        <span>{apt.time}{apt.estimatedEndTime ? ` - ${apt.estimatedEndTime}` : ''}</span>
                                        {apt.durationMinutes && <span className="text-xs text-slate-400">({apt.durationMinutes} phút)</span>}
                                    </p>
                                    {apt.secondaryTypes && apt.secondaryTypes.length > 0 && (
                                        <p className="flex items-center gap-2">
                                            <span className="text-[#9CA3AF]">➕</span>
                                            <span>Dịch vụ thêm: {apt.secondaryTypes.map(t => getTypeLabel(t)).join(", ")}</span>
                                        </p>
                                    )}
                                    {apt.tailorName && (
                                        <p className="flex items-center gap-2">
                                            <span className="text-[#9CA3AF]">👤</span>
                                            <span>Thợ may: {apt.tailorName}</span>
                                        </p>
                                    )}
                                    {apt.location && (
                                        <p className="flex items-center gap-2">
                                            <span className="text-[#9CA3AF]">📍</span>
                                            <span>{apt.location}</span>
                                        </p>
                                    )}
                                    {apt.checklist && apt.checklist.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-slate-100">
                                            <p className="text-xs text-slate-500 mb-1">📋 Chuẩn bị:</p>
                                            <ul className="text-xs text-slate-600 space-y-0.5">
                                                {apt.checklist.map((item, idx) => (
                                                    <li key={idx} className="flex items-center gap-1.5">
                                                        <span className="text-emerald-500">☐</span> {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </article>
            ))}
        </div>
    );
}
