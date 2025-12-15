import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./HomePage.css";
import usePageMeta from "../hooks/usePageMeta";

const HomePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");

  usePageMeta({
    title: "My Hiền Tailor | Atelier may đo áo dài, vest, đầm cao cấp",
    description:
      "Khám phá bộ sưu tập và trải nghiệm atelier của My Hiền Tailor: tư vấn stylist 1:1, may đo chuẩn dáng và kho vải tuyển chọn.",
  });

  const categories = ["Tất cả", "Áo dài", "Vest", "Váy", "Đồng phục"];

  const heroHighlights = [
    { label: "Khách hàng thân thiết", value: "12.4K+", description: "đã may đo mỗi năm" },
    { label: "Đảm bảo form dáng", value: "100%", description: "chỉnh sửa miễn phí" },
    { label: "Thời gian hoàn thiện", value: "72H", description: "fast track cho sự kiện gấp" },
  ];

  const servicePillars = [
    {
      title: "Atelier Service",
      desc: "Trải nghiệm thử phom riêng tư với stylist và thợ trưởng.",
      tag: "Signature",
      icon: "🎩",
    },
    {
      title: "Digital Fitting",
      desc: "Đo số đo qua app AR, theo dõi tiến độ realtime và nhận báo cáo.",
      tag: "Tech-enabled",
      icon: "📱",
    },
    {
      title: "Material Library",
      desc: "Hơn 250 chất liệu thủ công được tuyển, kèm chứng chỉ nguồn gốc.",
      tag: "Curated",
      icon: "🧵",
    },
  ];

  const atelierSteps = [
    { title: "Book lịch tư vấn", desc: "Chọn stylist, lịch fitting trực tuyến hoặc tại atelier." },
    { title: "Chốt phom & chất liệu", desc: "Tạo moodboard, xem thử phom 3D, xác nhận chi tiết." },
    { title: "Theo dõi tiến độ", desc: "Nhận cập nhật từng mốc, có thể yêu cầu điều chỉnh online." },
    { title: "Nhận đồ & chăm sóc", desc: "Giao tận nơi, kèm chính sách chăm sóc & chỉnh sửa 90 ngày." },
  ];

  const pressLogos = ["Vogue VN", "Harper's Bazaar", "ELLE", "L'Officiel"];

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

  const filteredProducts =
    selectedCategory === "Tất cả"
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const scrollToProducts = () => {
    const element = document.getElementById('products-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigation = (path) => {
    navigate(path);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="home-page brand-home">
      <header className="brand-hero" id="home">
        <div className="brand-hero__nav">
          <div className="brand-hero__logo">
            <span className="logo-mark">Lavi Tailor</span>
            <span className="logo-tagline">Atelier since 1998</span>
          </div>
          <nav className="brand-hero__links">
            <button onClick={() => handleNavigation("/customer-home")}>Trang chủ</button>
            <button onClick={() => handleNavigation("/about")}>Giới thiệu</button>
            <button onClick={() => scrollToProducts()}>Bộ sưu tập</button>
            <button onClick={() => handleNavigation("/promotions")}>Ưu đãi</button>
            <button onClick={() => handleNavigation("/support")}>Hỗ trợ</button>
          </nav>
          <div className="brand-hero__cta">
            <button className="ghost-btn" onClick={() => handleNavigation("/login")}>
              Đăng nhập
            </button>
            <button className="filled-btn" onClick={() => (window.location.href = "/orders/new")}>
              Đặt may nhanh
            </button>
          </div>
        </div>

        <div className="brand-hero__content">
          <div className="brand-hero__text">
            <p className="eyebrow">Chuyên nghiệp & cá nhân hoá</p>
            <h1>
              My Hiền Tailor – thiết kế may đo chuẩn haute couture,{" "}
              <span>đồng hành cùng mọi khoảnh khắc của bạn.</span>
            </h1>
            <p className="lede">
              Đội ngũ stylist và thợ trưởng của Lavi Tailor tạo nên từng phom dáng theo phong cách
              riêng. Từ áo dài cưới, vest công sở đến capsule wardrobe, mọi gói đều có quy trình chăm
              sóc trọn vẹn.
            </p>
            <div className="hero-actions">
              <button className="filled-btn" onClick={scrollToProducts}>
                Khám phá bộ sưu tập
              </button>
              <button className="ghost-btn" onClick={() => handleNavigation("/about")}>
                Quy trình atelier
              </button>
            </div>
            <div className="hero-highlights">
              {heroHighlights.map((item) => (
                <div key={item.label}>
                  <p>{item.value}</p>
                  <span>{item.label}</span>
                  <small>{item.description}</small>
                </div>
              ))}
            </div>
          </div>

          <div className="brand-hero__media">
            <div className="media-card primary">
              <img
                src="https://images.pexels.com/photos/6311678/pexels-photo-6311678.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Elegant gown"
              />
              <div className="media-card__label">
                <p>Haute Wedding Capsule</p>
                <span>Limited 2025</span>
              </div>
            </div>
            <div className="media-card secondary">
              <img
                src="https://images.pexels.com/photos/7130498/pexels-photo-7130498.jpeg?auto=compress&cs=tinysrgb&w=1200"
                alt="Tailor details"
              />
              <div className="floating-card">
                <p>Stylist 1-1</p>
                <strong>12 stylist đang online</strong>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="trust-bar">
        <div className="trust-marquee">
          {pressLogos.map((logo) => (
            <span key={logo}>{logo}</span>
          ))}
        </div>
        <div className="trust-pill">
          <p>Đánh giá 4.9/5 • Được các thương hiệu thời trang Việt yêu thích</p>
          <button onClick={() => handleNavigation("/about")}>Xem câu chuyện thương hiệu</button>
        </div>
      </section>

      {/* Quick Categories */}
      <section className="categories-section">
        <div className="categories-container">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-chip ${selectedCategory === cat ? "active" : ""}`}
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

      <section className="service-pillar-section">
        <div className="section-container">
          <div className="section-heading">
            <p className="eyebrow">Trải nghiệm atelier</p>
            <h2>Thiết kế hướng đến niềm tin & sự đồng hành lâu dài</h2>
          </div>
          <div className="pillar-grid">
            {servicePillars.map((pillar) => (
              <article key={pillar.title} className="pillar-card">
                <div className="pillar-card__icon">{pillar.icon}</div>
                <div className="pillar-card__tag">{pillar.tag}</div>
                <h3>{pillar.title}</h3>
                <p>{pillar.desc}</p>
                <button onClick={scrollToProducts}>Xem chi tiết</button>
              </article>
            ))}
          </div>
        </div>
      </section>

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

      <section className="atelier-section">
        <div className="section-container">
          <div className="atelier-shell">
            <div className="atelier-intro">
              <p className="eyebrow">Quy trình 4 bước</p>
              <h2>Atelier trải nghiệm riêng tư, minh bạch từng chi tiết.</h2>
              <p>
                Từ lúc đặt lịch đến khi nhận đồ, bạn được theo sát bởi stylist & thợ trưởng. Mọi
                thông số được lưu trên hồ sơ cá nhân để tái đặt may nhanh hơn ở những lần sau.
              </p>
              <button className="filled-btn" onClick={() => (window.location.href = "/orders/new")}>
                Đặt lịch fitting
              </button>
            </div>
            <div className="atelier-steps">
              {atelierSteps.map((step, index) => (
                <div key={step.title} className="atelier-step">
                  <span>{index + 1}</span>
                  <div>
                    <h4>{step.title}</h4>
                    <p>{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="reviews-section">
        <div className="section-container">
          <div className="section-heading">
            <p className="eyebrow">Testimonial</p>
            <h2>Khách hàng tin tưởng Lavi Tailor vì sự tận tâm & chỉn chu.</h2>
          </div>
          <div className="reviews-grid">
            {reviews.map((review, index) => (
              <div key={index} className="review-card">
                <div className="review-header">
                  <img src={review.image} alt={review.name} className="review-avatar" />
                  <div>
                    <p className="review-name">{review.name}</p>
                    <span>Verified client</span>
                  </div>
                </div>
                <p className="review-text">"{review.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="home-footer" id="contact">
        <div className="footer-container">
          <div className="footer-brand">
            <h3>Lavi Tailor</h3>
            <p>Atelier 01: 123 Nguyễn Thị Minh Khai, Q.1, TP.HCM</p>
            <p>Atelier 02: 45 Hai Bà Trưng, Hà Nội</p>
          </div>
          <div className="footer-links">
            <h4>Dịch vụ</h4>
            <a href="#" onClick={scrollToProducts}>
              Bộ sưu tập
            </a>
            <a href="#" onClick={() => handleNavigation("/orders/new")}>
              Đặt may
            </a>
            <a href="#" onClick={() => handleNavigation("/support")}>
              Chăm sóc khách hàng
            </a>
          </div>
          <div className="footer-links">
            <h4>Kết nối</h4>
            <a href="tel:+84901134256">Hotline: 0901 134 256</a>
            <a href="mailto:atelier@lavi.vn">atelier@lavi.vn</a>
            <a href="#">Instagram</a>
            <a href="#">TikTok</a>
          </div>
          <div className="footer-newsletter">
            <h4>Nhận bản tin Atelier</h4>
            <p>Cập nhật drop mới, khuyến mãi dành riêng cho khách thân thiết.</p>
            <div className="newsletter-control">
              <input type="email" placeholder="you@email.com" />
              <button>Đăng ký</button>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Lavi Tailor. Crafted with care.</span>
          <button onClick={scrollToTop}>Về đầu trang ↑</button>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;

