/**
 * Skeleton - Component hiển thị loading state đẹp mắt
 * Sử dụng animation shimmer effect
 */

export function Skeleton({ className = "", variant = "rect", width, height }) {
    const baseClass = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:400%_100%]";

    const variants = {
        rect: "rounded-lg",
        circle: "rounded-full",
        text: "rounded h-4",
    };

    const style = {
        width: width || undefined,
        height: height || undefined,
    };

    return (
        <div
            className={`${baseClass} ${variants[variant]} ${className}`}
            style={style}
        />
    );
}

/**
 * ProductCardSkeleton - Skeleton cho product card
 */
export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
            {/* Image skeleton */}
            <Skeleton className="w-full h-64" />

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <Skeleton className="w-3/4 h-5" />

                {/* Description */}
                <div className="space-y-2">
                    <Skeleton className="w-full h-3" />
                    <Skeleton className="w-2/3 h-3" />
                </div>

                {/* Price + Button */}
                <div className="flex items-center justify-between pt-2">
                    <Skeleton className="w-24 h-6" />
                    <Skeleton className="w-20 h-8 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

/**
 * ProductGridSkeleton - Grid của nhiều ProductCardSkeleton
 */
export function ProductGridSkeleton({ count = 8 }) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: count }).map((_, i) => (
                <ProductCardSkeleton key={i} />
            ))}
        </div>
    );
}

/**
 * FabricCardSkeleton - Skeleton cho fabric card
 */
export function FabricCardSkeleton() {
    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            {/* Image */}
            <Skeleton className="w-full h-48" />

            {/* Content */}
            <div className="p-4 space-y-2">
                <Skeleton className="w-3/4 h-5" />
                <Skeleton className="w-1/2 h-4" />
                <div className="flex gap-2 pt-2">
                    <Skeleton className="w-16 h-6 rounded-full" />
                    <Skeleton className="w-16 h-6 rounded-full" />
                </div>
            </div>
        </div>
    );
}

/**
 * TableRowSkeleton - Skeleton cho table row
 */
export function TableRowSkeleton({ columns = 5 }) {
    return (
        <tr className="border-b border-gray-100">
            {Array.from({ length: columns }).map((_, i) => (
                <td key={i} className="px-4 py-3">
                    <Skeleton className="w-full h-4" />
                </td>
            ))}
        </tr>
    );
}

/**
 * TableSkeleton - Skeleton cho cả table
 */
export function TableSkeleton({ rows = 5, columns = 5 }) {
    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
            {/* Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex gap-4">
                    {Array.from({ length: columns }).map((_, i) => (
                        <Skeleton key={i} className="flex-1 h-5" />
                    ))}
                </div>
            </div>

            {/* Body */}
            <table className="w-full">
                <tbody>
                    {Array.from({ length: rows }).map((_, i) => (
                        <TableRowSkeleton key={i} columns={columns} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/**
 * DashboardCardSkeleton - Skeleton cho dashboard stats card
 */
export function DashboardCardSkeleton() {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <Skeleton className="w-24 h-4" />
                    <Skeleton className="w-32 h-8" />
                </div>
                <Skeleton className="w-12 h-12" variant="circle" />
            </div>
            <Skeleton className="w-20 h-3 mt-4" />
        </div>
    );
}

/**
 * ProfileSkeleton - Skeleton cho trang profile
 */
export function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4">
                <Skeleton className="w-20 h-20" variant="circle" />
                <div className="space-y-2">
                    <Skeleton className="w-40 h-6" />
                    <Skeleton className="w-32 h-4" />
                </div>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="bg-gray-50 rounded-lg p-4">
                        <Skeleton className="w-20 h-3 mb-2" />
                        <Skeleton className="w-full h-5" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Skeleton;
