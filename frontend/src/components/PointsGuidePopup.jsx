import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { POINTS_CONFIG } from '../services/pointsService.js';

/**
 * Points Guide Popup
 * Trust-building popup to explain the points system to customers
 */
export default function PointsGuidePopup({ isOpen, onClose, userPoints = 0 }) {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);

    const steps = [
        {
            title: '👋 Chào mừng đến chương trình Xu!',
            subtitle: 'Tích xu - Đổi quà - Tiết kiệm thật',
            content: (
                <div className="space-y-4">
                    <div className="bg-gradient-to-r from-amber-100 to-amber-50 rounded-2xl p-5 border border-amber-200">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-2xl">
                                💰
                            </div>
                            <div>
                                <p className="font-bold text-amber-900 text-lg">1 Xu = 500đ</p>
                                <p className="text-amber-700 text-sm">Quy đổi minh bạch, rõ ràng</p>
                            </div>
                        </div>
                        <p className="text-amber-800 text-sm">
                            Xu của bạn có giá trị <strong>thực sự</strong>. Không giới hạn, không điều kiện ẩn!
                        </p>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                        <span className="text-2xl">✅</span>
                        <div>
                            <p className="font-semibold text-green-800">Cam kết của My Hiền Tailor</p>
                            <p className="text-green-700 text-sm">Xu không bao giờ mất giá trị</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: '💎 Cách kiếm Xu dễ dàng',
            subtitle: 'Nhiều cách để tích lũy',
            content: (
                <div className="space-y-3">
                    {[
                        { icon: '🛒', action: 'Mua sắm', detail: '1 xu / 50.000đ', highlight: true },
                        { icon: '📅', action: 'Điểm danh', detail: '10-100 xu/ngày', highlight: false },
                        { icon: '⭐', action: 'Viết review', detail: '20 xu/review', highlight: false },
                        { icon: '👥', action: 'Giới thiệu bạn', detail: '100 xu (khi bạn mua)', highlight: false },
                        { icon: '🎂', action: 'Sinh nhật', detail: '200 xu', highlight: false },
                        { icon: '🏆', action: 'Hoàn thành thử thách', detail: '50-1000 xu', highlight: false },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className={`flex items-center gap-3 p-3 rounded-xl border ${item.highlight
                                    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200'
                                    : 'bg-gray-50 border-gray-100'
                                }`}
                        >
                            <span className="text-xl">{item.icon}</span>
                            <div className="flex-1">
                                <p className={`font-medium ${item.highlight ? 'text-purple-900' : 'text-gray-800'}`}>
                                    {item.action}
                                </p>
                            </div>
                            <span className={`text-sm font-bold ${item.highlight ? 'text-purple-600' : 'text-gray-600'
                                }`}>
                                +{item.detail}
                            </span>
                        </div>
                    ))}
                </div>
            )
        },
        {
            title: '🎁 Sử dụng Xu thế nào?',
            subtitle: 'Giảm giá trực tiếp khi thanh toán',
            content: (
                <div className="space-y-4">
                    <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-5">
                        <p className="text-center text-gray-500 text-sm mb-3">Ví dụ đơn hàng</p>
                        <div className="space-y-2">
                            <div className="flex justify-between text-gray-700">
                                <span>Áo dài lụa cao cấp</span>
                                <span>2.500.000đ</span>
                            </div>
                            <div className="flex justify-between text-green-600 font-semibold">
                                <span>Dùng 200 xu</span>
                                <span>-100.000đ</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between text-lg font-bold">
                                <span>Thanh toán</span>
                                <span className="text-purple-600">2.400.000đ</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-blue-50 rounded-xl text-center">
                            <p className="text-2xl font-bold text-blue-600">20%</p>
                            <p className="text-xs text-blue-700">Max giảm/đơn</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-xl text-center">
                            <p className="text-2xl font-bold text-green-600">50</p>
                            <p className="text-xs text-green-700">Xu tối thiểu</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: '🔒 Cam kết minh bạch',
            subtitle: 'Những điều bạn cần biết',
            content: (
                <div className="space-y-3">
                    {[
                        { icon: '✅', text: 'Xu có giá trị 12 tháng kể từ ngày nhận', color: 'green' },
                        { icon: '✅', text: 'Xu không bị mất khi đổi voucher', color: 'green' },
                        { icon: '✅', text: 'Có thể dùng cùng mã giảm giá', color: 'green' },
                        { icon: '✅', text: 'Xem lịch sử giao dịch bất cứ lúc nào', color: 'green' },
                        { icon: '⚠️', text: 'Không quy đổi thành tiền mặt', color: 'amber' },
                        { icon: '⚠️', text: 'Nhắc nhở 30 ngày trước khi hết hạn', color: 'amber' },
                    ].map((item, i) => (
                        <div
                            key={i}
                            className={`flex items-center gap-3 p-3 rounded-lg ${item.color === 'green' ? 'bg-green-50' : 'bg-amber-50'
                                }`}
                        >
                            <span className="text-lg">{item.icon}</span>
                            <p className={`text-sm ${item.color === 'green' ? 'text-green-800' : 'text-amber-800'
                                }`}>
                                {item.text}
                            </p>
                        </div>
                    ))}
                </div>
            )
        },
        {
            title: '🚀 Bắt đầu tích xu ngay!',
            subtitle: userPoints > 0 ? `Bạn đang có ${userPoints} xu` : 'Điểm danh ngay để nhận xu đầu tiên',
            content: (
                <div className="space-y-4 text-center">
                    <div className="inline-block p-6 bg-gradient-to-br from-amber-400 to-amber-500 rounded-3xl text-white shadow-lg">
                        <div className="text-5xl font-bold mb-1">{userPoints}</div>
                        <div className="text-amber-100">xu hiện có</div>
                    </div>

                    <p className="text-gray-600">
                        = <strong className="text-purple-600">{(userPoints * 500).toLocaleString()}đ</strong> giảm giá
                    </p>

                    <div className="space-y-2 pt-2">
                        <button
                            onClick={() => { onClose(); navigate('/checkin'); }}
                            className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all"
                        >
                            📅 Điểm danh nhận xu
                        </button>
                        <button
                            onClick={() => { onClose(); navigate('/S'); }}
                            className="w-full py-3 bg-amber-100 text-amber-800 rounded-xl font-semibold hover:bg-amber-200 transition-all"
                        >
                            🏆 Xem thử thách
                        </button>
                    </div>
                </div>
            )
        }
    ];

    if (!isOpen) return null;

    const currentStep = steps[step];
    const isLastStep = step === steps.length - 1;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[10001] p-4">
            <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white text-center relative">
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30"
                    >
                        ✕
                    </button>
                    <div className="text-3xl mb-2">{currentStep.title.split(' ')[0]}</div>
                    <h2 className="text-xl font-bold">{currentStep.title.slice(currentStep.title.indexOf(' ') + 1)}</h2>
                    <p className="text-purple-200 text-sm mt-1">{currentStep.subtitle}</p>
                </div>

                {/* Progress dots */}
                <div className="flex justify-center gap-2 py-4">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-all ${i === step ? 'w-6 bg-purple-600' : i < step ? 'bg-purple-300' : 'bg-gray-200'
                                }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="px-6 pb-6 max-h-[50vh] overflow-y-auto">
                    {currentStep.content}
                </div>

                {/* Footer */}
                <div className="px-6 pb-6 flex gap-3">
                    {step > 0 && (
                        <button
                            onClick={() => setStep(step - 1)}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
                        >
                            ← Quay lại
                        </button>
                    )}
                    <button
                        onClick={() => isLastStep ? onClose() : setStep(step + 1)}
                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all"
                    >
                        {isLastStep ? 'Bắt đầu ngay!' : 'Tiếp theo →'}
                    </button>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
        </div>
    );
}

/**
 * Small Points Badge to show in header
 */
export function PointsBadge({ points = 0, onClick }) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-100 to-amber-50 border border-amber-200 rounded-full hover:from-amber-200 hover:to-amber-100 transition-all"
        >
            <span className="text-lg">💰</span>
            <span className="font-bold text-amber-700">{points.toLocaleString()}</span>
            <span className="text-amber-600 text-sm">xu</span>
        </button>
    );
}

/**
 * Points Info Card for Dashboard
 */
export function PointsInfoCard({ points = 0, onLearnMore }) {
    const valueInVnd = points * POINTS_CONFIG.spend.valuePerPoint;

    return (
        <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-5 text-white relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full" />

            <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-2xl">💰</span>
                    <span className="text-purple-200 text-sm">Ví Xu của bạn</span>
                </div>

                <div className="text-4xl font-bold mb-1">{points.toLocaleString()} xu</div>
                <div className="text-purple-200">= {valueInVnd.toLocaleString()}đ giảm giá</div>

                <button
                    onClick={onLearnMore}
                    className="mt-4 px-4 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-all"
                >
                    Tìm hiểu thêm →
                </button>
            </div>
        </div>
    );
}
