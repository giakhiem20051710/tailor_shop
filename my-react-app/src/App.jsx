import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./layout.jsx";
import ChatWidget from "./components/ChatWidget.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import NotificationToast from "./components/NotificationToast.jsx";
import { SkipToContentLink } from "./utils/accessibility.jsx";

const HomePage = lazy(() => import("./pages/HomePage.jsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.jsx"));
const CustomerHomePage = lazy(() => import("./pages/CustomerHomePage.jsx"));
const LoginSelectionPage = lazy(() => import("./pages/LoginSelectionPage.jsx"));
const RoleBasedLoginPage = lazy(() => import("./pages/RoleBasedLoginPage.jsx"));
const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const RegisterPage = lazy(() => import("./pages/RegisterPage.jsx"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage.jsx"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage.jsx"));
const DashboardPage = lazy(() => import("./pages/DashboardPage.jsx"));
const OrderListPage = lazy(() => import("./pages/OrderListPage.jsx"));
const OrderFormPage = lazy(() => import("./pages/OrderFormPage.jsx"));
const OrderDetailPage = lazy(() => import("./pages/OrderDetailPage.jsx"));
const OrderQuotePage = lazy(() => import("./pages/OrderQuotePage.jsx"));

const CustomerListPage = lazy(() => import("./pages/CustomerListPage.jsx"));
const TailorListPage = lazy(() => import("./pages/TailorListPage.jsx"));
const TailorOrdersPage = lazy(() => import("./pages/TailorOrdersPage.jsx"));
const CompletedOrdersPage = lazy(() => import("./pages/CompletedOrdersPage.jsx"));
const ProductManagerPage = lazy(() => import("./pages/ProductManagerPage.jsx"));
const InvoicePage = lazy(() => import("./pages/InvoicePage.jsx"));
const TransactionManagementPage = lazy(() =>
  import("./pages/TransactionManagementPage.jsx")
);
const FabricRequestsPage = lazy(() => import("./pages/FabricRequestsPage.jsx"));
const FabricInventoryPage = lazy(() => import("./pages/FabricInventoryPage.jsx"));
const ProfilePage = lazy(() => import("./pages/ProfilePage.jsx"));
const SchedulePage = lazy(() => import("./pages/SchedulePage.jsx"));
const CustomerDashboardPage = lazy(() =>
  import("./pages/CustomerDashboardPage.jsx")
);
const CustomerOrderDetailPage = lazy(() =>
  import("./pages/CustomerOrderDetailPage.jsx")
);
const ProductReviewPage = lazy(() => import("./pages/ProductReviewPage.jsx"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage.jsx"));
const ProductsPage = lazy(() => import("./pages/ProductsPage.jsx"));
const CustomizeProductPage = lazy(() => import("./pages/CustomizeProductPage.jsx"));
const ImageUploadPage = lazy(() => import("./pages/ImageUploadPage.jsx"));
const CustomerOrderPage = lazy(() => import("./pages/CustomerOrderPage.jsx"));
const PromotionsPage = lazy(() => import("./pages/PromotionsPage.jsx"));
const SupportPage = lazy(() => import("./pages/SupportPage.jsx"));
const ArticlesPage = lazy(() => import("./pages/ArticlesPage.jsx"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage.jsx"));
const FabricsPage = lazy(() => import("./pages/FabricsPage.jsx"));
const FabricDetailPage = lazy(() => import("./pages/FabricDetailPage.jsx"));
const FabricCartPage = lazy(() => import("./pages/FabricCartPage.jsx"));
const FabricCheckoutPage = lazy(() => import("./pages/FabricCheckoutPage.jsx"));
const QRPaymentPage = lazy(() => import("./pages/QRPaymentPage.jsx"));
const CODPaymentPage = lazy(() => import("./pages/CODPaymentPage.jsx"));
const VNPayPaymentPage = lazy(() => import("./pages/VNPayPaymentPage.jsx"));
const InternationalPaymentPage = lazy(() =>
  import("./pages/InternationalPaymentPage.jsx")
);
const MBBankPaymentPage = lazy(() => import("./pages/MBBankPaymentPage.jsx"));
const ZaloPayPaymentPage = lazy(() => import("./pages/ZaloPayPaymentPage.jsx"));
const MoMoPaymentPage = lazy(() => import("./pages/MoMoPaymentPage.jsx"));

// AI & AR Features
const AIStyleSuggestionsPage = lazy(() =>
  import("./pages/AIStyleSuggestionsPage.jsx")
);
const Product3DPreviewPage = lazy(() =>
  import("./pages/Product3DPreviewPage.jsx")
);
const VirtualTryOnPage = lazy(() => import("./pages/VirtualTryOnPage.jsx"));
const TrendAnalysisPage = lazy(() => import("./pages/TrendAnalysisPage.jsx"));
const CategoryTemplatePage = lazy(() => import("./pages/CategoryTemplatePage.jsx"));

const Loader = () => (
  <div className="p-6 text-sm text-slate-500">Đang tải...</div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <SkipToContentLink />
      <Suspense fallback={<Loader />}>
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

          {/* Customize Product Page */}
          <Route path="/customize-product" element={<CustomizeProductPage />} />

          {/* Image Upload & Management Page */}
          <Route path="/images" element={<ImageUploadPage />} />

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

          {/* AI & AR Features */}
          <Route path="/ai-style-suggestions" element={<AIStyleSuggestionsPage />} />
          <Route path="/3d-preview/:productId?" element={<Product3DPreviewPage />} />
          <Route path="/virtual-tryon" element={<VirtualTryOnPage />} />
          <Route path="/trend-analysis" element={<TrendAnalysisPage />} />

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
            <Route path="/orders/:id/quote" element={<OrderQuotePage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/customers" element={<CustomerListPage />} />
            <Route path="/tailors" element={<TailorListPage />} />
            <Route path="/tailors/orders/:tailorId?" element={<TailorOrdersPage />} />
            <Route path="/tailors/completed" element={<CompletedOrdersPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/styles" element={<ProductManagerPage />} />
            <Route path="/admin/products" element={<ProductManagerPage />} />
            <Route path="/invoice" element={<InvoicePage />} />
            <Route path="/transactions" element={<TransactionManagementPage />} />
            <Route path="/fabric-requests" element={<FabricRequestsPage />} />
            <Route path="/fabric-inventory" element={<FabricInventoryPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/tailor/dashboard" element={<TailorOrdersPage />} />
            <Route path="/tailor/schedule" element={<SchedulePage />} />
            <Route path="/admin/templates" element={<CategoryTemplatePage />} />
          </Route>

          {/* Customer Dashboard - separate route without admin Layout */}
          <Route path="/customer/dashboard" element={<CustomerDashboardPage />} />
          <Route path="/customer/order" element={<CustomerOrderPage />} />
          <Route path="/customer/orders/:id" element={<CustomerOrderDetailPage />} />
          <Route path="/customer/orders/:orderId/review" element={<ProductReviewPage />} />
        </Routes>
      </Suspense>
      {/* Chat Widget - hiển thị trên tất cả các trang */}
      <ChatWidget />
      {/* Notification Toast System */}
      <NotificationToast />
    </ErrorBoundary>
  );
}
