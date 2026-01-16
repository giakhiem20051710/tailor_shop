/**
 * SlotDetailModal Component
 * Modal to show appointment slot details with actions
 */

export default function SlotDetailModal({
    slot,
    appointments,
    tailors,
    onClose,
    onUpdateStatus,
    onToggleBlock,
}) {
    const getTailorName = (tailorId) =>
        (tailors.find((t) => t.username === tailorId || t.id === tailorId) || {})
            .name || "Thợ";

    const typeLabel = (type) => {
        switch (type) {
            case "consult":
                return "Tư vấn";
            case "measure":
                return "Đo số đo";
            case "fitting":
                return "Thử đồ";
            case "pickup":
                return "Nhận đồ";
            default:
                return "Lịch hẹn";
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Chi tiết ca rảnh</h3>
                        <p className="text-xs text-slate-500">
                            {slot.date} · {slot.startTime}–{slot.endTime} · {typeLabel(slot.type)} ·{" "}
                            {getTailorName(slot.tailorId)}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onToggleBlock}
                            className="px-3 py-1 rounded-full text-xs border border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                            {slot.status === "blocked" ? "Mở lại" : "Chặn giờ"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-slate-500 hover:text-slate-800"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                <div className="p-4 space-y-3 text-sm">
                    {(!appointments || appointments.length === 0) && (
                        <p className="text-slate-500 italic">Chưa có khách đặt slot này.</p>
                    )}

                    {appointments && appointments.length > 0 && (
                        <div className="space-y-2">
                            {appointments.map((app) => (
                                <div
                                    key={app.id}
                                    className="border border-slate-200 rounded-lg p-3 flex justify-between items-start"
                                >
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            Khách: {app.customerId || "Khách lẻ"}
                                        </p>
                                        <p className="text-xs text-slate-500">Loại lịch: {typeLabel(app.type)}</p>
                                        <p className="text-xs text-slate-500">
                                            Trạng thái: <span className="font-semibold">{app.status}</span>
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {app.status !== "done" && (
                                            <button
                                                onClick={() => onUpdateStatus(app.id, "done")}
                                                className="px-3 py-1 rounded-full bg-emerald-600 text-white text-xs hover:bg-emerald-700"
                                            >
                                                Đánh dấu xong
                                            </button>
                                        )}
                                        {app.status !== "cancelled" && (
                                            <button
                                                onClick={() => onUpdateStatus(app.id, "cancelled")}
                                                className="px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs hover:bg-red-200"
                                            >
                                                Hủy lịch
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
