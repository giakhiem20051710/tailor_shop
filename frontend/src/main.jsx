// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";
import { PageMetaProvider } from "./hooks/usePageMeta.jsx";
import { SeasonalThemeProvider } from "./contexts/SeasonalThemeContext.jsx";
import SeasonalDecorations, { SeasonalBanner } from "./components/SeasonalDecorations.jsx";
import SeasonalWelcomeModal from "./components/SeasonalWelcomeModal.jsx";
import SeasonalToggleButton from "./components/SeasonalToggleButton.jsx";
import { setupGlobalErrorHandler } from "./utils/errorLogger.js";
import "./style.css"; // hoặc "./index.css"

setupGlobalErrorHandler();

ReactDOM.createRoot(document.getElementById("root")).render(
  <HelmetProvider>
    <BrowserRouter>
      <PageMetaProvider>
        <SeasonalThemeProvider>
          <SeasonalBanner />
          <SeasonalDecorations />
          <SeasonalWelcomeModal />
          <SeasonalToggleButton />
          <App />
        </SeasonalThemeProvider>
      </PageMetaProvider>
    </BrowserRouter>
  </HelmetProvider>
);