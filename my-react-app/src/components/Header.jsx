import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { getFabricCart } from "../utils/fabricCartStorage.js";

const Header = ({ currentPage = "" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSupportDropdown, setShowSupportDropdown] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const updateCartCount = () => {
      const cart = getFabricCart();
      setCartCount(cart.length);
    };
    updateCartCount();
    const interval = setInterval(updateCartCount, 1000);
    return () => clearInterval(interval);
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
    navigate("/login-selection");
  };

  const isActive = (page) => {
    if (currentPage) return currentPage === page;
    return location.pathname === page || 
           (page === "/customer-home" && location.pathname === "/");
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled ? "shadow-md bg-white/95 backdrop-blur" : "bg-white"
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

          {/* Search */}
          <div className="flex-1 hidden md:flex items-center">
            <div className="w-full flex rounded-full border border-[#E5E7EB] overflow-hidden bg-white">
              <input
                type="text"
                className="flex-1 px-4 py-2 text-[12px] outline-none"
                placeholder="Tìm váy, đầm, nội y..."
              />
              <button className="px-6 text-[12px] font-semibold bg-[#111827] text-white hover:bg-[#0f172a] transition-colors">
                TÌM KIẾM
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 text-[12px]">
            <button
              onClick={handleLoginClick}
              className="text-[#374151] hover:text-[#111827] transition-colors"
            >
              Đăng nhập / Đăng ký
            </button>
            <span className="text-[#D1D5DB]">|</span>
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
          <nav className="flex items-center gap-6 uppercase tracking-[0.16em] text-[#374151]">
            <a
              href="/customer-home"
              className={`hover:text-[#111827] transition-colors ${
                isActive("/customer-home") ? "text-[#111827] font-semibold" : ""
              }`}
              onClick={handleHomeClick}
            >
              TRANG CHỦ
            </a>
            <a
              href="/about"
              className={`hover:text-[#111827] transition-colors ${
                isActive("/about") ? "text-[#111827] font-semibold" : ""
              }`}
              onClick={handleAboutClick}
            >
              GIỚI THIỆU
            </a>
            <a
              href="/products"
              className={`hover:text-[#111827] transition-colors ${
                isActive("/products") ? "text-[#111827] font-semibold" : ""
              }`}
              onClick={handleProductsClick}
            >
              SẢN PHẨM
            </a>
            <a
              href="/fabrics"
              className={`hover:text-[#111827] transition-colors ${
                isActive("/fabrics") ? "text-[#111827] font-semibold" : ""
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
              className={`hover:text-[#111827] transition-colors ${
                isActive("/customer/order") ? "text-[#111827] font-semibold" : ""
              }`}
              onClick={handleOrderClick}
            >
              ĐẶT MAY
            </a>
            <a
              href="/promotions"
              className={`hover:text-[#111827] transition-colors ${
                isActive("/promotions") ? "text-[#111827] font-semibold" : ""
              }`}
              onClick={(e) => {
                e.preventDefault();
                navigate("/promotions");
              }}
            >
              ƯU ĐÃI
            </a>
            <a
              href="/articles"
              className={`hover:text-[#111827] transition-colors ${
                isActive("/articles") ? "text-[#111827] font-semibold" : ""
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
              className={`hover:text-[#111827] transition-colors ${
                isActive("/favorites") ? "text-[#111827] font-semibold" : ""
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
              className={`hover:text-[#111827] transition-colors ${
                isActive("/customer/dashboard") ? "text-[#111827] font-semibold" : ""
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
                className={`hover:text-[#111827] transition-colors flex items-center gap-1 ${
                  isActive("/support") ? "text-[#111827] font-semibold" : ""
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
    </header>
  );
};

export default Header;

