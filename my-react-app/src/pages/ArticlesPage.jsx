import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";

const ArticlesPage = () => {
  const navigate = useNavigate();

  const articles = [
    {
      id: 1,
      title: "Xu hướng thời trang 2025: Tối giản nhưng thanh lịch",
      excerpt: "Khám phá những xu hướng thời trang nổi bật năm 2025 với phong cách tối giản nhưng vẫn giữ được sự thanh lịch và sang trọng.",
      image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
      category: "Xu hướng",
      date: "15/01/2025",
      readTime: "5 phút đọc",
      featured: true,
    },
    {
      id: 2,
      title: "Bí quyết chọn màu sắc phù hợp với làn da",
      excerpt: "Hướng dẫn chi tiết cách chọn màu sắc trang phục phù hợp với tone da của bạn để luôn tỏa sáng và tự tin.",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&h=600&fit=crop",
      category: "Styling",
      date: "12/01/2025",
      readTime: "4 phút đọc",
      featured: false,
    },
    {
      id: 3,
      title: "Mix & Match: Tạo phong cách riêng với tủ đồ cơ bản",
      excerpt: "Cách kết hợp những món đồ cơ bản trong tủ quần áo để tạo ra nhiều outfit khác nhau, vừa tiết kiệm vừa thời trang.",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=600&fit=crop",
      category: "Styling",
      date: "10/01/2025",
      readTime: "6 phút đọc",
      featured: false,
    },
    {
      id: 4,
      title: "Chất liệu vải cao cấp: Đầu tư đúng để bền đẹp",
      excerpt: "Tìm hiểu về các loại chất liệu vải cao cấp và cách chăm sóc để giữ được độ bền và vẻ đẹp theo thời gian.",
      image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop",
      category: "Kiến thức",
      date: "08/01/2025",
      readTime: "7 phút đọc",
      featured: false,
    },
    {
      id: 5,
      title: "Phong cách công sở: Từ formal đến smart casual",
      excerpt: "Các gợi ý phong cách công sở từ trang phục formal đến smart casual, phù hợp với mọi môi trường làm việc.",
      image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&fit=crop",
      category: "Styling",
      date: "05/01/2025",
      readTime: "5 phút đọc",
      featured: false,
    },
    {
      id: 6,
      title: "Thời trang bền vững: Xu hướng tất yếu của tương lai",
      excerpt: "Tìm hiểu về thời trang bền vững và cách chúng ta có thể góp phần bảo vệ môi trường thông qua lựa chọn trang phục.",
      image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop",
      category: "Xu hướng",
      date: "03/01/2025",
      readTime: "8 phút đọc",
      featured: false,
    },
    {
      id: 7,
      title: "Cách chọn size quần áo online chuẩn nhất",
      excerpt: "Hướng dẫn chi tiết cách đo và chọn size quần áo khi mua online để đảm bảo vừa vặn và thoải mái.",
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop",
      category: "Kiến thức",
      date: "01/01/2025",
      readTime: "6 phút đọc",
      featured: false,
    },
    {
      id: 8,
      title: "Phụ kiện thời trang: Điểm nhấn hoàn hảo cho outfit",
      excerpt: "Khám phá cách sử dụng phụ kiện để tạo điểm nhấn và nâng tầm phong cách thời trang của bạn.",
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&h=600&fit=crop",
      category: "Styling",
      date: "28/12/2024",
      readTime: "5 phút đọc",
      featured: false,
    },
  ];

  const categories = ["Tất cả", "Xu hướng", "Styling", "Kiến thức"];

  return (
    <div className="min-h-screen bg-[#F5F3EF] text-[#1F2933] body-font antialiased">
      <Header currentPage="/articles" />

      <div className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <p className="text-[11px] tracking-[0.25em] uppercase text-[#6B7280] mb-2">
              Tin tức & Xu hướng
            </p>
            <h1 className="heading-font text-[32px] md:text-[42px] text-[#111827] mb-4">
              BÀI VIẾT
            </h1>
            <p className="text-[15px] text-[#6B7280] max-w-2xl mx-auto">
              Cập nhật những xu hướng thời trang mới nhất, bí quyết styling và kiến thức về thời trang từ các chuyên gia
            </p>
          </div>

          {/* Featured Article */}
          {articles.find(a => a.featured) && (
            <div className="mb-16">
              {(() => {
                const featured = articles.find(a => a.featured);
                return (
                  <article 
                    className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => navigate(`/articles/${featured.id}`)}
                  >
                    <div className="md:flex">
                      <div className="md:w-1/2">
                        <div className="relative h-64 md:h-full min-h-[300px] overflow-hidden">
                          <img 
                            src={featured.image} 
                            alt={featured.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-4 left-4">
                            <span className="px-3 py-1 bg-[#8B4513] text-white text-[11px] font-semibold uppercase tracking-wide rounded-full">
                              {featured.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                        <div className="flex items-center gap-3 text-[12px] text-[#6B7280] mb-4">
                          <span>{featured.date}</span>
                          <span>•</span>
                          <span>{featured.readTime}</span>
                        </div>
                        <h2 className="heading-font text-[24px] md:text-[32px] text-[#111827] mb-4 leading-tight">
                          {featured.title}
                        </h2>
                        <p className="text-[15px] text-[#4B5563] leading-relaxed mb-6">
                          {featured.excerpt}
                        </p>
                        <button className="inline-flex items-center gap-2 text-[#8B4513] font-semibold text-[14px] hover:gap-3 transition-all">
                          Đọc tiếp
                          <span>→</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })()}
            </div>
          )}

          {/* Category Filter */}
          <div className="mb-8 flex flex-wrap gap-3 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                className="px-6 py-2 rounded-full border-2 border-[#E5E7EB] text-[13px] font-semibold text-[#374151] hover:border-[#8B4513] hover:text-[#8B4513] hover:bg-[#8B4513]/5 transition-all"
              >
                {category}
              </button>
            ))}
          </div>

          {/* Articles Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles
              .filter(article => !article.featured)
              .map((article) => (
                <article
                  key={article.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all cursor-pointer group"
                  onClick={() => navigate(`/articles/${article.id}`)}
                >
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={article.image} 
                      alt={article.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-[#8B4513] text-white text-[11px] font-semibold uppercase tracking-wide rounded-full">
                        {article.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-[11px] text-[#6B7280] mb-3">
                      <span>{article.date}</span>
                      <span>•</span>
                      <span>{article.readTime}</span>
                    </div>
                    <h3 className="heading-font text-[18px] text-[#111827] mb-3 leading-tight group-hover:text-[#8B4513] transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-[13px] text-[#4B5563] leading-relaxed mb-4 line-clamp-3">
                      {article.excerpt}
                    </p>
                    <button className="text-[#8B4513] font-semibold text-[13px] hover:underline">
                      Đọc tiếp →
                    </button>
                  </div>
                </article>
              ))}
          </div>

          {/* Newsletter Section */}
          <div className="mt-16 bg-gradient-to-r from-[#8B4513] to-[#A0522D] rounded-2xl p-8 md:p-12 text-center text-white">
            <h3 className="heading-font text-[24px] md:text-[28px] mb-3">
              Đăng ký nhận tin tức
            </h3>
            <p className="text-[14px] text-white/90 mb-6 max-w-md mx-auto">
              Nhận những bài viết mới nhất về xu hướng thời trang và bí quyết styling trực tiếp vào email của bạn
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                className="flex-1 px-4 py-3 rounded-full text-[#111827] text-[14px] outline-none"
              />
              <button className="px-6 py-3 bg-white text-[#8B4513] font-semibold rounded-full hover:bg-[#F5E6D3] transition-colors text-[14px]">
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="bg-[#111827] text-white py-10 text-[12px]">
        <div className="max-w-7xl mx-auto px-5 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-6">
            <div className="md:col-span-2">
              <h3 className="heading-font text-[16px] mb-2">LAVI TAILOR</h3>
              <p className="text-[#9CA3AF] max-w-md">
                Tiệm may đo nhỏ, nhưng cẩn thận trong từng đường kim mũi chỉ.
                Chúng tôi mong bạn có thể mặc đồ may đo thường xuyên, không chỉ
                trong những dịp "đặc biệt".
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-[#E5E7EB] text-[13px]">
                Địa chỉ
              </h4>
              <p className="text-[#9CA3AF]">
                123 Đường ABC
                <br />
                Quận XYZ, TP. Hồ Chí Minh
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2 text-[#E5E7EB] text-[13px]">
                Liên hệ
              </h4>
              <p className="text-[#9CA3AF]">
                Email: info@lavitailor.com
                <br />
                Phone: 0901 234 567
                <br />
                Giờ mở cửa: 9:00 - 20:00
              </p>
            </div>
          </div>
          <div className="border-t border-[#1F2937] pt-4 flex justify-between items-center text-[#6B7280] text-[11px]">
            <span>© 2025 Lavi Tailor</span>
            <div className="flex gap-4">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ArticlesPage;

