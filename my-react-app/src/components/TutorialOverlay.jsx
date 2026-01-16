import { useState, useEffect, useCallback, useRef } from "react";

/**
 * TutorialOverlay - Game-like interactive tutorial component
 * 
 * Usage:
 * <TutorialOverlay 
 *   steps={[
 *     { target: "#name-input", title: "Họ và tên", content: "Điền tên đầy đủ của bạn", position: "bottom" },
 *     { target: "#phone-input", title: "Số điện thoại", content: "Chúng tôi sẽ liên hệ qua số này", position: "right" },
 *   ]}
 *   onComplete={() => console.log("Tutorial completed!")}
 *   storageKey="order-form-tutorial"
 * />
 */

const TutorialOverlay = ({
    steps = [],
    onComplete,
    storageKey = "tutorial-completed",
    showOnFirstVisit = true
}) => {
    const [isActive, setIsActive] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [targetRect, setTargetRect] = useState(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isScrolling, setIsScrolling] = useState(false);
    const updateTimeoutRef = useRef(null);

    // Check if tutorial should show
    useEffect(() => {
        if (showOnFirstVisit && steps.length > 0) {
            const completed = localStorage.getItem(storageKey);
            if (!completed) {
                // Delay start for page to fully load
                const timer = setTimeout(() => setIsActive(true), 1000);
                return () => clearTimeout(timer);
            }
        }
    }, [showOnFirstVisit, storageKey, steps.length]);

    // Update target element position
    const updateTargetPosition = useCallback(() => {
        if (!isActive || currentStep >= steps.length) return;

        const step = steps[currentStep];
        const element = document.querySelector(step.target);

        if (element) {
            const rect = element.getBoundingClientRect();

            // Check if element is in viewport
            const isInViewport = rect.top >= 0 &&
                rect.bottom <= window.innerHeight &&
                rect.left >= 0 &&
                rect.right <= window.innerWidth;

            // If not in viewport, scroll to it first
            if (!isInViewport && !isScrolling) {
                setIsScrolling(true);
                element.scrollIntoView({ behavior: "smooth", block: "center" });

                // Update position after scroll completes
                if (updateTimeoutRef.current) {
                    clearTimeout(updateTimeoutRef.current);
                }
                updateTimeoutRef.current = setTimeout(() => {
                    const newRect = element.getBoundingClientRect();
                    setTargetRect({
                        top: newRect.top + window.scrollY,
                        left: newRect.left + window.scrollX,
                        width: newRect.width,
                        height: newRect.height,
                        viewportTop: newRect.top,
                        viewportLeft: newRect.left,
                    });
                    setIsScrolling(false);
                }, 500);
            } else if (!isScrolling) {
                setTargetRect({
                    top: rect.top + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width,
                    height: rect.height,
                    viewportTop: rect.top,
                    viewportLeft: rect.left,
                });
            }
        } else {
            // Element not found - show tooltip in center
            setTargetRect(null);
        }
    }, [isActive, currentStep, steps, isScrolling]);

    useEffect(() => {
        updateTargetPosition();

        const handleScroll = () => {
            if (!isScrolling) {
                updateTargetPosition();
            }
        };

        window.addEventListener("resize", updateTargetPosition);
        window.addEventListener("scroll", handleScroll);

        return () => {
            window.removeEventListener("resize", updateTargetPosition);
            window.removeEventListener("scroll", handleScroll);
            if (updateTimeoutRef.current) {
                clearTimeout(updateTimeoutRef.current);
            }
        };
    }, [updateTargetPosition, isScrolling]);

    // Re-update position when step changes
    useEffect(() => {
        if (isActive) {
            // Small delay to allow DOM to update
            const timer = setTimeout(() => {
                updateTargetPosition();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [currentStep, isActive, updateTargetPosition]);

    // Navigate to next step
    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setIsAnimating(true);
            setTargetRect(null); // Reset target for transition
            setTimeout(() => {
                setCurrentStep(prev => prev + 1);
                setIsAnimating(false);
            }, 250);
        } else {
            handleComplete();
        }
    };

    // Navigate to previous step
    const handlePrev = () => {
        if (currentStep > 0) {
            setIsAnimating(true);
            setTargetRect(null);
            setTimeout(() => {
                setCurrentStep(prev => prev - 1);
                setIsAnimating(false);
            }, 250);
        }
    };

    // Complete tutorial
    const handleComplete = () => {
        setIsActive(false);
        localStorage.setItem(storageKey, "true");
        onComplete?.();
    };

    // Skip tutorial
    const handleSkip = () => {
        setIsActive(false);
        localStorage.setItem(storageKey, "skipped");
        onComplete?.();
    };

    if (!isActive || steps.length === 0) return null;

    const currentStepData = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;

    // Calculate tooltip position with smart positioning
    const getTooltipPosition = () => {
        const tooltipWidth = 320;
        const tooltipHeight = 200;
        const padding = 20;

        // Center if no target
        if (!targetRect) {
            return {
                top: `calc(50% - ${tooltipHeight / 2}px)`,
                left: `calc(50% - ${tooltipWidth / 2}px)`,
            };
        }

        const position = currentStepData.position || "bottom";
        let top, left;

        switch (position) {
            case "top":
                top = targetRect.viewportTop - tooltipHeight - padding;
                left = targetRect.viewportLeft + targetRect.width / 2 - tooltipWidth / 2;
                break;
            case "bottom":
                top = targetRect.viewportTop + targetRect.height + padding;
                left = targetRect.viewportLeft + targetRect.width / 2 - tooltipWidth / 2;
                break;
            case "left":
                top = targetRect.viewportTop + targetRect.height / 2 - tooltipHeight / 2;
                left = targetRect.viewportLeft - tooltipWidth - padding;
                break;
            case "right":
                top = targetRect.viewportTop + targetRect.height / 2 - tooltipHeight / 2;
                left = targetRect.viewportLeft + targetRect.width + padding;
                break;
            default:
                top = targetRect.viewportTop + targetRect.height + padding;
                left = targetRect.viewportLeft + targetRect.width / 2 - tooltipWidth / 2;
        }

        // Keep tooltip within viewport with better margins
        left = Math.max(20, Math.min(left, window.innerWidth - tooltipWidth - 20));
        top = Math.max(20, Math.min(top, window.innerHeight - tooltipHeight - 20));

        return { top: `${top}px`, left: `${left}px` };
    };

    // Get arrow position and style
    const getArrowStyle = () => {
        if (!targetRect) return null;

        const position = currentStepData.position || "bottom";
        const tooltipPos = getTooltipPosition();
        const tooltipTop = parseFloat(tooltipPos.top);
        const tooltipLeft = parseFloat(tooltipPos.left);

        // Calculate where the target center is relative to tooltip
        const targetCenterX = targetRect.viewportLeft + targetRect.width / 2;
        const targetCenterY = targetRect.viewportTop + targetRect.height / 2;

        let arrowStyle = {};

        switch (position) {
            case "top":
                arrowStyle = {
                    position: "absolute",
                    bottom: "-10px",
                    left: `${Math.max(20, Math.min(targetCenterX - tooltipLeft, 300))}px`,
                    transform: "translateX(-50%)",
                    borderLeft: "10px solid transparent",
                    borderRight: "10px solid transparent",
                    borderTop: "10px solid white",
                };
                break;
            case "bottom":
                arrowStyle = {
                    position: "absolute",
                    top: "-10px",
                    left: `${Math.max(20, Math.min(targetCenterX - tooltipLeft, 300))}px`,
                    transform: "translateX(-50%)",
                    borderLeft: "10px solid transparent",
                    borderRight: "10px solid transparent",
                    borderBottom: "10px solid white",
                };
                break;
            case "left":
                arrowStyle = {
                    position: "absolute",
                    right: "-10px",
                    top: `${Math.max(20, Math.min(targetCenterY - tooltipTop, 160))}px`,
                    transform: "translateY(-50%)",
                    borderTop: "10px solid transparent",
                    borderBottom: "10px solid transparent",
                    borderLeft: "10px solid white",
                };
                break;
            case "right":
                arrowStyle = {
                    position: "absolute",
                    left: "-10px",
                    top: `${Math.max(20, Math.min(targetCenterY - tooltipTop, 160))}px`,
                    transform: "translateY(-50%)",
                    borderTop: "10px solid transparent",
                    borderBottom: "10px solid transparent",
                    borderRight: "10px solid white",
                };
                break;
            default:
                return null;
        }

        return arrowStyle;
    };

    return (
        <>
            {/* Dark overlay with spotlight cutout */}
            <div className="fixed inset-0 z-[9998]" style={{ pointerEvents: "none" }}>
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/75 transition-opacity duration-500"
                    style={{ pointerEvents: "auto" }}
                    onClick={(e) => e.stopPropagation()}
                />

                {/* Spotlight cutout */}
                {targetRect && !isScrolling && (
                    <div
                        className="absolute bg-transparent rounded-xl transition-all duration-400 ease-out"
                        style={{
                            top: targetRect.viewportTop - 10,
                            left: targetRect.viewportLeft - 10,
                            width: targetRect.width + 20,
                            height: targetRect.height + 20,
                            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75)",
                            pointerEvents: "none",
                        }}
                    >
                        {/* Glow effect */}
                        <div
                            className="absolute inset-0 rounded-xl"
                            style={{
                                boxShadow: "0 0 20px 5px rgba(251, 191, 36, 0.4)",
                            }}
                        />
                        {/* Pulse ring animation */}
                        <div className="absolute inset-0 rounded-xl border-2 border-amber-400 animate-pulse" />
                        <div
                            className="absolute inset-0 rounded-xl border-2 border-amber-300"
                            style={{
                                animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
                            }}
                        />
                    </div>
                )}
            </div>

            {/* Tooltip */}
            <div
                className={`fixed z-[9999] w-80 transition-all duration-300 ease-out ${isAnimating || isScrolling ? "opacity-0 scale-95" : "opacity-100 scale-100"
                    }`}
                style={{
                    ...getTooltipPosition(),
                    pointerEvents: "auto",
                }}
            >
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-visible">
                    {/* Arrow pointing to target */}
                    {targetRect && <div style={getArrowStyle()} />}

                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-100 rounded-t-2xl overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Content */}
                    <div className="p-5">
                        {/* Step counter */}
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                                Bước {currentStep + 1} / {steps.length}
                            </span>
                            <button
                                onClick={handleSkip}
                                className="text-xs text-gray-400 hover:text-gray-600 transition-colors underline"
                            >
                                Bỏ qua hướng dẫn
                            </button>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                            {currentStepData.title}
                        </h3>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                            {currentStepData.content}
                        </p>

                        {/* Tip if present */}
                        {currentStepData.tip && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
                                <p className="text-xs text-amber-800">
                                    <span className="font-semibold">💡 Mẹo:</span> {currentStepData.tip}
                                </p>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex items-center justify-between">
                            <button
                                onClick={handlePrev}
                                disabled={currentStep === 0}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${currentStep === 0
                                        ? "text-gray-300 cursor-not-allowed"
                                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    }`}
                            >
                                ← Trước
                            </button>

                            {/* Step dots */}
                            <div className="flex gap-1.5">
                                {steps.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setIsAnimating(true);
                                            setTargetRect(null);
                                            setTimeout(() => {
                                                setCurrentStep(idx);
                                                setIsAnimating(false);
                                            }, 250);
                                        }}
                                        className={`h-2 rounded-full transition-all duration-300 ${idx === currentStep
                                                ? "w-6 bg-amber-500"
                                                : idx < currentStep
                                                    ? "w-2 bg-amber-300 hover:bg-amber-400"
                                                    : "w-2 bg-gray-200 hover:bg-gray-300"
                                            }`}
                                        title={`Bước ${idx + 1}`}
                                    />
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg hover:shadow-lg hover:scale-105 transition-all active:scale-100"
                            >
                                {currentStep === steps.length - 1 ? "Hoàn tất ✓" : "Tiếp →"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom animation keyframes */}
            <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(1.1);
            opacity: 0;
          }
        }
      `}</style>
        </>
    );
};

// Hook to control tutorial externally
export const useTutorial = (storageKey = "tutorial-completed") => {
    const reset = () => {
        localStorage.removeItem(storageKey);
        window.location.reload();
    };

    const isCompleted = () => {
        return localStorage.getItem(storageKey) !== null;
    };

    const start = () => {
        localStorage.removeItem(storageKey);
    };

    return { reset, isCompleted, start };
};

export default TutorialOverlay;
