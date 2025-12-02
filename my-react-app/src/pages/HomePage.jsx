import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  const categories = ['Tất cả', 'Áo dài', 'Vest', 'Váy', 'Đồng phục'];

  const products = [
    {
      id: 1,
      name: 'Áo dài đỏ truyền thống',
      category: 'Áo dài',
      gender: 'Nữ',
      price: 600000,
      image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400',
      badge: 'May trong 5 ngày',
      isNew: true
    },
    {
      id: 2,
      name: 'Vest nam cao cấp',
      category: 'Vest',
      gender: 'Nam',
      price: 1200000,
      image: 'https://images.unsplash.com/photo-1594938291221-94f18cbb566b?w=400',
      badge: 'May trong 7 ngày',
      isNew: false
    },
    {
      id: 3,
      name: 'Váy dạ hội',
      category: 'Váy',
      gender: 'Nữ',
      price: 800000,
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400',
      badge: 'May trong 5 ngày',
      isNew: true
    },
    {
      id: 4,
      name: 'Áo dài trắng hiện đại',
      category: 'Áo dài',
      gender: 'Nữ',
      price: 700000,
      image: 'https://images.unsplash.com/photo-1601925260368-ae2f83d34b08?w=400',
      badge: 'May trong 5 ngày',
      isNew: false
    },
    {
      id: 5,
      name: 'Vest nữ công sở',
      category: 'Vest',
      gender: 'Nữ',
      price: 900000,
      image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400',
      badge: 'May trong 6 ngày',
      isNew: false
    },
    {
      id: 6,
      name: 'Đồng phục công ty',
      category: 'Đồng phục',
      gender: 'Unisex',
      price: 500000,
      image: 'https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=400',
      badge: 'May trong 10 ngày',
      isNew: false
    }
  ];

  const filteredProducts = selectedCategory === 'Tất cả' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const scrollToProducts = () => {
    const element = document.getElementById('products-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate('/customer-home');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const handleAboutClick = (e) => {
    e.preventDefault();
    navigate('/about');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const reviews = [
    {
      name: 'Chị Lan Anh',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      text: 'Áo dài may rất đẹp, vừa vặn với số đo. Giao hàng đúng hẹn, rất hài lòng!'
    },
    {
      name: 'Anh Minh Tuấn',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      text: 'Vest may chuẩn, chất lượng vải tốt. Thợ may tư vấn nhiệt tình, chuyên nghiệp.'
    },
    {
      name: 'Chị Hương',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100',
      text: 'Đặt may 3 bộ áo dài cho cả nhà, đều đẹp và vừa vặn. Sẽ quay lại đặt tiếp!'
    }
  ];

  return (
    <div className="home-page">
      {/* Header */}
      <header className="home-header">
        {/* Top Bar - Golden Yellow */}
        <div className="header-top-bar">
          <div className="top-bar-content">
            <p className="top-bar-text">PHỤ NỮ HÃY LUÔN ĐẸP, ĐỪNG CHỈ ĐẸP KHI CẦN!</p>
            <div className="top-bar-icons">
              <a href="#" className="social-icon">f</a>
              <a href="#" className="social-icon">✉</a>
              <a href="#" className="social-icon">📞</a>
            </div>
          </div>
        </div>

        {/* Middle Section - White */}
        <div className="header-middle">
          <div className="header-middle-content">
            <div className="header-logo">
              <span className="logo-icon">☀</span>
              <span className="logo-text">CAM</span>
            </div>
            <div className="header-search">
              <input type="text" placeholder="Search..." className="search-input" />
              <button className="search-btn">🔍</button>
            </div>
            <div className="header-actions">
              <a href="/login-selection" className="action-link">LOGIN/REGISTER</a>
              <span className="divider">|</span>
              <a href="#" className="action-link">CART / 0 ₫</a>
              <span className="cart-icon">🛍️ <span className="cart-count">0</span></span>
            </div>
          </div>
        </div>

        {/* Bottom Menu - Light Pink */}
        <div className="header-bottom-menu">
          <div className="menu-content">
            <nav className="main-nav">
              <a 
                href="/customer-home" 
                className="nav-link active"
                onClick={handleHomeClick}
              >
                TRANG CHỦ
              </a>
              <a
                href="/about"
                className="nav-link"
                onClick={handleAboutClick}
              >
                GIỚI THIỆU
              </a>
              <a href="#products" className="nav-link">
                SẢN PHẨM <span className="dropdown-arrow">▼</span>
              </a>
              <a href="#order" className="nav-link">
                ĐẶT MAY <span className="dropdown-arrow">▼</span>
              </a>
              <a href="#photography" className="nav-link">
                CHỤP ẢNH <span className="dropdown-arrow">▼</span>
              </a>
              <a href="#promotions" className="nav-link">ƯU ĐÃI</a>
              <a href="#support" className="nav-link">
                HỖ TRỢ <span className="dropdown-arrow">▼</span>
              </a>
              <a href="#articles" className="nav-link">BÀI VIẾT</a>
            </nav>
            <div className="contact-info">
              <span className="contact-item">📍 HCM</span>
              <span className="divider">|</span>
              <span className="contact-item">🕐 07:00 - 23:00</span>
              <span className="divider">|</span>
              <span className="contact-item">📞 0901134256</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" id="home">
        <div className="hero-content">
          <h1 className="hero-headline">
            Đặt may quần áo theo số đo – giao hàng tận nhà
          </h1>
          <p className="hero-description">
            Chúng tôi chuyên may đo quần áo theo yêu cầu với độ chính xác cao.
            <br />
            Từ áo dài truyền thống đến vest hiện đại, tất cả đều được may tỉ mỉ, chuẩn số đo.
          </p>
          <div className="hero-buttons">
            <button className="btn-primary" onClick={scrollToProducts}>
              Xem bộ sưu tập
            </button>
            <button className="btn-secondary" onClick={() => window.location.href = '/orders/new'}>
              Đặt may ngay
            </button>
          </div>
        </div>
        <div className="hero-image">
          <img 
            src="https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800" 
            alt="Áo dài truyền thống" 
          />
        </div>
      </section>

      {/* Quick Categories */}
      <section className="categories-section">
        <div className="categories-container">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => {
                setSelectedCategory(cat);
                scrollToProducts();
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Products Grid */}
      <section className="products-section" id="products-section">
        <div className="section-container">
          <h2 className="section-title">Bộ sưu tập mẫu</h2>
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image-wrapper">
                  <img src={product.image} alt={product.name} className="product-image" />
                  {product.isNew && <span className="product-badge new">New</span>}
                  <span className="product-badge time">{product.badge}</span>
                </div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-tags">
                    <span className="product-tag">{product.category}</span>
                    <span className="product-tag">{product.gender}</span>
                  </div>
                  <div className="product-price">Từ {product.price.toLocaleString('vi-VN')} đ</div>
                  <div className="product-actions">
                    <button 
                      className="btn-view-detail"
                      onClick={() =>
                        navigate("/product/homepage", {
                          state: {
                            product: {
                              name: product.name,
                              desc: `${product.category} - ${product.gender}`,
                              price: `Từ ${product.price.toLocaleString("vi-VN")} ₫`,
                              tag: product.category,
                              image: product.image,
                              type: "homepage",
                              badge: product.badge,
                              isNew: product.isNew,
                            },
                          },
                        })
                      }
                    >
                      Xem chi tiết
                    </button>
                    <button 
                      className="btn-order"
                      onClick={() => window.location.href = '/orders/new'}
                    >
                      Đặt may
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-choose-section">
        <div className="section-container">
          <h2 className="section-title">Vì sao chọn tiệm của bạn?</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">✅</div>
              <h3 className="feature-title">May chuẩn số đo</h3>
              <p className="feature-text">Đo đạc chính xác, may vừa vặn từng chi tiết</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🚚</div>
              <h3 className="feature-title">Giao nội thành 3–5 ngày</h3>
              <p className="feature-text">Giao hàng nhanh chóng, đúng hẹn</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">💬</div>
              <h3 className="feature-title">Tư vấn 1-1 với thợ may</h3>
              <p className="feature-text">Được tư vấn trực tiếp bởi thợ may chuyên nghiệp</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">⭐</div>
              <h3 className="feature-title">Chất lượng đảm bảo</h3>
              <p className="feature-text">Vải tốt, đường may chắc chắn, bền đẹp</p>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="reviews-section">
        <div className="section-container">
          <h2 className="section-title">Khách hàng nói gì về chúng tôi</h2>
          <div className="reviews-grid">
            {reviews.map((review, index) => (
              <div key={index} className="review-card">
                <div className="review-header">
                  <img src={review.image} alt={review.name} className="review-avatar" />
                  <div className="review-name">{review.name}</div>
                </div>
                <p className="review-text">"{review.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer" id="contact">
        <div className="footer-container">
          <div className="footer-section">
            <h3 className="footer-title">Tiệm May Của Bạn</h3>
            <p className="footer-text">
              123 Đường ABC, Quận XYZ<br />
              TP. Hồ Chí Minh
            </p>
          </div>
          <div className="footer-section">
            <h3 className="footer-title">Liên hệ</h3>
            <p className="footer-text">
              📞 Hotline: 0900 123 456<br />
              📧 Email: info@tiemmay.com
            </p>
          </div>
          <div className="footer-section">
            <h3 className="footer-title">Theo dõi chúng tôi</h3>
            <div className="footer-social">
              <a href="#" className="social-link">Facebook</a>
              <a href="#" className="social-link">Zalo</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Tiệm May Của Bạn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

