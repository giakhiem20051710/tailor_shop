/**
 * useScrollAnimation - Hook tạo animation khi element scroll vào viewport
 * Sử dụng Intersection Observer API
 */

import { useEffect, useRef, useState } from "react";

/**
 * Hook để detect khi element vào viewport và trigger animation
 * @param {Object} options - Intersection Observer options
 * @param {number} options.threshold - Phần trăm element phải visible (0-1)
 * @param {string} options.rootMargin - Margin xung quanh viewport
 * @param {boolean} options.triggerOnce - Chỉ trigger animation 1 lần
 */
export function useScrollAnimation({
    threshold = 0.1,
    rootMargin = "0px 0px -50px 0px",
    triggerOnce = true,
} = {}) {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Skip if already animated and triggerOnce is true
        if (triggerOnce && hasAnimated) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true);
                        if (triggerOnce) {
                            setHasAnimated(true);
                            observer.unobserve(element);
                        }
                    } else if (!triggerOnce) {
                        setIsVisible(false);
                    }
                });
            },
            { threshold, rootMargin }
        );

        observer.observe(element);

        return () => {
            if (element) observer.unobserve(element);
        };
    }, [threshold, rootMargin, triggerOnce, hasAnimated]);

    return { ref, isVisible };
}

/**
 * Animation CSS classes để sử dụng với hook
 */
export const animationClasses = {
    // Fade animations
    fadeIn: "opacity-0 transition-all duration-700 ease-out",
    fadeInVisible: "opacity-100",

    // Slide up animations  
    slideUp: "opacity-0 translate-y-8 transition-all duration-700 ease-out",
    slideUpVisible: "opacity-100 translate-y-0",

    // Slide in from left
    slideLeft: "opacity-0 -translate-x-8 transition-all duration-700 ease-out",
    slideLeftVisible: "opacity-100 translate-x-0",

    // Slide in from right
    slideRight: "opacity-0 translate-x-8 transition-all duration-700 ease-out",
    slideRightVisible: "opacity-100 translate-x-0",

    // Scale up
    scaleUp: "opacity-0 scale-95 transition-all duration-500 ease-out",
    scaleUpVisible: "opacity-100 scale-100",

    // Stagger delay classes (for children)
    delay100: "delay-100",
    delay200: "delay-200",
    delay300: "delay-300",
    delay400: "delay-400",
    delay500: "delay-500",
};

/**
 * Component wrapper cho scroll animation
 */
export function ScrollReveal({
    children,
    animation = "slideUp",
    delay = "",
    className = "",
    ...props
}) {
    const { ref, isVisible } = useScrollAnimation();

    const baseClass = animationClasses[animation] || animationClasses.slideUp;
    const visibleClass = animationClasses[`${animation}Visible`] || animationClasses.slideUpVisible;
    const delayClass = delay ? animationClasses[delay] || delay : "";

    return (
        <div
            ref={ref}
            className={`${baseClass} ${isVisible ? visibleClass : ""} ${delayClass} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export default useScrollAnimation;
