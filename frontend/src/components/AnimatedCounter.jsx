/**
 * AnimatedCounter - Component đếm số với animation
 * Tạo hiệu ứng wow khi scroll đến
 */

import { useState, useEffect, useRef } from "react";

/**
 * Hook để animate số từ 0 đến target
 */
function useCountUp(target, duration = 2000, startOnVisible = true) {
    const [count, setCount] = useState(0);
    const [hasStarted, setHasStarted] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!startOnVisible) {
            setHasStarted(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !hasStarted) {
                    setHasStarted(true);
                }
            },
            { threshold: 0.3 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [startOnVisible, hasStarted]);

    useEffect(() => {
        if (!hasStarted) return;

        const startTime = Date.now();
        const startValue = 0;

        // Easing function (easeOutExpo)
        const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutExpo(progress);
            const currentValue = Math.floor(startValue + (target - startValue) * easedProgress);

            setCount(currentValue);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [target, duration, hasStarted]);

    return { count, ref };
}

/**
 * AnimatedCounter - Component hiển thị số với animation đếm lên
 */
export function AnimatedCounter({
    value,
    suffix = "",
    prefix = "",
    duration = 2000,
    className = "",
    formatNumber = true,
}) {
    // Parse value nếu là string như "12.4K"
    const parseValue = (val) => {
        if (typeof val === "number") return val;
        if (typeof val !== "string") return 0;

        const cleaned = val.replace(/[^0-9.KMkm+]/g, "");
        let num = parseFloat(cleaned) || 0;

        if (cleaned.toLowerCase().includes("k")) num *= 1000;
        if (cleaned.toLowerCase().includes("m")) num *= 1000000;

        return Math.floor(num);
    };

    const numericValue = parseValue(value);
    const { count, ref } = useCountUp(numericValue, duration);

    // Format output
    const formatOutput = (num) => {
        if (!formatNumber) return num.toString();

        if (num >= 1000000) {
            return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
        }
        return num.toLocaleString("vi-VN");
    };

    // Check if original value had + suffix
    const hasPlus = typeof value === "string" && value.includes("+");

    return (
        <span ref={ref} className={className}>
            {prefix}
            {formatOutput(count)}
            {hasPlus && "+"}
            {suffix}
        </span>
    );
}

/**
 * StatCard - Card thống kê với counter animation
 */
export function StatCard({
    label,
    value,
    description,
    icon,
    suffix = "",
    prefix = "",
    className = "",
}) {
    return (
        <div className={`text-center ${className}`}>
            <div className="text-3xl md:text-4xl font-bold text-[#111827] mb-1">
                <AnimatedCounter
                    value={value}
                    suffix={suffix}
                    prefix={prefix}
                    duration={2000}
                />
            </div>
            <div className="text-sm font-medium text-[#374151]">{label}</div>
            {description && (
                <div className="text-xs text-[#6B7280] mt-1">{description}</div>
            )}
        </div>
    );
}

/**
 * StatsRow - Hiển thị hàng thống kê với animation
 */
export function StatsRow({ stats, className = "" }) {
    return (
        <div className={`flex items-center justify-center gap-8 md:gap-16 ${className}`}>
            {stats.map((stat, index) => (
                <StatCard
                    key={index}
                    label={stat.label}
                    value={stat.value}
                    description={stat.description}
                    icon={stat.icon}
                    suffix={stat.suffix}
                    prefix={stat.prefix}
                />
            ))}
        </div>
    );
}

export default AnimatedCounter;
