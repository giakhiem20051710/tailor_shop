import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { authService, cartService, userService } from "../services";
import SmartSearch from "./SmartSearch.jsx";

const Header = ({ currentPage = "" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSupportDropdown, setShowSupportDropdown] = useState(false);
  const [showAIDropdown, setShowAIDropdown] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const updateCartCount = async () => {
      try {
        if (authService.isAuthenticated()) {
          const response = await cartService.getCart();
          const responseData = response?.data ?? response?.responseData ?? response;
          const isSuccess =
            response?.success === true ||
            response?.responseStatus?.responseCode === "200" ||
            !!responseData?.items ||
            Array.isArray(responseData);
          if (isSuccess && responseData) {
            const items = responseData.items || responseData;
            setCartCount(items?.length || 0);
          } else {
            setCartCount(0);
          }
        } else {
          setCartCount(0);
        }
      } catch (error) {
        console.error("Error fetching cart:", error);
        setCartCount(0);
      }
    };
    updateCartCount();
    const interval = setInterval(updateCartCount, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (authService.isAuthenticated()) {
          const response = await userService.getProfile();
          const responseData = response?.data ?? response?.responseData ?? response;
          const isSuccess =
            response?.success === true ||
            response?.responseStatus?.responseCode === "200" ||
            !!responseData?.email ||
            !!responseData?.name ||
            !!responseData?.fullName;
          if (isSuccess && responseData) {
            setCurrentUser(responseData);
            localStorage.setItem("userData", JSON.stringify(responseData));
          } else {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setCurrentUser(null);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate("/customer-home");
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    navigate("/about");
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);
  };

  const handleProductsClick = (e) => {
    e.preventDefault();
    navigate("/products");
  };

  const handleOrderClick = (e) => {
    e.preventDefault();
    navigate("/customer/order");
  };

  const handleLoginClick = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    authService.logout();
    localStorage.removeItem("userData");
    localStorage.removeItem("isAuthenticated");
    setCurrentUser(null);
    navigate("/", { replace: true });
  };

  const isActive = (page) => {
    if (currentPage) return currentPage === page;
    return location.pathname === page ||
      (page === "/customer-home" && location.pathname === "/");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "shadow-md bg-white/95 backdrop-blur" : "bg-white"
        }`}
    >
      {/* Thanh vàng trên cùng */}
      <div className="bg-[#F2A500] text-white text-[11px]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 flex items-center justify-between h-8">
          <p className="tracking-[0.16em] uppercase">
            PHỤ NỮ HÃY LUÔN ĐẸP, ĐỪNG CHỈ ĐẸP KHI CẦN!
          </p>
          <div className="flex items-center gap-2">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              f
            </a>
            <a
              href="mailto:dvkh@camfashion.vn"
              className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              ✉
            </a>
            <a
              href="tel:0901134256"
              className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              📞
            </a>
          </div>
        </div>
      </div>

      {/* Hàng giữa: logo + search + login/cart */}
      <div className="border-b border-[#F3F4F6]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={handleHomeClick}
          >
            <div className="w-9 h-9 rounded-full bg-[#111827] flex items-center justify-center text-[11px] font-semibold text-white">
              MH
            </div>
            <div className="leading-tight">
              <div className="heading-font text-[15px] text-[#111827]">
                Mỹ Hiền
              </div>
              <div className="text-[11px] text-[#6B7280]">
                Fashion Design Studio
              </div>
            </div>
          </div>

          {/* Smart Search with Autocomplete */}
          <div className="flex-1 hidden md:block">
            <SmartSearch className="w-full max-w-xl mx-auto" />
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-[#374151] hover:text-[#111827] transition-colors"
            aria-label={showMobileMenu ? "Đóng menu" : "Mở menu"}
            aria-expanded={showMobileMenu}
            aria-controls="mobile-menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showMobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Actions */}
          <div className="flex items-center gap-3 text-[12px]">
            {currentUser ? (
              <>
                <span className="text-[#374151]">
                  Xin chào,{" "}
                  <span className="font-semibold">
                    {currentUser.name || currentUser.username}
                  </span>
                </span>
                <button
                  onClick={handleLogoutClick}
                  className="text-[#374151] hover:text-[#111827] underline underline-offset-2 transition-colors"
                >
                  Đăng xuất
                </button>
                <span className="text-[#D1D5DB]">|</span>
              </>
            ) : (
              <>
                <button
                  onClick={handleLoginClick}
                  className="text-[#374151] hover:text-[#111827] transition-colors"
                >
                  Đăng nhập / Đăng ký
                </button>
                <span className="text-[#D1D5DB]">|</span>
              </>
            )}
            <button
              onClick={() => navigate("/cart")}
              className="flex items-center gap-1 px-3 py-1 rounded-full border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] transition-colors relative"
            >
              <span>🛒</span>
              <span>Giỏ hàng ({cartCount})</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#F97316] text-white text-[10px] rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Hàng dưới: menu + HCM / giờ / hotline */}
      <div className="bg-[#FFFBF2] border-b border-[#F3F4F6]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8 flex items-center justify-between h-9 text-[11px]">
          <nav className="flex items-center gap-4 uppercase tracking-[0.12em] text-[#374151] whitespace-nowrap overflow-x-auto scrollbar-hide">
            <a
              href="/customer-home"
              className={`hover:text-[#111827] transition-colors ${isActive("/customer-home") ? "text-[#111827] font-semibold" : ""
                }`}
              onClick={handleHomeClick}
            >
              TRANG CHỦ
            </a>
            <a
              href="/about"
              className={`hover:text-[#111827] transition-colors ${isActive("/about") ? "text-[#111827] font-semibold" : ""
                }`}
              onClick={handleAboutClick}
            >
              GIỚI THIỆU
            </a>
            <a
              href="/products"
              className={`hover:text-[#111827] transition-colors ${isActive("/products") ? "text-[#111827] font-semibold" : ""
                }`}
              onClick={handleProductsClick}
            >
              SẢN PHẨM
            </a>
            {/* AI & AR Features Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setShowAIDropdown(true)}
              onMouseLeave={() => setShowAIDropdown(false)}
            >
              <a
                href="#"
                className={`hover:text-[#111827] transition-colors flex items-center gap-1 ${isActive("/ai-style-suggestions") ||
                  isActive("/3d-preview") ||
                  isActive("/virtual-tryon") ||
                  isActive("/trend-analysis")
                  ? "text-[#111827] font-semibold" : ""
                  }`}
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                AI & AR
                <span className="text-[10px]">▼</span>
              </a>
              {showAIDropdown && (
                <div className="absolute top-full left-0 pt-1 w-64 bg-transparent z-50">
                  <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-lg">
                    <div className="py-1">
                      <a
                        href="/ai-style-suggestions"
                        className="block px-4 py-2.5 text-[12px] text-[#374151] hover:bg-[#F9FAFB] transition-colors border-b border-[#E5E7EB]"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/ai-style-suggestions");
                          setShowAIDropdown(false);
                        }}
                      >
                        <span className="font-semibold">🤖</span> AI Gợi ý Phong cách
                      </a>
                      <a
                        href="/3d-preview"
                        className="block px-4 py-2.5 text-[12px] text-[#374151] hover:bg-[#F9FAFB] transition-colors border-b border-[#E5E7EB]"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/3d-preview");
                          setShowAIDropdown(false);
                        }}
                      >
                        <span className="font-semibold">🎨</span> Xem trước 3D
                      </a>
                      <a
                        href="/virtual-tryon"
                        className="block px-4 py-2.5 text-[12px] text-[#374151] hover:bg-[#F9FAFB] transition-colors border-b border-[#E5E7EB]"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/virtual-tryon");
                          setShowAIDropdown(false);
                        }}
                      >
                        <span className="font-semibold">📱</span> Thử áo ảo AR
                      </a>
                      <a
                        href="/trend-analysis"
                        className="block px-4 py-2.5 text-[12px] text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/trend-analysis");
                          setShowAIDropdown(false);
                        }}
                      >
                        <span className="font-semibold">📊</span> Phân tích Xu hướng
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <a
              href="/fabrics"
              className={`hover:text-[#111827] transition-colors ${isActive("/fabrics") ? "text-[#111827] font-semibold" : ""
                }`}
              onClick={(e) => {
                e.preventDefault();
                navigate("/fabrics");
              }}
            >
              BÁN VẢI
            </a>
            <a
              href="/customer/order"
              className={`hover:text-[#111827] transition-colors ${isActive("/customer/order") ? "text-[#111827] font-semibold" : ""
                }`}
              onClick={handleOrderClick}
            >
              ĐẶT MAY
            </a>
            <a
              href="/promotions"
              className={`hover:text-[#111827] transition-colors ${isActive("/promotions") ? "text-[#111827] font-semibold" : ""
                }`}
              onClick={(e) => {
                e.preventDefault();
                navigate("/promotions");
              }}
            >
              ƯU ĐÃI
            </a>
            <a
              href="/customer/wallet"
              className={`hover:text-[#111827] transition-colors ${isActive("/customer/wallet") ? "text-[#111827] font-semibold" : ""
                }`}
              onClick={(e) => {
                e.preventDefault();
                navigate("/customer/wallet");
              }}
            >
              XU & THỬ
            </a>
            <a
              href="/articles"
              className={`hover:text-[#111827] transition-colors ${isActive("/articles") ? "text-[#111827] font-semibold" : ""
                }`}
              onClick={(e) => {
                e.preventDefault();
                navigate("/articles");
              }}
            >
              BÀI VIẾT
            </a>
            <a
              href="/favorites"
              className={`hover:text-[#111827] transition-colors ${isActive("/favorites") ? "text-[#111827] font-semibold" : ""
                }`}
              onClick={(e) => {
                e.preventDefault();
                navigate("/favorites");
              }}
            >
              YÊU THÍCH
            </a>
            <a
              href="/customer/dashboard"
              className={`hover:text-[#111827] transition-colors ${isActive("/customer/dashboard") ? "text-[#111827] font-semibold" : ""
                }`}
              onClick={(e) => {
                e.preventDefault();
                navigate("/customer/dashboard");
              }}
            >
              ME
            </a>
            {/* HỖ TRỢ với dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setShowSupportDropdown(true)}
              onMouseLeave={() => setShowSupportDropdown(false)}
            >
              <a
                href="#"
                className={`hover:text-[#111827] transition-colors flex items-center gap-1 ${isActive("/support") ? "text-[#111827] font-semibold" : ""
                  }`}
                onClick={(e) => {
                  e.preventDefault();
                }}
              >
                HỖ TRỢ
                <span className="text-[10px]">▼</span>
              </a>
              {showSupportDropdown && (
                <div className="absolute top-full left-0 pt-1 w-56 bg-transparent z-50">
                  <div className="bg-white border border-[#E5E7EB] rounded-lg shadow-lg">
                    <div className="py-1">
                      <a
                        href="/support/size-consultation"
                        className="block px-4 py-2.5 text-[12px] text-[#374151] hover:bg-[#F9FAFB] transition-colors border-b border-[#E5E7EB] last:border-b-0"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/support/size-consultation");
                          setShowSupportDropdown(false);
                        }}
                      >
                        Tư vấn size
                      </a>
                      <a
                        href="/support/shopping-guide"
                        className="block px-4 py-2.5 text-[12px] text-[#374151] hover:bg-[#F9FAFB] transition-colors border-b border-[#E5E7EB] last:border-b-0"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/support/shopping-guide");
                          setShowSupportDropdown(false);
                        }}
                      >
                        Hướng dẫn mua hàng
                      </a>
                      <a
                        href="/support/payment-policy"
                        className="block px-4 py-2.5 text-[12px] text-[#374151] hover:bg-[#F9FAFB] transition-colors border-b border-[#E5E7EB] last:border-b-0"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/support/payment-policy");
                          setShowSupportDropdown(false);
                        }}
                      >
                        Chính sách thanh toán
                      </a>
                      <a
                        href="/support/shipping-policy"
                        className="block px-4 py-2.5 text-[12px] text-[#374151] hover:bg-[#F9FAFB] transition-colors border-b border-[#E5E7EB] last:border-b-0"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/support/shipping-policy");
                          setShowSupportDropdown(false);
                        }}
                      >
                        Chính sách vận chuyển
                      </a>
                      <a
                        href="/support/warranty-return"
                        className="block px-4 py-2.5 text-[12px] text-[#374151] hover:bg-[#F9FAFB] transition-colors border-b border-[#E5E7EB] last:border-b-0"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/support/warranty-return");
                          setShowSupportDropdown(false);
                        }}
                      >
                        Bảo hành & Đổi trả
                      </a>
                      <a
                        href="/support/membership-policy"
                        className="block px-4 py-2.5 text-[12px] text-[#374151] hover:bg-[#F9FAFB] transition-colors border-b border-[#E5E7EB] last:border-b-0"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/support/membership-policy");
                          setShowSupportDropdown(false);
                        }}
                      >
                        Chính sách hội viên
                      </a>
                      <a
                        href="/support/privacy-policy"
                        className="block px-4 py-2.5 text-[12px] text-[#374151] hover:bg-[#F9FAFB] transition-colors border-b border-[#E5E7EB] last:border-b-0"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate("/support/privacy-policy");
                          setShowSupportDropdown(false);
                        }}
                      >
                        Chính sách quyền riêng tư
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </nav>

          <div className="hidden md:flex items-center gap-3 text-[#6B7280]">
            <span>📍 HCM</span>
            <span className="text-[#D1D5DB]">•</span>
            <span>🕐 07:00 - 23:00</span>
            <span className="text-[#D1D5DB]">•</span>
            <span>📞 0901 134 256</span>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div
          id="mobile-menu"
          className="md:hidden bg-white border-t border-[#E5E7EB] shadow-lg"
          role="navigation"
          aria-label="Menu điều hướng chính"
        >
          {/* Mobile Search */}
          <div className="p-4 border-b border-[#E5E7EB]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                  setSearchQuery("");
                  setShowMobileMenu(false);
                }
              }}
              className="flex gap-2"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-4 py-2 text-sm border border-[#E5E7EB] rounded-lg outline-none focus:border-[#111827]"
                placeholder="Tìm kiếm..."
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#111827] text-white rounded-lg hover:bg-[#0f172a] transition-colors"
              >
                Tìm
              </button>
            </form>
          </div>

          {/* Mobile Navigation */}
          <nav className="py-4 px-5 space-y-1">
            <a
              href="/customer-home"
              onClick={(e) => {
                e.preventDefault();
                handleHomeClick(e);
                setShowMobileMenu(false);
              }}
              className={`block px-4 py-3 rounded-lg transition-colors ${isActive("/customer-home") ? "bg-[#111827] text-white" : "text-[#374151] hover:bg-[#F9FAFB]"
                }`}
            >
              TRANG CHỦ
            </a>
            <a
              href="/products"
              onClick={(e) => {
                e.preventDefault();
                handleProductsClick(e);
                setShowMobileMenu(false);
              }}
              className={`block px-4 py-3 rounded-lg transition-colors ${isActive("/products") ? "bg-[#111827] text-white" : "text-[#374151] hover:bg-[#F9FAFB]"
                }`}
            >
              SẢN PHẨM
            </a>
            <a
              href="/fabrics"
              onClick={(e) => {
                e.preventDefault();
                navigate("/fabrics");
                setShowMobileMenu(false);
              }}
              className={`block px-4 py-3 rounded-lg transition-colors ${isActive("/fabrics") ? "bg-[#111827] text-white" : "text-[#374151] hover:bg-[#F9FAFB]"
                }`}
            >
              BÁN VẢI
            </a>
            <a
              href="/customer/order"
              onClick={(e) => {
                e.preventDefault();
                handleOrderClick(e);
                setShowMobileMenu(false);
              }}
              className={`block px-4 py-3 rounded-lg transition-colors ${isActive("/customer/order") ? "bg-[#111827] text-white" : "text-[#374151] hover:bg-[#F9FAFB]"
                }`}
            >
              ĐẶT MAY
            </a>
            <a
              href="/ai-style-suggestions"
              onClick={(e) => {
                e.preventDefault();
                navigate("/ai-style-suggestions");
                setShowMobileMenu(false);
              }}
              className="block px-4 py-3 rounded-lg text-[#374151] hover:bg-[#F9FAFB] transition-colors"
            >
              🤖 AI & AR
            </a>
            <a
              href="/favorites"
              onClick={(e) => {
                e.preventDefault();
                navigate("/favorites");
                setShowMobileMenu(false);
              }}
              className={`block px-4 py-3 rounded-lg transition-colors ${isActive("/favorites") ? "bg-[#111827] text-white" : "text-[#374151] hover:bg-[#F9FAFB]"
                }`}
            >
              YÊU THÍCH
            </a>
            <a
              href="/customer/wallet"
              onClick={(e) => {
                e.preventDefault();
                navigate("/customer/wallet");
                setShowMobileMenu(false);
              }}
              className={`block px-4 py-3 rounded-lg transition-colors ${isActive("/customer/wallet") ? "bg-[#111827] text-white" : "text-[#374151] hover:bg-[#F9FAFB]"
                }`}
            >
              XU & THỬ THÁCH
            </a>
            {currentUser && (
              <a
                href="/customer/dashboard"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/customer/dashboard");
                  setShowMobileMenu(false);
                }}
                className={`block px-4 py-3 rounded-lg transition-colors ${isActive("/customer/dashboard") ? "bg-[#111827] text-white" : "text-[#374151] hover:bg-[#F9FAFB]"
                  }`}
              >
                TÀI KHOẢN
              </a>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;

