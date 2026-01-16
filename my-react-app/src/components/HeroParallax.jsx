/**
 * HeroParallax - Hero section với hiệu ứng parallax
 * Features:
 * - Background image parallax khi scroll
 * - Overlay gradient
 * - Animated text
 * - CTA buttons
 */

import { useState, useEffect, useRef } from "react";

export default function HeroParallax({
    backgroundImage,
    title,
    subtitle,
    description,
    primaryCTA,
    secondaryCTA,
    overlayOpacity = 0.4,
    parallaxSpeed = 0.3,
    height = "100vh",
    minHeight = "600px",
    children,
}) {
    const [scrollY, setScrollY] = useState(0);
    const heroRef = useRef(null);
    const [isInView, setIsInView] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            if (heroRef.current) {
                const rect = heroRef.current.getBoundingClientRect();
                const heroHeight = rect.height;

                // Only update if hero is in view
                if (rect.bottom > 0) {
                    setScrollY(window.scrollY);
                    setIsInView(true);
                } else {
                    setIsInView(false);
                }
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    const parallaxOffset = scrollY * parallaxSpeed;

    return (
        <section
            ref={heroRef}
            className="relative overflow-hidden"
            style={{ height, minHeight }}
        >
            {/* Parallax Background */}
            <div
                className="absolute inset-0 w-full h-[120%] -top-[10%]"
                style={{
                    transform: `translateY(${parallaxOffset}px)`,
                    willChange: isInView ? "transform" : "auto",
                }}
            >
                <img
                    src={backgroundImage}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="eager"
                />
            </div>

            {/* Overlay Gradient */}
            <div
                className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent"
                style={{ opacity: overlayOpacity + 0.3 }}
            />

            {/* Additional bottom gradient for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Content */}
            <div className="relative h-full flex items-center">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 w-full">
                    <div className="max-w-2xl">
                        {/* Subtitle/Tag */}
                        {subtitle && (
                            <div
                                className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
                                style={{
                                    transform: `translateY(${scrollY * 0.1}px)`,
                                    opacity: Math.max(0, 1 - scrollY * 0.002),
                                }}
                            >
                                <span className="w-2 h-2 bg-[#F2A500] rounded-full animate-pulse" />
                                <span className="text-white/90 text-sm font-medium tracking-wide uppercase">
                                    {subtitle}
                                </span>
                            </div>
                        )}

                        {/* Title */}
                        <h1
                            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
                            style={{
                                transform: `translateY(${scrollY * 0.15}px)`,
                                opacity: Math.max(0, 1 - scrollY * 0.0015),
                            }}
                        >
                            {title}
                        </h1>

                        {/* Description */}
                        {description && (
                            <p
                                className="text-lg md:text-xl text-white/80 mb-8 leading-relaxed max-w-xl"
                                style={{
                                    transform: `translateY(${scrollY * 0.2}px)`,
                                    opacity: Math.max(0, 1 - scrollY * 0.0018),
                                }}
                            >
                                {description}
                            </p>
                        )}

                        {/* CTA Buttons */}
                        <div
                            className="flex flex-wrap gap-4"
                            style={{
                                transform: `translateY(${scrollY * 0.25}px)`,
                                opacity: Math.max(0, 1 - scrollY * 0.002),
                            }}
                        >
                            {primaryCTA && (
                                <a
                                    href={primaryCTA.href}
                                    className="
                    inline-flex items-center gap-2
                    px-8 py-4 rounded-full
                    bg-gradient-to-r from-[#F2A500] to-[#E89600]
                    text-white font-semibold text-lg
                    shadow-lg shadow-amber-500/30
                    hover:shadow-xl hover:shadow-amber-500/40
                    hover:scale-105
                    transition-all duration-300
                  "
                                >
                                    {primaryCTA.icon && <span>{primaryCTA.icon}</span>}
                                    {primaryCTA.text}
                                </a>
                            )}

                            {secondaryCTA && (
                                <a
                                    href={secondaryCTA.href}
                                    className="
                    inline-flex items-center gap-2
                    px-8 py-4 rounded-full
                    bg-white/10 backdrop-blur-sm
                    text-white font-semibold text-lg
                    border border-white/30
                    hover:bg-white/20 hover:border-white/50
                    transition-all duration-300
                  "
                                >
                                    {secondaryCTA.icon && <span>{secondaryCTA.icon}</span>}
                                    {secondaryCTA.text}
                                </a>
                            )}
                        </div>

                        {/* Custom children content */}
                        {children}
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                style={{
                    opacity: Math.max(0, 1 - scrollY * 0.005),
                }}
            >
                <span className="text-white/60 text-sm">Cuộn xuống</span>
                <div className="w-6 h-10 border-2 border-white/40 rounded-full flex justify-center pt-2">
                    <div className="w-1.5 h-3 bg-white/60 rounded-full animate-bounce" />
                </div>
            </div>
        </section>
    );
}

/**
 * HeroParallaxSimple - Version đơn giản hơn với CSS only
 */
export function HeroParallaxSimple({
    backgroundImage,
    title,
    subtitle,
    children,
    height = "80vh",
}) {
    return (
        <section
            className="relative overflow-hidden flex items-center"
            style={{ height }}
        >
            {/* Background with CSS parallax */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-fixed"
                style={{ backgroundImage: `url(${backgroundImage})` }}
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />

            {/* Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 w-full">
                <div className="max-w-2xl text-white">
                    {subtitle && (
                        <p className="text-[#F2A500] text-sm uppercase tracking-widest mb-4">
                            {subtitle}
                        </p>
                    )}
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">{title}</h1>
                    {children}
                </div>
            </div>
        </section>
    );
}
