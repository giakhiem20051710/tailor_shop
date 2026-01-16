// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";
import { PageMetaProvider } from "./hooks/usePageMeta.jsx";
import { setupGlobalErrorHandler } from "./utils/errorLogger.js";
import "./style.css"; // hoặc "./index.css"

setupGlobalErrorHandler();

ReactDOM.createRoot(document.getElementById("root")).render(
  <HelmetProvider>
    <BrowserRouter>
      <PageMetaProvider>
        <App />
      </PageMetaProvider>
    </BrowserRouter>
  </HelmetProvider>
);