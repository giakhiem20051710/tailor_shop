/**
 * Dashboard UI Components
 * Shared UI components for CustomerDashboardPage
 */

/**
 * Tag component for displaying badges
 */
export function Tag({ children }) {
    return (
        <span className="px-3 py-1 bg-amber-50 rounded-full border border-amber-200 text-[11px] font-medium text-amber-800">
            {children}
        </span>
    );
}

/**
 * Progress steps indicator
 */
export function ProgressSteps({ currentStep }) {
    const steps = [
        { num: 1, label: "Đã tiếp nhận" },
        { num: 2, label: "Đang may" },
        { num: 3, label: "Hoàn thành" }
    ];

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
                {steps.map((step) => (
                    <div key={step.num} className="flex items-center gap-2 flex-1">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStep >= step.num ? 'bg-amber-400 text-slate-900' : 'bg-slate-700 text-slate-400'
                            }`}>
                            {step.num}
                        </div>
                        <span className={`text-[10px] font-medium flex-1 ${currentStep >= step.num ? 'text-white' : 'text-slate-400'
                            }`}>
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
            <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (currentStep / 3) * 100)}%` }}
                />
            </div>
        </div>
    );
}

/**
 * Stat card for displaying metrics
 */
export function StatCard({ label, value, subtitle, color, textColor }) {
    return (
        <div className={`rounded-2xl p-4 bg-gradient-to-br ${color} ${textColor}`}>
            <p className="text-[10px] uppercase opacity-80">{label}</p>
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-[10px] opacity-80">{subtitle}</p>
        </div>
    );
}

/**
 * Tab pill button
 */
export function TabPill({ active, onClick, children }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-2 rounded-full text-xs font-medium ${active ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"
                }`}
        >
            {children}
        </button>
    );
}
