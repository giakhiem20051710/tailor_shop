import React from "react";
import { useNavigate } from "react-router-dom";
import "./AboutPage.css";
import Header from "../components/Header.jsx";

const AboutPage = () => {
  const navigate = useNavigate();


  return (
    <div className="about-page">
      {/* ========== HEADER ========== */}
      <Header currentPage="/about" />

      {/* ========== HERO ========== */}
      <section className="about-hero">
        <div className="about-hero__inner">
          {/* Left text */}
          <div className="about-hero__left">
            <p className="about-hero__eyebrow">VỀ MỸ HIỀN FASHION</p>
            <h1 className="about-hero__title">
              MỸ HIỀN FASHION – THƯƠNG HIỆU THIẾT KẾ VÁY, ĐẦM & NỘI Y DÀNH CHO
              PHÁI ĐẸP
            </h1>
            <p className="about-hero__subtitle">
              Với tiêu chí{" "}
              <strong>
                “ĐẾN LÀ ĐẸP – HÃY LUÔN ĐẸP, ĐỪNG CHỈ ĐẸP KHI CẦN”
              </strong>{" "}
              Mỹ Hiền luôn mong muốn mang đến những thiết kế tôn dáng, tinh tế
              và phù hợp với từng khách hàng.
            </p>

            <div className="about-hero__body">
              <p>
                Mỹ Hiền hiểu rằng mỗi người phụ nữ đều muốn mình đẹp trong mắt
                người đối diện – từ những buổi tiệc sang trọng, sự kiện quan
                trọng đến những khoảnh khắc đời thường. Vì vậy, việc lựa chọn
                một chiếc váy, chiếc đầm hay bộ nội y không chỉ là “mua cho đủ”,
                mà là đầu tư cho sự tự tin và phong cách cá nhân.
              </p>
              <p>
                <strong>
                  MỸ HIỀN FASHION chuyên thiết kế & sản xuất váy, đầm, nội y
                  với quy trình kiểm tra kỹ lưỡng từng đường kim mũi chỉ
                </strong>{" "}
                – từ khâu chọn chất liệu, lên phom, thử đồ cho đến hoàn thiện
                sản phẩm. Mẫu mã đa dạng: váy dạ hội, đầm maxi, đầm body, đồ
                đi tiệc, đi làm, đi biển, nội y, bra, quần lót… với form dáng và
                phong cách được chọn lọc kỹ cho từng nhóm khách hàng.
              </p>
            </div>

            <a href="/#products" className="about-hero__cta">
              KHÁM PHÁ BỘ SƯU TẬP MỚI
            </a>
          </div>

          {/* Right image */}
          <div className="about-hero__right">
            <div className="about-hero__image-card">
              <img
                src="https://watermark.lovepik.com/photo/20211124/large/lovepik-fashion-womens-summer-shopping-image-picture_500961857.jpg"
                alt="Mỹ Hiền Fashion Model"
                className="about-hero__image"
              />
              <div className="about-hero__badge">
                <span className="about-hero__badge-label">NEW IN</span>
                <span className="about-hero__badge-text">
                  Váy, đầm & nội y thiết kế
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right floating contact */}
        <div className="about-float">
          <a
            href="tel:0901134256"
            className="about-float__btn about-float__btn--phone"
          >
            📞
          </a>
          <a href="#" className="about-float__btn">
            💬
          </a>
          <a href="#contact" className="about-float__btn">
            👤
          </a>
        </div>
      </section>

      {/* ========== SPECIAL SECTION ========== */}
      <section className="about-special">
        <div className="section-container">
          <h2 className="section-title">
            SẢN PHẨM TẠI MỸ HIỀN CÓ GÌ ĐẶC BIỆT?
          </h2>
          <div className="special-grid">
            <div className="special-card">
              <div className="special-icon">👗</div>
              <h3 className="special-title">Mẫu mã đa dạng</h3>
              <p className="special-text">
                100% là sản phẩm thiết kế, cập nhật liên tục theo xu hướng
                thời trang. Đa dạng từ đầm tiệc, đầm dạo phố, đồ đi làm cho đến
                nội y cao cấp.
              </p>
            </div>
            <div className="special-card">
              <div className="special-icon">🧵</div>
              <h3 className="special-title">Chất lượng được chọn lọc</h3>
              <p className="special-text">
                Mỗi sản phẩm đều được kiểm tra kỹ từng đường kim mũi chỉ. Chất
                liệu được chọn sao cho vừa đẹp, vừa thoải mái, có thể mặc lâu
                dài chứ không chỉ trong 1–2 dịp.
              </p>
            </div>
            <div className="special-card">
              <div className="special-icon">💛</div>
              <h3 className="special-title">Chính sách hậu mãi rõ ràng</h3>
              <p className="special-text">
                Hỗ trợ đổi trả khi sản phẩm lỗi, cam kết đồng hành sau bán. Nhiều
                ưu đãi dành cho khách hàng thân thiết và khách hàng quay lại.
              </p>
            </div>
            <div className="special-card">
              <div className="special-icon">🤝</div>
              <h3 className="special-title">Tư vấn tận tâm</h3>
              <p className="special-text">
                Đội ngũ tư vấn luôn sẵn sàng hỗ trợ chọn phom, chọn kiểu và chất
                liệu phù hợp với vóc dáng, làn da và phong cách riêng của bạn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========== QUOTE ========== */}
      <section className="about-quote">
        <div className="section-container">
          <blockquote className="about-quote__text">
            “Thời trang rất quan trọng, nó khiến cuộc sống này trở nên tốt đẹp
            hơn. Và cũng giống như những điều tuyệt vời khác, thời trang xứng
            đáng được bạn đầu tư công sức chăm chút cẩn thận.”
          </blockquote>
          <cite className="about-quote__author">– Vivienne Westwood</cite>
        </div>
      </section>

      {/* ========== NEWEST PRODUCTS ========== */}
      <section className="about-products">
        <div className="section-container">
          <h2 className="section-title">SẢN PHẨM MỚI NHẤT</h2>
          <div className="products-grid">
            {[
              {
                name: "Áo Blazer Nữ – Noir Chic Blazer",
                price: "1.350.000 ₫",
                img: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600&auto=format&fit=crop&q=80",
              },
              {
                name: "Blazer Dài Tay – Crème Classique",
                price: "1.350.000 ₫",
                img: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80",
              },
              {
                name: "Blazer Trắng – Blanc Élégance",
                price: "1.350.000 ₫",
                img: "https://images.unsplash.com/photo-1601925260368-ae2f83d34b08?w=600&auto=format&fit=crop&q=80",
              },
              {
                name: "Bra Corset – Mystère Noir",
                price: "450.000 ₫",
                img: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
              },
              {
                name: "Bralette – Sérénité Chaleureuse",
                price: "450.000 ₫",
                img: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=600&auto=format&fit=crop&q=80",
              },
              {
                name: "Bralette – Lumière Éternelle",
                price: "450.000 ₫",
                img: "https://images.unsplash.com/photo-1552374196-c4e7ffc6e126?w=600&auto=format&fit=crop&q=80",
              },
              {
                name: "Bralette – Éclat de Rosée",
                price: "450.000 ₫",
                img: "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&auto=format&fit=crop&q=80",
              },
              {
                name: "Set Sơ Mi Phối Nơ – A009",
                price: "1.150.000 ₫",
                img: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80",
              },
            ].map((p, idx) => (
              <div key={idx} className="product-card">
                <div className="product-card__image-wrap">
                  <img src={p.img} alt={p.name} />
                </div>
                <div className="product-card__info">
                  <h3 className="product-card__name">{p.name}</h3>
                  <div className="product-card__price">{p.price}</div>
                  <button
                    onClick={() =>
                      navigate("/product/about", {
                        state: {
                          product: {
                            name: p.name,
                            desc: "Sản phẩm thiết kế cao cấp từ Mỹ Hiền Fashion",
                            price: p.price,
                            tag: "Sản phẩm mới",
                            image: p.img,
                            type: "about",
                          },
                        },
                      })
                    }
                    className="product-card__button"
                    style={{
                      marginTop: "8px",
                      width: "100%",
                      padding: "8px 12px",
                      backgroundColor: "#1B4332",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = "#14532d";
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = "#1B4332";
                    }}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CONTACT + SERVICES ========== */}
      <main className="about-main">
        <div className="section-container">
          {/* Contact */}
          <section className="about-contact" id="contact">
            <h2 className="section-title">THÔNG TIN LIÊN HỆ</h2>
            <div className="about-contact__box">
              <p>
                <strong>Địa chỉ:</strong> 50 Tăng Nhơn Phú, Tăng Nhơn Phú B,
                TP. Thủ Đức.
              </p>
              <p>
                <strong>Hotline tư vấn:</strong> 0901 134 256
              </p>
              <p>
                <strong>Hotline khiếu nại:</strong> 0965 794 717
              </p>
              <p>
                <strong>Email:</strong> dvkh@camfashion.vn
              </p>
              <p>
                <strong>Facebook:</strong> Mỹ Hiền Fashion
              </p>
            </div>
          </section>

          {/* Services */}
          <section className="about-services">
            <h2 className="section-title">SẢN PHẨM & DỊCH VỤ</h2>
            <div className="about-services__grid">
              <div className="service-pill">Quần áo thiết kế</div>
              <div className="service-pill">Đầm váy thiết kế</div>
              <div className="service-pill">Nhận may theo yêu cầu</div>
              <div className="service-pill">Chụp ảnh trọn gói</div>
            </div>
          </section>
        </div>
      </main>

      {/* ========== FOOTER ========== */}
      <footer className="about-footer">
        <div className="footer-container">
          <div className="footer-col">
            <h3 className="footer-title">Về Mỹ Hiền Fashion</h3>
            <p className="footer-text">
              MỸ HIỀN FASHION chuyên thiết kế & cung cấp các mẫu váy đầm, nội y
              dành cho phái đẹp. Luôn đặt uy tín, chất lượng và trải nghiệm
              khách hàng lên hàng đầu, với mong muốn mỗi lần bạn mặc đồ của Mỹ
              Hiền là một lần thấy mình đẹp hơn.
            </p>
          </div>
          <div className="footer-col">
            <h3 className="footer-title">Liên hệ</h3>
            <p className="footer-text">
              📍 50 Tăng Nhơn Phú, Tăng Nhơn Phú B, TP. Thủ Đức
              <br />
              📞 0901 134 256
              <br />
              📧 dvkh@camfashion.vn
              <br />
              🕐 7h00 – 23h00 (kể cả lễ & CN)
            </p>
          </div>
          <div className="footer-col">
            <h3 className="footer-title">Hỗ trợ khách hàng</h3>
            <div className="footer-links">
              <a href="#" className="footer-link">
                Phí vận chuyển
              </a>
              <a href="#" className="footer-link">
                Bảo hành & đổi trả
              </a>
              <a href="#" className="footer-link">
                Tư vấn chọn size
              </a>
              <a href="#" className="footer-link">
                Hướng dẫn đặt hàng
              </a>
              <a href="#" className="footer-link">
                Mã khuyến mãi
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h3 className="footer-title">Kết nối</h3>
            <a href="#" className="footer-social-link">
              Fanpage Mỹ Hiền Fashion
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2025 Bản quyền thuộc Mỹ Hiền Fashion.</p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
