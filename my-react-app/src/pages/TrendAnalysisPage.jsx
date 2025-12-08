import { useState, useEffect } from "react";
import Header from "../components/Header.jsx";
import usePageMeta from "../hooks/usePageMeta";

export default function TrendAnalysisPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [trends, setTrends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  usePageMeta({
    title: "Phân tích Xu hướng Thời trang | My Hiền Tailor",
    description:
      "Khám phá xu hướng thời trang đang thịnh hành và được yêu thích nhất",
  });

  useEffect(() => {
    // Simulate loading trends
    setIsLoading(true);
    setTimeout(() => {
      setTrends([
        {
          id: 1,
          category: "Áo dài",
          trend: "Tăng",
          change: "+35%",
          popularStyles: [
            "Áo dài cưới cổ điển",
            "Áo dài hiện đại tối giản",
            "Áo dài cách tân",
          ],
          popularColors: ["Đỏ", "Trắng", "Hồng", "Vàng"],
          season: "Mùa cưới",
          image:
            "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80",
        },
        {
          id: 2,
          category: "Vest",
          trend: "Ổn định",
          change: "+8%",
          popularStyles: [
            "Vest công sở 2 lớp",
            "Vest cưới sang trọng",
            "Vest blazer casual",
          ],
          popularColors: ["Xanh navy", "Xám than", "Đen"],
          season: "Quanh năm",
          image:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80",
        },
        {
          id: 3,
          category: "Đầm",
          trend: "Tăng mạnh",
          change: "+52%",
          popularStyles: [
            "Đầm slip dress",
            "Đầm dạ hội maxi",
            "Đầm công sở A-line",
          ],
          popularColors: ["Đen", "Nude", "Xanh navy", "Đỏ"],
          season: "Mùa tiệc",
          image:
            "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=600&auto=format&fit=crop&q=80",
        },
      ]);
      setIsLoading(false);
    }, 1500);
  }, [selectedPeriod]);

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
              Khám phá những xu hướng đang thịnh hành dựa trên dữ liệu đơn hàng và sở thích khách hàng
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
                className={`px-6 py-2 rounded-xl font-semibold transition ${
                  selectedPeriod === period.id
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-white text-slate-700 hover:bg-indigo-50"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {/* Trends */}
          {isLoading ? (
            <div className="text-center py-20">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <p className="text-slate-600">Đang phân tích xu hướng...</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-3">
              {trends.map((trend) => (
                <div
                  key={trend.id}
                  className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition"
                >
                  <div className="relative h-48">
                    <img
                      src={trend.image}
                      alt={trend.category}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
                      <span
                        className={`text-sm font-semibold ${
                          trend.trend === "Tăng mạnh"
                            ? "text-green-600"
                            : trend.trend === "Tăng"
                            ? "text-blue-600"
                            : "text-slate-600"
                        }`}
                      >
                        {trend.change}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-2xl font-bold text-slate-900">
                        {trend.category}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          trend.trend === "Tăng mạnh"
                            ? "bg-green-100 text-green-700"
                            : trend.trend === "Tăng"
                            ? "bg-blue-100 text-blue-700"
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
                          {trend.popularStyles.map((style, idx) => (
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
                          {trend.popularColors.map((color, idx) => (
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

          {/* Insights */}
          <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-6">Insights từ AI</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                <h3 className="font-semibold mb-2">Xu hướng nổi bật</h3>
                <p className="text-sm text-white/90">
                  Áo dài cưới và đầm dạ hội đang có xu hướng tăng mạnh trong tháng này, đặc biệt là các thiết kế cổ điển với chất liệu lụa cao cấp.
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5">
                <h3 className="font-semibold mb-2">Gợi ý kinh doanh</h3>
                <p className="text-sm text-white/90">
                  Nên chuẩn bị nhiều vải lụa taffeta và satin trong các màu đỏ, trắng, hồng để đáp ứng nhu cầu mùa cưới đang đến.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

