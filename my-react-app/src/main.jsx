// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";
import { PageMetaProvider } from "./hooks/usePageMeta.jsx";
import { setupGlobalErrorHandler } from "./utils/errorLogger.js";

// Tailwind (bắt buộc đứng đầu)
import "./style.css";

// CSS custom (nếu bạn có)
import "./custom.css";

// Setup global error handler
setupGlobalErrorHandler();

// Track page load performance
import { trackPageLoad, trackResourceLoad } from "./utils/performanceMonitor.js";
trackPageLoad();
trackResourceLoad();

ReactDOM.createRoot(document.getElementById("root")).render(
  <HelmetProvider>
    <PageMetaProvider>
  <BrowserRouter>
    <App />
  </BrowserRouter>
    </PageMetaProvider>
  </HelmetProvider>
);
