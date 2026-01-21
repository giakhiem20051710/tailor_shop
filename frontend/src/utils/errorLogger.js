/**
 * Error Logging System
 * Log errors for debugging and monitoring
 */

const MAX_ERRORS = 100;

export const logError = (error, context = {}) => {
  const errorLog = {
    message: error?.message || String(error),
    stack: error?.stack,
    context,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.error("❌ Error Logged:", errorLog);
  }

  // Store errors in localStorage
  try {
    const errors = JSON.parse(localStorage.getItem("error_logs") || "[]");
    errors.push(errorLog);
    
    // Keep only last MAX_ERRORS errors
    if (errors.length > MAX_ERRORS) {
      errors.shift();
    }
    
    localStorage.setItem("error_logs", JSON.stringify(errors));
  } catch (e) {
    // Ignore storage errors
  }

  // In production, send to error tracking service
  // Example: Sentry.captureException(error, { extra: context });
  // Example: LogRocket.captureException(error);
};

// Get error logs (for admin dashboard)
export const getErrorLogs = () => {
  try {
    return JSON.parse(localStorage.getItem("error_logs") || "[]");
  } catch {
    return [];
  }
};

// Clear error logs
export const clearErrorLogs = () => {
  localStorage.removeItem("error_logs");
};

// Global error handler
export const setupGlobalErrorHandler = () => {
  window.addEventListener("error", (event) => {
    logError(event.error || event.message, {
      type: "unhandled_error",
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    logError(event.reason, {
      type: "unhandled_promise_rejection",
    });
  });
};

