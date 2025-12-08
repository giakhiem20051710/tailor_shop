import { useState, useEffect } from "react";
import Header from "../components/Header.jsx";
import usePageMeta from "../hooks/usePageMeta";

export default function AIStyleSuggestionsPage() {
  const [userPreferences, setUserPreferences] = useState({
    occasion: "",
    bodyType: "",
    colorPreference: "",
    stylePreference: "",
  });
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  usePageMeta({
    title: "AI Gợi ý Phong cách | My Hiền Tailor",
    description:
      "Nhận gợi ý phong cách may đo phù hợp với bạn từ AI thông minh của My Hiền Tailor.",
  });

  const occasions = [
    { id: "wedding", label: "Cưới hỏi", icon: "💒" },
    { id: "office", label: "Công sở", icon: "💼" },
    { id: "party", label: "Tiệc / Sự kiện", icon: "🎉" },
    { id: "daily", label: "Hằng ngày", icon: "👕" },
    { id: "formal", label: "Trang trọng", icon: "🎩" },
  ];

  const bodyTypes = [
    { id: "petite", label: "Nhỏ nhắn" },
    { id: "average", label: "Trung bình" },
    { id: "tall", label: "Cao" },
    { id: "curvy", label: "Đầy đặn" },
  ];

  const colorPreferences = [
    { id: "neutral", label: "Trung tính (đen, trắng, xám)" },
    { id: "warm", label: "Ấm (đỏ, cam, vàng)" },
    { id: "cool", label: "Mát (xanh, tím, hồng)" },
    { id: "bold", label: "Nổi bật (màu sắc tươi sáng)" },
  ];

  const stylePreferences = [
    { id: "classic", label: "Cổ điển" },
    { id: "modern", label: "Hiện đại" },
    { id: "minimalist", label: "Tối giản" },
    { id: "elegant", label: "Thanh lịch" },
    { id: "trendy", label: "Thời trang" },
  ];

  const generateAISuggestions = () => {
    setIsLoading(true);
    // Simulate AI processing
    setTimeout(() => {
      const mockSuggestions = [
        {
          id: 1,
          title: "Áo dài cưới cổ điển",
          description:
            "Phù hợp với dịp cưới hỏi, chất liệu lụa taffeta sang trọng, màu đỏ truyền thống hoặc trắng tinh khôi.",
          image:
            "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80",
          price: "Từ 2.800.000₫",
          matchScore: 95,
          reasons: [
            "Phù hợp với dịp cưới hỏi",
            "Màu sắc ấm áp phù hợp với sở thích của bạn",
            "Kiểu dáng cổ điển thanh lịch",
          ],
        },
        {
          id: 2,
          title: "Vest công sở hiện đại",
          description:
            "Vest 2 lớp, chất liệu cashmere mềm mại, màu xanh navy hoặc xám than chuyên nghiệp.",
          image:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
          price: "Từ 2.200.000₫",
          matchScore: 88,
          reasons: [
            "Phù hợp với môi trường công sở",
            "Kiểu dáng hiện đại, trẻ trung",
            "Chất liệu cao cấp, bền đẹp",
          ],
        },
        {
          id: 3,
          title: "Đầm dạ hội tối giản",
          description:
            "Đầm slip dress chất liệu satin lì, màu đen hoặc nude, đường cắt tối giản nhưng sang trọng.",
          image:
            "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&auto=format&fit=crop&q=80",
          price: "Từ 3.500.000₫",
          matchScore: 82,
          reasons: [
            "Phù hợp với tiệc/sự kiện",
            "Phong cách tối giản theo sở thích",
            "Dễ phối phụ kiện",
          ],
        },
      ];
      setSuggestions(mockSuggestions);
      setIsLoading(false);
    }, 2000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      userPreferences.occasion &&
      userPreferences.bodyType &&
      userPreferences.colorPreference &&
      userPreferences.stylePreference
    ) {
      generateAISuggestions();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50">
      <Header currentPage="/ai-style-suggestions" />
      <main className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-6xl mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-4">
              <span>🤖</span>
              <span>AI Style Assistant</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Gợi ý Phong cách Thông minh
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Cho AI biết về bạn và dịp sử dụng, chúng tôi sẽ đề xuất phong cách may đo phù hợp nhất
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-3xl shadow-xl border border-purple-100 p-6 md:p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Occasion */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Dịp sử dụng *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {occasions.map((occ) => (
                    <button
                      key={occ.id}
                      type="button"
                      onClick={() =>
                        setUserPreferences({ ...userPreferences, occasion: occ.id })
                      }
                      className={`p-4 rounded-2xl border-2 transition-all ${
                        userPreferences.occasion === occ.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-slate-200 hover:border-purple-300"
                      }`}
                    >
                      <div className="text-2xl mb-2">{occ.icon}</div>
                      <div className="text-xs font-medium text-slate-700">
                        {occ.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Body Type */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Dáng người *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {bodyTypes.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() =>
                        setUserPreferences({ ...userPreferences, bodyType: type.id })
                      }
                      className={`p-3 rounded-xl border-2 transition-all ${
                        userPreferences.bodyType === type.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-slate-200 hover:border-purple-300"
                      }`}
                    >
                      <div className="text-sm font-medium text-slate-700">
                        {type.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Preference */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Sở thích màu sắc *
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {colorPreferences.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() =>
                        setUserPreferences({
                          ...userPreferences,
                          colorPreference: color.id,
                        })
                      }
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        userPreferences.colorPreference === color.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-slate-200 hover:border-purple-300"
                      }`}
                    >
                      <div className="text-sm font-medium text-slate-700">
                        {color.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Preference */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Phong cách yêu thích *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {stylePreferences.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() =>
                        setUserPreferences({
                          ...userPreferences,
                          stylePreference: style.id,
                        })
                      }
                      className={`p-3 rounded-xl border-2 transition-all ${
                        userPreferences.stylePreference === style.id
                          ? "border-purple-500 bg-purple-50"
                          : "border-slate-200 hover:border-purple-300"
                      }`}
                    >
                      <div className="text-sm font-medium text-slate-700">
                        {style.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  !userPreferences.occasion ||
                  !userPreferences.bodyType ||
                  !userPreferences.colorPreference ||
                  !userPreferences.stylePreference ||
                  isLoading
                }
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    <span>AI đang phân tích...</span>
                  </span>
                ) : (
                  "✨ Nhận gợi ý từ AI"
                )}
              </button>
            </form>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">
                Gợi ý dành cho bạn
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                {suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden hover:shadow-xl transition-all"
                  >
                    <div className="relative">
                      <img
                        src={suggestion.image}
                        alt={suggestion.title}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-3 right-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                        {suggestion.matchScore}% phù hợp
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {suggestion.title}
                      </h3>
                      <p className="text-sm text-slate-600 mb-4">
                        {suggestion.description}
                      </p>
                      <div className="space-y-2 mb-4">
                        {suggestion.reasons.map((reason, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 text-xs text-slate-600"
                          >
                            <span className="text-purple-500">✓</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-purple-600">
                          {suggestion.price}
                        </span>
                        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

