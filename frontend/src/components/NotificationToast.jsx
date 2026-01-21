import { useState, useEffect } from "react";

let toastIdCounter = 0;
const toastListeners = new Set();

export const showToast = (message, type = "info", duration = 3000) => {
  const id = ++toastIdCounter;
  const toast = { id, message, type, duration };
  
  toastListeners.forEach((listener) => listener(toast));
  
  return id;
};

export const showSuccess = (message, duration) => showToast(message, "success", duration);
export const showError = (message, duration) => showToast(message, "error", duration);
export const showWarning = (message, duration) => showToast(message, "warning", duration);
export const showInfo = (message, duration) => showToast(message, "info", duration);

export default function NotificationToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNewToast = (toast) => {
      setToasts((prev) => [...prev, toast]);
      
      if (toast.duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== toast.id));
        }, toast.duration);
      }
    };

    toastListeners.add(handleNewToast);
    return () => {
      toastListeners.delete(handleNewToast);
    };
  }, []);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => {
        const bgColors = {
          success: "bg-green-50 border-green-200 text-green-800",
          error: "bg-red-50 border-red-200 text-red-800",
          warning: "bg-amber-50 border-amber-200 text-amber-800",
          info: "bg-blue-50 border-blue-200 text-blue-800",
        };

        const icons = {
          success: "✅",
          error: "❌",
          warning: "⚠️",
          info: "ℹ️",
        };

        return (
          <div
            key={toast.id}
            className={`${bgColors[toast.type]} border rounded-lg shadow-lg px-4 py-3 min-w-[300px] max-w-[400px] pointer-events-auto animate-slide-in-right flex items-start gap-3`}
          >
            <span className="text-lg flex-shrink-0">{icons[toast.type]}</span>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 flex-shrink-0 text-lg leading-none"
            >
              ×
            </button>
          </div>
        );
      })}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

