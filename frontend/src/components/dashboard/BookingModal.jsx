/**
 * BookingModal Component
 * Modal for booking appointments (consult, measure, fitting, pickup)
 */
import { useMemo } from 'react';

export default function BookingModal({
    onClose,
    step,
    setStep,
    bookingType,
    setBookingType,
    secondaryTypes = [],
    setSecondaryTypes = () => { },
    bookingDate,
    setBookingDate,
    bookingSlotId,
    setBookingSlotId,
    bookingTime,
    setBookingTime,
    availableSlots,
    next14Days,
    bookingTypeLabel,
    onConfirm,
}) {
    const typeOptions = [
        { value: "consult", label: "Tư vấn / chọn mẫu (20p)" },
        { value: "measure", label: "Đo số đo (40p)" },
        { value: "fitting", label: "Thử đồ (30p)" },
        { value: "pickup", label: "Nhận đồ (15p)" },
    ];

    const selectedDateStr = bookingDate;
    const usableSlots = useMemo(
        () =>
            availableSlots.filter((slot) => {
                // Don't filter by type - working slots are just time blocks
                // Type is selected separately by customer
                if (slot.status !== "available" && slot.status !== "AVAILABLE") return false;
                if (selectedDateStr && slot.date !== selectedDateStr) return false;
                const capacity = slot.capacity || 1;
                const booked = slot.bookedCount || 0;
                if (booked >= capacity) return false;
                return true;
            }),
        [availableSlots, selectedDateStr]
    );

    const daysWithSlot = new Set(
        availableSlots
            .filter((slot) => slot.status === "available" || slot.status === "AVAILABLE")
            .map((slot) => slot.date)
    );

    // Generate 30-minute time intervals from slot's startTime to endTime
    const generateTimeSlots = (startTime, endTime) => {
        const times = [];
        const [startH, startM] = startTime.split(':').map(Number);
        const [endH, endM] = endTime.split(':').map(Number);
        let currentHour = startH;
        let currentMin = startM;

        while (currentHour < endH || (currentHour === endH && currentMin < endM)) {
            const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
            times.push(timeStr);
            currentMin += 30;
            if (currentMin >= 60) {
                currentMin = 0;
                currentHour++;
            }
        }
        return times;
    };

    // Get available time slots for selected date
    const availableTimeSlots = useMemo(() => {
        if (!bookingDate || !bookingSlotId) return [];
        const slot = availableSlots.find(s => s.id === bookingSlotId);
        if (!slot) return [];
        return generateTimeSlots(slot.startTime || "08:00", slot.endTime || "17:00");
    }, [bookingDate, bookingSlotId, availableSlots]);

    const formatDateLabel = (d) =>
        d.toLocaleDateString("vi-VN", {
            weekday: "short",
            day: "2-digit",
            month: "2-digit",
        });

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                    <h2 className="text-lg font-semibold text-slate-900">
                        Đặt lịch tư vấn / đo / thử đồ
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-slate-500 hover:text-slate-800"
                    >
                        ✕
                    </button>
                </div>

                <div className="px-4 py-4 space-y-4 text-sm">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full ${step >= 1 ? "bg-emerald-600 text-white" : "bg-slate-200"
                                }`}
                        >
                            1
                        </span>
                        <span>Chọn loại lịch</span>
                        <span className="h-px flex-1 bg-slate-200 mx-1" />
                        <span
                            className={`flex h-6 w-6 items-center justify-center rounded-full ${step >= 2 ? "bg-emerald-600 text-white" : "bg-slate-200"
                                }`}
                        >
                            2
                        </span>
                        <span>Chọn ngày & giờ</span>
                    </div>

                    {step === 1 && (
                        <div className="space-y-3">
                            <p className="text-sm text-slate-600">
                                Chọn dịch vụ chính và các dịch vụ bổ sung (nếu có)
                            </p>
                            <div className="grid grid-cols-1 gap-2">
                                {typeOptions.map((opt) => {
                                    const isPrimary = bookingType === opt.value;
                                    const isSecondary = secondaryTypes.includes(opt.value);
                                    return (
                                        <div key={opt.value} className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setBookingType(opt.value);
                                                    // Remove from secondary if was there
                                                    setSecondaryTypes(prev => prev.filter(t => t !== opt.value));
                                                }}
                                                className={`flex-1 text-left px-3 py-2 rounded-lg border text-sm ${isPrimary
                                                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                                                    : "border-slate-200 hover:bg-slate-50"
                                                    }`}
                                            >
                                                {opt.label} {isPrimary && <span className="text-xs">(Chính)</span>}
                                            </button>
                                            {!isPrimary && (
                                                <label className="flex items-center gap-1 text-xs text-slate-500 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSecondary}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSecondaryTypes(prev => [...prev, opt.value]);
                                                            } else {
                                                                setSecondaryTypes(prev => prev.filter(t => t !== opt.value));
                                                            }
                                                        }}
                                                        className="accent-emerald-600"
                                                    />
                                                    Thêm
                                                </label>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            {secondaryTypes.length > 0 && (
                                <p className="text-xs text-emerald-600 mt-2">
                                    + Dịch vụ bổ sung: {secondaryTypes.map(t => bookingTypeLabel(t)).join(", ")}
                                </p>
                            )}
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-slate-800 mb-1">
                                    Loại lịch: {bookingTypeLabel(bookingType)}
                                </p>
                                <p className="text-xs text-slate-500">
                                    Chọn một ngày trong 14 ngày tới mà tiệm có ca rảnh phù hợp.
                                </p>
                            </div>

                            <div className="grid grid-cols-4 gap-2 text-xs">
                                {next14Days.map((d) => {
                                    const dateStr = d.toISOString().split("T")[0];
                                    const hasSlot = daysWithSlot.has(dateStr);
                                    const isSelected = bookingDate === dateStr;
                                    return (
                                        <button
                                            key={dateStr}
                                            type="button"
                                            disabled={!hasSlot}
                                            onClick={() => {
                                                setBookingDate(dateStr);
                                                setBookingSlotId(null);
                                                setBookingTime && setBookingTime(null);
                                            }}
                                            className={`px-2 py-2 rounded-lg border ${!hasSlot
                                                ? "border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed"
                                                : isSelected
                                                    ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                                                    : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                                }`}
                                        >
                                            {formatDateLabel(d)}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Slot Selection */}
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-slate-800">
                                    Chọn ca làm việc
                                </p>
                                {bookingDate ? (
                                    usableSlots.length ? (
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            {usableSlots
                                                .slice()
                                                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                                .map((slot) => {
                                                    const isSelected = bookingSlotId === slot.id;
                                                    return (
                                                        <button
                                                            key={slot.id}
                                                            type="button"
                                                            onClick={() => {
                                                                setBookingSlotId(slot.id);
                                                                setBookingTime && setBookingTime(null);
                                                            }}
                                                            className={`px-2 py-2 rounded-lg border ${isSelected
                                                                ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                                                                : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                                                }`}
                                                        >
                                                            <span className="font-semibold">
                                                                {slot.tailorName || 'Nhân viên'}
                                                            </span>
                                                            <span className="block text-[10px] text-slate-500">
                                                                {slot.startTime}–{slot.endTime}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500">
                                            Ngày này hiện chưa có ca rảnh phù hợp. Vui lòng chọn ngày khác.
                                        </p>
                                    )
                                ) : (
                                    <p className="text-xs text-slate-500">
                                        Hãy chọn ngày trước rồi chọn ca.
                                    </p>
                                )}
                            </div>

                            {/* Time slot selection - 30 minute intervals */}
                            {bookingSlotId && availableTimeSlots.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-slate-800">
                                        Chọn giờ cụ thể
                                    </p>
                                    <div className="grid grid-cols-4 gap-2 text-xs">
                                        {availableTimeSlots.map((timeStr) => {
                                            const isSelected = bookingTime === timeStr;
                                            return (
                                                <button
                                                    key={timeStr}
                                                    type="button"
                                                    onClick={() => setBookingTime && setBookingTime(timeStr)}
                                                    className={`px-2 py-2 rounded-lg border ${isSelected
                                                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 font-bold"
                                                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                                                        }`}
                                                >
                                                    {timeStr}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-4 py-3 border-t border-slate-100 flex justify-between items-center text-xs">
                    <button
                        type="button"
                        onClick={() => (step === 1 ? onClose() : setStep(step - 1))}
                        className="px-3 py-1.5 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
                    >
                        {step === 1 ? "Đóng" : "Quay lại"}
                    </button>
                    <button
                        type="button"
                        disabled={step === 2 && (!bookingSlotId || !bookingTime)}
                        onClick={() => {
                            if (step === 1) {
                                setStep(2);
                            } else if (step === 2) {
                                onConfirm();
                            }
                        }}
                        className={`px-4 py-1.5 rounded-full text-white font-semibold ${step === 2 && (!bookingSlotId || !bookingTime)
                            ? "bg-slate-300 cursor-not-allowed"
                            : "bg-emerald-700 hover:bg-emerald-800"
                            }`}
                    >
                        {step === 1 ? "Tiếp tục" : "Xác nhận lịch"}
                    </button>
                </div>
            </div>
        </div>
    );
}
