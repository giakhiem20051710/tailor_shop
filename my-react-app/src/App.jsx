import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./layout.jsx";

import HomePage from "./pages/HomePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import CustomerHomePage from "./pages/CustomerHomePage.jsx";
import LoginSelectionPage from "./pages/LoginSelectionPage.jsx";
import RoleBasedLoginPage from "./pages/RoleBasedLoginPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import OrderListPage from "./pages/OrderListPage.jsx";
import OrderFormPage from "./pages/OrderFormPage.jsx";
import OrderDetailPage from "./pages/OrderDetailPage.jsx";

import CustomerListPage from "./pages/CustomerListPage.jsx";
import TailorListPage from "./pages/TailorListPage.jsx";
import TailorOrdersPage from "./pages/TailorOrdersPage.jsx";
import CompletedOrdersPage from "./pages/CompletedOrdersPage.jsx";
import StyleListPage from "./pages/StyleListPage.jsx";
import InvoicePage from "./pages/InvoicePage.jsx";
import TransactionManagementPage from "./pages/TransactionManagementPage.jsx";
import FabricRequestsPage from "./pages/FabricRequestsPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SchedulePage from "./pages/SchedulePage.jsx";
import CustomerDashboardPage from "./pages/CustomerDashboardPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import CustomerOrderPage from "./pages/CustomerOrderPage.jsx";
import PromotionsPage from "./pages/PromotionsPage.jsx";
import SupportPage from "./pages/SupportPage.jsx";
import ArticlesPage from "./pages/ArticlesPage.jsx";
import FavoritesPage from "./pages/FavoritesPage.jsx";
import FabricsPage from "./pages/FabricsPage.jsx";
import FabricDetailPage from "./pages/FabricDetailPage.jsx";
import FabricCartPage from "./pages/FabricCartPage.jsx";
import FabricCheckoutPage from "./pages/FabricCheckoutPage.jsx";
import QRPaymentPage from "./pages/QRPaymentPage.jsx";
import CODPaymentPage from "./pages/CODPaymentPage.jsx";
import VNPayPaymentPage from "./pages/VNPayPaymentPage.jsx";
import InternationalPaymentPage from "./pages/InternationalPaymentPage.jsx";
import MBBankPaymentPage from "./pages/MBBankPaymentPage.jsx";
import ZaloPayPaymentPage from "./pages/ZaloPayPaymentPage.jsx";
import MoMoPaymentPage from "./pages/MoMoPaymentPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* Home Page - Root */}
      <Route path="/" element={<HomePage />} />
      
      {/* About Page */}
      <Route path="/about" element={<AboutPage />} />
      
      {/* Customer Home Page */}
      <Route path="/customer-home" element={<CustomerHomePage />} />
      
      {/* Products Page */}
      <Route path="/products" element={<ProductsPage />} />
      
      {/* Product Detail Page */}
      <Route path="/product/:id?" element={<ProductDetailPage />} />
      
      {/* Promotions Page */}
      <Route path="/promotions" element={<PromotionsPage />} />
      
      {/* Fabrics Page */}
      <Route path="/fabrics" element={<FabricsPage />} />
      <Route path="/fabrics/:key" element={<FabricDetailPage />} />
      <Route path="/cart" element={<FabricCartPage />} />
      <Route path="/checkout" element={<FabricCheckoutPage />} />
      <Route path="/payment/qr" element={<QRPaymentPage />} />
      <Route path="/payment/cod" element={<CODPaymentPage />} />
      <Route path="/payment/vnpay" element={<VNPayPaymentPage />} />
      <Route path="/payment/international" element={<InternationalPaymentPage />} />
      <Route path="/payment/mbbank" element={<MBBankPaymentPage />} />
      <Route path="/payment/zalopay" element={<ZaloPayPaymentPage />} />
      <Route path="/payment/momo" element={<MoMoPaymentPage />} />
      
      {/* Favorites Page */}
      <Route path="/favorites" element={<FavoritesPage />} />
      
      {/* Support Page */}
      <Route path="/support/:section?" element={<SupportPage />} />
      
      {/* Articles Page */}
      <Route path="/articles" element={<ArticlesPage />} />
      
      {/* Login Selection Page */}
      <Route path="/login-selection" element={<LoginSelectionPage />} />
      
      {/* Role-based Login Pages */}
      <Route path="/login/:role" element={<RoleBasedLoginPage />} />
      
      {/* Legacy Auth pages - for backward compatibility */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      
      {/* All routes are now accessible without authentication */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/orders" element={<OrderListPage />} />
          <Route path="/orders/new" element={<OrderFormPage />} />
          <Route path="/orders/edit/:id" element={<OrderFormPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/customers" element={<CustomerListPage />} />
          <Route path="/tailors" element={<TailorListPage />} />
          <Route path="/tailors/orders/:tailorId?" element={<TailorOrdersPage />} />
          <Route path="/tailors/completed" element={<CompletedOrdersPage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/styles" element={<StyleListPage />} />
          <Route path="/invoice" element={<InvoicePage />} />
          <Route path="/transactions" element={<TransactionManagementPage />} />
          <Route path="/fabric-requests" element={<FabricRequestsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/tailor/dashboard" element={<TailorOrdersPage />} />
          <Route path="/tailor/schedule" element={<SchedulePage />} />
      </Route>
      
      {/* Customer Dashboard - separate route without admin Layout */}
        <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
        <Route path="/customer/order" element={<CustomerOrderPage />} />
    </Routes>
  );
}
