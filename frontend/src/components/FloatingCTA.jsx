/**
 * FloatingCTA - Nút "Đặt may nhanh" luôn hiển thị góc phải màn hình
 * Features:
 * - Animation pulse để thu hút sự chú ý
 * - Hiện/ẩn khi scroll
 * - Responsive: icon-only trên mobile
 * - Multiple action options
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function FloatingCTA({
    primaryText = "Đặt may nhanh",
    primaryIcon = "✂️",
    primaryLink = "/customize-product",
    showSecondary = true,
    secondaryActions = [
        { icon: "📞", label: "Hotline", href: "tel:0901134256", color: "bg-green-500" },
        { icon: "💬", label: "Zalo", href: "https://zalo.me/0901134256", color: "bg-blue-500" },
    ],
}) {
    const navigate = useNavigate();
    const [isVisible, setIsVisible] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);

    // Hide when scrolling down, show when scrolling up
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            if (currentScrollY > lastScrollY && currentScrollY > 300) {
                setIsVisible(false);
            } else {
                setIsVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    const handlePrimaryClick = () => {
        if (primaryLink.startsWith("http") || primaryLink.startsWith("tel:")) {
            window.location.href = primaryLink;
        } else {
            navigate(primaryLink);
        }
    };

    return (
        <div
            className={`
        fixed bottom-6 left-6 z-40
        flex flex-col items-start gap-3
        transition-all duration-500
        ${isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0"}
      `}
        >
            {/* Secondary Actions - expanded */}
            {showSecondary && isExpanded && (
                <div className="flex flex-col gap-2 animate-fade-in-up">
                    {secondaryActions.map((action, idx) => (
                        <a
                            key={idx}
                            href={action.href}
                            target={action.href.startsWith("http") ? "_blank" : undefined}
                            rel="noopener noreferrer"
                            className={`
                flex items-center gap-2 px-4 py-2.5
                ${action.color} text-white
                rounded-full shadow-lg
                hover:scale-105 transition-transform
                text-sm font-medium
              `}
                        >
                            <span className="text-lg">{action.icon}</span>
                            <span className="hidden sm:inline">{action.label}</span>
                        </a>
                    ))}
                </div>
            )}

            {/* Primary CTA Button */}
            <div className="flex items-center gap-2">
                {/* Expand/Collapse Toggle */}
                {showSecondary && (
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`
              w-12 h-12 rounded-full
              bg-white shadow-lg border border-gray-200
              flex items-center justify-center
              hover:bg-gray-50 transition-colors
              ${isExpanded ? "rotate-45" : ""}
              transition-transform duration-300
            `}
                        aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
                    >
                        <span className="text-xl">{isExpanded ? "✕" : "💬"}</span>
                    </button>
                )}

                {/* Main CTA */}
                <button
                    onClick={handlePrimaryClick}
                    className="
            group flex items-center gap-2
            bg-gradient-to-r from-[#F2A500] to-[#E89600]
            text-white font-semibold
            px-5 py-3.5 rounded-full
            shadow-lg shadow-amber-500/30
            hover:shadow-xl hover:shadow-amber-500/40
            hover:scale-105
            transition-all duration-300
            animate-pulse-glow
          "
                >
                    <span className="text-xl group-hover:rotate-12 transition-transform">
                        {primaryIcon}
                    </span>
                    <span className="hidden sm:inline">{primaryText}</span>
                    <span className="sm:hidden">Đặt may</span>
                    <svg
                        className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </button>
            </div>

            {/* Tooltip hint on mobile */}
            <div className="sm:hidden absolute -top-8 right-0 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {primaryText}
            </div>
        </div>
    );
}

/**
 * FloatingCTASimple - Version đơn giản chỉ có 1 nút
 */
export function FloatingCTASimple({
    text = "Đặt may nhanh",
    icon = "✂️",
    onClick,
    href = "/customize-product",
}) {
    const navigate = useNavigate();

    const handleClick = () => {
        if (onClick) {
            onClick();
        } else if (href.startsWith("http") || href.startsWith("tel:")) {
            window.location.href = href;
        } else {
            navigate(href);
        }
    };

    return (
        <button
            onClick={handleClick}
            className="
        fixed bottom-6 right-6 z-50
        flex items-center gap-2
        bg-gradient-to-r from-[#F2A500] to-[#E89600]
        text-white font-semibold
        px-5 py-3.5 rounded-full
        shadow-lg shadow-amber-500/30
        hover:shadow-xl hover:shadow-amber-500/40
        hover:scale-105
        transition-all duration-300
        animate-pulse-glow
      "
        >
            <span className="text-xl">{icon}</span>
            <span className="hidden sm:inline">{text}</span>
            <span className="sm:hidden">Đặt may</span>
        </button>
    );
}
