/**
 * ScheduleTutorial - Tutorial modal for Schedule page
 * Helps admin and staff learn how to use the appointment scheduling features
 */
import { useState, useEffect } from "react";

const STORAGE_KEY = "schedule_tutorial_dismissed";

const tutorialSteps = [
    {
        id: 1,
        icon: "📅",
        title: "Xem lịch theo ngày/tuần",
        description: "Chọn ngày cụ thể để xem lịch hẹn trong ngày đó. Nhấn nút \"Xem lịch tuần\" để xem tổng quan tất cả lịch hẹn trong tuần, giúp bạn dễ dàng quản lý và sắp xếp công việc.",
        tips: [
            "Dùng nút ← Hôm qua / Hôm nay / Ngày mai → để chuyển ngày nhanh",
            "Chọn ngày từ lịch để xem lịch hẹn cụ thể",
            "Xem lịch tuần để có cái nhìn tổng quan"
        ]
    },
    {
        id: 2,
        icon: "🔍",
        title: "Lọc và tìm kiếm lịch hẹn",
        description: "Sử dụng các bộ lọc để nhanh chóng tìm lịch hẹn cần quan tâm. Lọc theo loại lịch, thợ may phụ trách, hoặc trạng thái đơn hàng.",
        tips: [
            "Lọc theo loại: Thử đồ, Nhận đồ, Tư vấn, Đo số đo",
            "Lọc theo thợ may để xem lịch từng người",
            "Tìm kiếm bằng tên, SĐT hoặc mã đơn hàng"
        ]
    },
    {
        id: 3,
        icon: "➕",
        title: "Thêm ca rảnh cho thợ may",
        description: "Nhấn nút \"+ Thêm ca rảnh\" để tạo khung giờ làm việc mới cho thợ may. Điền đầy đủ ngày, giờ, loại công việc và thợ phụ trách.",
        tips: [
            "Chọn thợ may phụ trách cho ca rảnh",
            "Đặt thời gian bắt đầu và kết thúc phù hợp",
            "Chọn loại lịch: Tư vấn, Đo số đo, Thử đồ, Nhận đồ",
            "Đặt số khách tối đa cho mỗi ca"
        ]
    },
    {
        id: 4,
        icon: "✅",
        title: "Xem chi tiết & cập nhật trạng thái",
        description: "Nhấn vào một lịch hẹn để xem chi tiết. Từ đây bạn có thể đánh dấu hoàn thành, hủy lịch hoặc chặn khung giờ.",
        tips: [
            "Đánh dấu \"Xong\" khi khách đã đến",
            "\"Hủy lịch\" nếu khách không đến",
            "\"Chặn giờ\" để ngừng nhận đặt lịch",
            "Xem thông tin khách hàng và đơn hàng liên quan"
        ]
    }
];

export default function ScheduleTutorial({ onClose, forceShow = false }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    // Check if tutorial was dismissed
    useEffect(() => {
        if (!forceShow) {
            const dismissed = localStorage.getItem(STORAGE_KEY);
            if (dismissed === "true") {
                onClose?.();
            }
        }
    }, [forceShow, onClose]);

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem(STORAGE_KEY, "true");
        }
        onClose?.();
    };

    const handleNext = () => {
        if (currentStep < tutorialSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const step = tutorialSteps[currentStep];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <span>📖</span>
                            <span>Hướng dẫn sử dụng Lịch hẹn</span>
                        </h2>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
                        >
                            ✕
                        </button>
                    </div>
                    {/* Progress dots */}
                    <div className="flex justify-center gap-2 mt-3">
                        {tutorialSteps.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentStep(idx)}
                                className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentStep
                                        ? "bg-white w-6"
                                        : idx < currentStep
                                            ? "bg-white/70"
                                            : "bg-white/30"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Step icon and title */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100 text-4xl mb-3">
                            {step.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800">
                            {step.title}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Bước {currentStep + 1} / {tutorialSteps.length}
                        </p>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm leading-relaxed text-center mb-6">
                        {step.description}
                    </p>

                    {/* Tips */}
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-2">
                            💡 Mẹo hay
                        </p>
                        <ul className="space-y-2">
                            {step.tips.map((tip, idx) => (
                                <li key={idx} className="flex items-start gap-2 text-sm text-emerald-800">
                                    <span className="text-emerald-500 mt-0.5">•</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        {/* Don't show again */}
                        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={dontShowAgain}
                                onChange={(e) => setDontShowAgain(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <span>Không hiện lại</span>
                        </label>

                        {/* Navigation buttons */}
                        <div className="flex gap-2">
                            {currentStep > 0 && (
                                <button
                                    onClick={handlePrev}
                                    className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-100 transition"
                                >
                                    ← Quay lại
                                </button>
                            )}
                            <button
                                onClick={handleNext}
                                className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition"
                            >
                                {currentStep === tutorialSteps.length - 1 ? "Hoàn tất ✓" : "Tiếp theo →"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper to check if should show tutorial
export function shouldShowScheduleTutorial() {
    return localStorage.getItem(STORAGE_KEY) !== "true";
}

// Helper to reset tutorial (for testing)
export function resetScheduleTutorial() {
    localStorage.removeItem(STORAGE_KEY);
}
