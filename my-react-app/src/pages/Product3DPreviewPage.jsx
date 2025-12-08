import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import usePageMeta from "../hooks/usePageMeta";

export default function Product3DPreviewPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [selectedView, setSelectedView] = useState("front");
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  usePageMeta({
    title: "Xem trước 3D | My Hiền Tailor",
    description: "Xem trước sản phẩm may đo của bạn trong không gian 3D",
  });

  // Mock product data
  const product = {
    id: productId || "ao-dai-cuoi",
    name: "Áo dài cưới cổ điển",
    description: "Áo dài cưới chất liệu lụa taffeta thượng hạng",
    images: {
      front: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80",
      back: "https://images.unsplash.com/photo-1557825835-70d97c4aa06a?w=800&auto=format&fit=crop&q=80",
      side: "https://images.unsplash.com/photo-1616400619175-5beda3a178d8?w=800&auto=format&fit=crop&q=80",
    },
    colors: ["Đỏ", "Trắng", "Hồng", "Vàng"],
    fabrics: ["Lụa Taffeta", "Lụa Satin", "Lụa Chiffon"],
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setRotation({
      x: rotation.x + deltaY * 0.5,
      y: rotation.y + deltaX * 0.5,
    });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header currentPage="/3d-preview" />
      <main className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* 3D Viewer */}
            <div className="bg-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Xem trước 3D</h2>
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <span>🖱️</span>
                  <span>Kéo để xoay</span>
                </div>
              </div>

              {/* 3D Canvas Area */}
              <div
                ref={canvasRef}
                className="relative bg-gradient-to-br from-slate-700 to-slate-900 rounded-2xl overflow-hidden"
                style={{ aspectRatio: "1/1.3", minHeight: "500px" }}
                onMouseDown={handleMouseDown}
              >
                {/* Mock 3D View - In production, use Three.js or model-viewer */}
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{
                    transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                    transition: isDragging ? "none" : "transform 0.1s",
                  }}
                >
                  <img
                    src={product.images[selectedView]}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain"
                    style={{
                      filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.5))",
                    }}
                  />
                </div>

                {/* View Controls */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                  {Object.keys(product.images).map((view) => (
                    <button
                      key={view}
                      onClick={() => setSelectedView(view)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        selectedView === view
                          ? "bg-purple-600 text-white"
                          : "bg-white/20 text-white hover:bg-white/30"
                      }`}
                    >
                      {view === "front" ? "Mặt trước" : view === "back" ? "Mặt sau" : "Bên"}
                    </button>
                  ))}
                </div>

                {/* Rotation Reset */}
                <button
                  onClick={() => setRotation({ x: 0, y: 0 })}
                  className="absolute top-4 right-4 px-3 py-2 bg-white/20 text-white rounded-lg text-sm hover:bg-white/30 transition"
                >
                  🔄 Đặt lại
                </button>
              </div>

              {/* AR Button */}
              <button className="w-full mt-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition">
                📱 Thử trên điện thoại (AR)
              </button>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                  {product.name}
                </h1>
                <p className="text-slate-600 mb-6">{product.description}</p>

                {/* Color Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Chọn màu
                  </label>
                  <div className="flex gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        className="px-4 py-2 rounded-lg border-2 border-slate-200 hover:border-purple-500 transition"
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fabric Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">
                    Chọn chất liệu vải
                  </label>
                  <div className="space-y-2">
                    {product.fabrics.map((fabric) => (
                      <button
                        key={fabric}
                        className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 hover:border-purple-500 transition text-left"
                      >
                        {fabric}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate("/customer/order")}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
                  >
                    Đặt may ngay
                  </button>
                  <button className="px-6 py-3 border-2 border-slate-300 rounded-xl font-semibold hover:bg-slate-50 transition">
                    💾 Lưu
                  </button>
                </div>
              </div>

              {/* Features */}
              <div className="bg-white rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Tính năng 3D
                </h3>
                <ul className="space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">✓</span>
                    <span>Xoay 360° để xem mọi góc độ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">✓</span>
                    <span>Thay đổi màu sắc và chất liệu trực tiếp</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">✓</span>
                    <span>Xem trên AR (Augmented Reality) bằng điện thoại</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">✓</span>
                    <span>Lưu và chia sẻ thiết kế của bạn</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

