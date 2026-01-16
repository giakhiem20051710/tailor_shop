import { useState, useEffect } from "react";
import Header from "../components/Header.jsx";
import usePageMeta from "../hooks/usePageMeta";
import trendService from "../services/trendService";

export default function TrendAnalysisPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [trends, setTrends] = useState([]);
  const [insights, setInsights] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  usePageMeta({
    title: "Phân tích Xu hướng Thời trang | My Hiền Tailor",
    description:
      "Khám phá xu hướng thời trang đang thịnh hành và được yêu thích nhất",
  });

  useEffect(() => {
    const fetchTrends = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await trendService.analyzeTrends(selectedPeriod);
        const data = trendService.parseResponse(response);

        if (data && data.trends) {
          setTrends(data.trends);
          setInsights(data.insights);
        } else {
          // Fallback to empty state
          setTrends([]);
          setInsights(null);
        }
      } catch (err) {
        console.error("Error fetching trends:", err);
        setError("Không thể tải dữ liệu xu hướng. Vui lòng thử lại sau.");
        setTrends([]);
        setInsights(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrends();
  }, [selectedPeriod]);

  const fallbackImage = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <Header currentPage="/trend-analysis" />
      <main className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-4">
              <span>📊</span>
              <span>AI Trend Analysis</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Phân tích Xu hướng Thời trang
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Khám phá những xu hướng đang thịnh hành dựa trên dữ liệu thực tế từ bộ sưu tập của chúng tôi
            </p>
          </div>

          {/* Period Selector */}
          <div className="flex justify-center gap-3 mb-8">
            {[
              { id: "week", label: "Tuần này" },
              { id: "month", label: "Tháng này" },
              { id: "quarter", label: "Quý này" },
              { id: "year", label: "Năm nay" },
            ].map((period) => (
              <button
                key={period.id}
                onClick={() => setSelectedPeriod(period.id)}
                className={`px-6 py-2 rounded-xl font-semibold transition ${selectedPeriod === period.id
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white text-slate-700 hover:bg-indigo-50"
                  }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Error State */}
          {error && (
            <div className="text-center py-10 bg-red-50 rounded-2xl mb-8">
              <p className="text-red-600">{error}</p>
              <button
                onClick={() => setSelectedPeriod(selectedPeriod)}
                className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Trends */}
          {isLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p className="text-slate-600">Đang phân tích xu hướng từ AI...</p>
            </div>
          ) : trends.length === 0 && !error ? (
            <div className="text-center py-20 bg-white rounded-3xl shadow-lg">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-2xl font-bold text-slate-700 mb-2">Chưa có dữ liệu</h3>
              <p className="text-slate-500">
                Chưa có đủ dữ liệu để phân tích xu hướng trong khoảng thời gian này.
                <br />Hãy thử chọn khoảng thời gian dài hơn hoặc tải lên thêm ảnh sản phẩm.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {trends.map((trend) => (
                <div
                  key={trend.id}
                  className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition"
                >
                  <div className="relative h-[400px]">
                    <img
                      src={trend.image || fallbackImage}
                      alt={trend.category}
                      className="w-full h-full object-cover object-top"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = fallbackImage;
                      }}
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span
                        className={`text-sm font-semibold ${trend.trend === "Tăng mạnh"
                            ? "text-green-600"
                            : trend.trend === "Tăng"
                              ? "text-blue-600"
                              : trend.trend === "Giảm"
                                ? "text-red-600"
                                : "text-slate-600"
                          }`}
                      >
                        {trend.change}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span className="text-white text-sm">
                        {trend.imageCount} mẫu
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-slate-900">
                        {trend.category}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${trend.trend === "Tăng mạnh"
                            ? "bg-green-100 text-green-700"
                            : trend.trend === "Tăng"
                              ? "bg-blue-100 text-blue-700"
                              : trend.trend === "Giảm"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-100 text-slate-700"
                          }`}
                      >
                        {trend.trend}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {/* Popular Styles */}
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">
                          Kiểu dáng phổ biến:
                        </p>
                        <ul className="space-y-1">
                          {trend.popularStyles?.map((style, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-sm text-slate-600"
                            >
                              <span className="text-indigo-500">•</span>
                              <span>{style}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Popular Colors */}
                      <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">
                          Màu sắc được yêu thích:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {trend.popularColors?.map((color, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"
                            >
                              {color}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Season */}
                      <div className="pt-2 border-t border-slate-200">
                        <p className="text-xs text-slate-500">
                          <span className="font-semibold">Mùa:</span> {trend.season}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AI Insights */}
          {insights && (
            <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span>🤖</span>
                <span>Insights từ AI</span>
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                  <h3 className="font-semibold mb-2">Xu hướng nổi bật</h3>
                  <p className="text-sm text-white/90">
                    {insights.highlight || "Đang phân tích..."}
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                  <h3 className="font-semibold mb-2">Gợi ý kinh doanh</h3>
                  <p className="text-sm text-white/90">
                    {insights.businessSuggestion || "Đang phân tích..."}
                  </p>
                </div>
              </div>

              {/* Top Trends */}
              {insights.topTrends && insights.topTrends.length > 0 && (
                <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                  <h3 className="font-semibold mb-3">Top xu hướng</h3>
                  <div className="flex flex-wrap gap-2">
                    {insights.topTrends.map((trend, idx) => (
                      <span
                        key={idx}
                        className="px-4 py-2 bg-white/20 rounded-full text-sm font-medium"
                      >
                        #{idx + 1} {trend}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Market Analysis */}
              {insights.marketAnalysis && (
                <div className="mt-4 text-sm text-white/70 text-center">
                  📈 {insights.marketAnalysis}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
