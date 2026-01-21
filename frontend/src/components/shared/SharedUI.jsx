/**
 * Shared UI Components
 * Reusable UI components used across multiple pages
 */

/**
 * InfoChip - Displays a labeled value in a chip format
 */
export function InfoChip({ label, value }) {
    return (
        <div className="bg-[#F9FAFB] rounded-lg px-3 py-2 border border-[#E5E7EB]">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#9CA3AF]">
                {label}
            </p>
            <p className="text-[12px] text-[#111827] mt-0.5 font-medium">{value}</p>
        </div>
    );
}

/**
 * DetailRow - Displays a labeled value in a row format
 */
export function DetailRow({ label, value }) {
    return (
        <div>
            <p className="text-[11px] text-[#9CA3AF] uppercase tracking-[0.12em]">
                {label}
            </p>
            <p className="text-[12px] text-[#111827] font-medium">{value}</p>
        </div>
    );
}

/**
 * ConfirmModal - Reusable confirmation modal
 */
export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = "Xác nhận",
    cancelText = "Hủy",
    confirmColor = "bg-red-600 hover:bg-red-700",
    loading = false
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
                <h3 className="text-lg font-semibold text-[#111827] mb-2">{title}</h3>
                <p className="text-sm text-[#6B7280] mb-6">{message}</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-[#374151] text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-4 py-2 rounded-lg text-white text-sm font-medium ${confirmColor} disabled:opacity-50 flex items-center gap-2`}
                    >
                        {loading && (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        )}
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}

/**
 * LoadingSpinner - Simple loading indicator
 */
export function LoadingSpinner({ size = "md", text = "" }) {
    const sizeClasses = {
        sm: "w-4 h-4 border-2",
        md: "w-8 h-8 border-3",
        lg: "w-12 h-12 border-4",
    };

    return (
        <div className="flex flex-col items-center justify-center gap-3">
            <div
                className={`${sizeClasses[size]} border-[#1B4332] border-t-transparent rounded-full animate-spin`}
            ></div>
            {text && <p className="text-sm text-[#6B7280]">{text}</p>}
        </div>
    );
}

/**
 * EmptyState - Empty state placeholder
 */
export function EmptyState({ icon = "📦", title, description, action }) {
    return (
        <div className="text-center py-16">
            <div className="inline-block p-6 rounded-[24px] bg-gradient-to-br from-[#FFF7E6] to-[#F8F4EC] border border-[#E4D8C3]">
                <p className="text-[48px] mb-3">{icon}</p>
                <p className="text-[16px] font-semibold text-[#1B4332] mb-1">{title}</p>
                {description && <p className="text-[13px] text-[#6B7280] mb-4">{description}</p>}
                {action}
            </div>
        </div>
    );
}

/**
 * PageHeader - Consistent page header
 */
export function PageHeader({ title, subtitle, badge, actions }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
                {badge && (
                    <p className="text-xs uppercase tracking-[0.3em] text-[#AD7A2A] mb-1">
                        {badge}
                    </p>
                )}
                <h1 className="text-2xl md:text-3xl font-semibold text-[#1F2A37]">{title}</h1>
                {subtitle && <p className="text-sm text-[#6B7280] mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex gap-3">{actions}</div>}
        </div>
    );
}
