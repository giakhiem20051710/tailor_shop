/**
 * Accessibility Utilities
 * Improve accessibility with ARIA labels and keyboard navigation
 */

import React from "react";

/**
 * Generate ARIA label for common UI elements
 */
export const getAriaLabel = (element, context = {}) => {
  const labels = {
    button: {
      close: "Đóng",
      menu: "Mở menu",
      search: "Tìm kiếm",
      add: "Thêm",
      delete: "Xóa",
      edit: "Chỉnh sửa",
      save: "Lưu",
      cancel: "Hủy",
      submit: "Gửi",
      next: "Tiếp theo",
      previous: "Trước đó",
      favorite: "Thêm vào yêu thích",
      unfavorite: "Bỏ khỏi yêu thích",
      cart: "Giỏ hàng",
      ...context,
    },
    link: {
      home: "Về trang chủ",
      products: "Xem sản phẩm",
      fabrics: "Xem vải",
      ...context,
    },
  };

  return labels[element]?.[context.type] || context.label || "";
};

/**
 * Focus management for modals and dialogs
 */
export const trapFocus = (element) => {
  if (!element) return null;

  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTab = (e) => {
    if (e.key !== "Tab") return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement?.focus();
      }
    }
  };

  element.addEventListener("keydown", handleTab);
  firstElement?.focus();

  return () => {
    element.removeEventListener("keydown", handleTab);
  };
};

/**
 * Announce to screen readers
 */
export const announceToScreenReader = (message, priority = "polite") => {
  const announcement = document.createElement("div");
  announcement.setAttribute("role", "status");
  announcement.setAttribute("aria-live", priority);
  announcement.setAttribute("aria-atomic", "true");
  announcement.className = "sr-only";
  announcement.textContent = message;

  document.body.appendChild(announcement);

  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

/**
 * Skip to main content link
 */
export const SkipToContentLink = () => {
  const handleClick = (e) => {
    e.preventDefault();
    const mainContent = document.querySelector("main") || document.querySelector("#main");
    if (mainContent) {
      mainContent.focus();
      mainContent.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <a
      href="#main"
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-[#1B4332] focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1B4332]"
    >
      Bỏ qua đến nội dung chính
    </a>
  );
};

/**
 * Keyboard navigation handler
 */
export const handleKeyboardNavigation = (handlers) => {
  return (e) => {
    switch (e.key) {
      case "Enter":
      case " ":
        handlers.onEnter?.(e);
        break;
      case "Escape":
        handlers.onEscape?.(e);
        break;
      case "ArrowUp":
        handlers.onArrowUp?.(e);
        break;
      case "ArrowDown":
        handlers.onArrowDown?.(e);
        break;
      case "ArrowLeft":
        handlers.onArrowLeft?.(e);
        break;
      case "ArrowRight":
        handlers.onArrowRight?.(e);
        break;
      case "Home":
        handlers.onHome?.(e);
        break;
      case "End":
        handlers.onEnd?.(e);
        break;
      default:
        handlers.onOther?.(e);
    }
  };
};

/**
 * Add CSS for screen reader only content
 */
export const addScreenReaderStyles = () => {
  if (document.getElementById("sr-styles")) return;

  const style = document.createElement("style");
  style.id = "sr-styles";
  style.textContent = `
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
    .sr-only:focus {
      position: static;
      width: auto;
      height: auto;
      padding: inherit;
      margin: inherit;
      overflow: visible;
      clip: auto;
      white-space: normal;
    }
  `;
  document.head.appendChild(style);
};

// Initialize screen reader styles
if (typeof document !== "undefined") {
  addScreenReaderStyles();
}

