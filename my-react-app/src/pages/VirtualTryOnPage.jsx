import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import usePageMeta from "../hooks/usePageMeta";
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import { Camera } from "@mediapipe/camera_utils";

export default function VirtualTryOnPage() {
  const navigate = useNavigate();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isARReady, setIsARReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const selfieSegmentationRef = useRef(null);
  const cameraRef = useRef(null);
  const productImageRef = useRef(null);

  usePageMeta({
    title: "Thử áo ảo AR | My Hiền Tailor",
    description: "Thử áo dài, vest, đầm trên người bạn bằng công nghệ AR thực tế",
  });

  const products = [
    {
      id: "ao-dai",
      name: "Áo dài cưới",
      image:
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&auto=format&fit=crop&q=80",
      category: "Áo dài",
      overlayPosition: { x: 0.2, y: 0.1, width: 0.6, height: 0.8 },
    },
    {
      id: "vest",
      name: "Vest công sở",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
      category: "Vest",
      overlayPosition: { x: 0.15, y: 0.05, width: 0.7, height: 0.9 },
    },
    {
      id: "dam",
      name: "Đầm dạ hội",
      image:
        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&auto=format&fit=crop&q=80",
      category: "Đầm",
      overlayPosition: { x: 0.2, y: 0.15, width: 0.6, height: 0.75 },
    },
  ];

  // Initialize MediaPipe Selfie Segmentation
  useEffect(() => {
    if (!isCameraActive) return;

    const initializeAR = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const selfieSegmentation = new SelfieSegmentation({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
          },
        });

        selfieSegmentation.setOptions({
          modelSelection: 1, // 0 for general, 1 for landscape
          selfieMode: true,
        });

        selfieSegmentation.onResults((results) => {
          if (!canvasRef.current || !videoRef.current) return;

          const canvas = canvasRef.current;
          const video = videoRef.current;
          const ctx = canvas.getContext("2d");

          // Set canvas size to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Draw video frame
          ctx.save();
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

          // Draw product overlay on person
          if (selectedProduct && results.segmentationMask) {
            const mask = results.segmentationMask;
            ctx.globalCompositeOperation = "source-over";

            // Load product image
            const productImg = new Image();
            productImg.crossOrigin = "anonymous";
            productImg.onload = () => {
              const pos = selectedProduct.overlayPosition;
              const x = pos.x * canvas.width;
              const y = pos.y * canvas.height;
              const width = pos.width * canvas.width;
              const height = pos.height * canvas.height;

              // Apply mask to blend product with person
              ctx.globalCompositeOperation = "source-atop";
              ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
              ctx.globalCompositeOperation = "source-over";
              ctx.drawImage(productImg, x, y, width, height);
            };
            productImg.src = selectedProduct.image;
          }

          ctx.restore();
        });

        selfieSegmentationRef.current = selfieSegmentation;

        // Initialize camera
        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && selfieSegmentationRef.current) {
                await selfieSegmentationRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480,
          });
          cameraRef.current = camera;
          await camera.start();
          setIsARReady(true);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("AR initialization error:", err);
        setError("Không thể khởi tạo AR. Vui lòng thử lại hoặc dùng trình duyệt khác.");
        setIsLoading(false);
      }
    };

    initializeAR();

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, [isCameraActive, selectedProduct]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
      setError("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập.");
    }
  };

  const stopCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
    }
    setIsCameraActive(false);
    setIsARReady(false);
    setSelectedProduct(null);
  };

  const handleTryOn = (product) => {
    if (!isCameraActive) {
      startCamera().then(() => setSelectedProduct(product));
    } else {
      setSelectedProduct(product);
    }
  };

  const capturePhoto = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `try-on-${selectedProduct?.id || "photo"}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header currentPage="/virtual-tryon" />
      <main className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
              <span>📱</span>
              <span>AR Virtual Try-On</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Thử áo ảo trên người bạn
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Sử dụng công nghệ AR thực tế với MediaPipe để overlay sản phẩm lên người bạn
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
              <p className="font-semibold mb-1">⚠️ Lỗi</p>
              <p>{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-xs underline"
              >
                Đóng
              </button>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Camera View */}
            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <div className="relative bg-slate-900 rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                {!isCameraActive ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                    <div className="text-6xl mb-4">📷</div>
                    <p className="text-lg font-semibold mb-2">Chưa bật camera</p>
                    <p className="text-sm text-slate-300 mb-6 text-center">
                      Bấm nút bên dưới để bật camera và bắt đầu thử áo ảo
                    </p>
                    <button
                      onClick={startCamera}
                      className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
                    >
                      Bật camera
                    </button>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{ display: isARReady ? "none" : "block" }}
                    />
                    <canvas
                      ref={canvasRef}
                      className="w-full h-full object-cover"
                      style={{ display: isARReady ? "block" : "none" }}
                    />
                    {isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                        <div className="text-white text-center">
                          <div className="animate-spin text-4xl mb-2">⏳</div>
                          <p>Đang khởi tạo AR...</p>
                        </div>
                      </div>
                    )}
                    {isARReady && selectedProduct && (
                      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-xs">
                        <p className="font-semibold text-slate-900">{selectedProduct.name}</p>
                        <p className="text-slate-600">Đang hiển thị AR</p>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      {isARReady && selectedProduct && (
                        <button
                          onClick={capturePhoto}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                          title="Chụp ảnh"
                        >
                          📸
                        </button>
                      )}
                      <button
                        onClick={stopCamera}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                      >
                        Tắt
                      </button>
                    </div>
                  </>
                )}
              </div>

              {isCameraActive && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Mẹo:</strong> Đứng cách camera 1-2 mét, giữ thẳng người, đảm bảo ánh sáng đủ để có kết quả tốt nhất
                  </p>
                </div>
              )}
            </div>

            {/* Product Selection */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 shadow-xl">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Chọn sản phẩm để thử
                </h2>
                <div className="space-y-4">
                  {products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleTryOn(product)}
                      disabled={isLoading}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition ${
                        selectedProduct?.id === product.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-slate-200 hover:border-blue-500"
                      } disabled:opacity-50`}
                    >
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-slate-900">
                          {product.name}
                        </p>
                        <p className="text-sm text-slate-500">{product.category}</p>
                      </div>
                      {selectedProduct?.id === product.id && (
                        <span className="text-blue-600 font-bold">✓</span>
                      )}
                      {selectedProduct?.id !== product.id && (
                        <span className="text-blue-600">→</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Hướng dẫn sử dụng</h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">1.</span>
                    <span>Bật camera và cho phép truy cập (cần HTTPS hoặc localhost)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">2.</span>
                    <span>Đứng cách camera 1-2 mét, giữ thẳng người</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">3.</span>
                    <span>Chọn sản phẩm muốn thử từ danh sách</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">4.</span>
                    <span>Sản phẩm sẽ được overlay lên người bạn bằng AR</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">5.</span>
                    <span>Chụp ảnh để lưu và so sánh</span>
                  </li>
                </ol>
              </div>

              {/* Features */}
              <div className="bg-white rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-slate-900 mb-4">
                  Tính năng AR Production-Ready
                </h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">✓</span>
                    <span>AR thực tế với MediaPipe Selfie Segmentation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">✓</span>
                    <span>Chạy trên browser, không cần app</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">✓</span>
                    <span>Hoàn toàn miễn phí, không tốn phí API</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">✓</span>
                    <span>Chụp ảnh và lưu để so sánh</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500">✓</span>
                    <span>Hoạt động trên mobile và desktop</span>
                  </li>
                </ul>
              </div>

              {/* Browser Support */}
              <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
                <h3 className="text-lg font-bold text-amber-900 mb-2">
                  ⚠️ Lưu ý trình duyệt
                </h3>
                <p className="text-sm text-amber-800 mb-2">
                  Tính năng AR cần trình duyệt hỗ trợ WebRTC và MediaPipe:
                </p>
                <ul className="text-xs text-amber-700 space-y-1">
                  <li>✓ Chrome/Edge (khuyến nghị)</li>
                  <li>✓ Firefox</li>
                  <li>✓ Safari (iOS 14+)</li>
                  <li>✗ Trình duyệt cũ có thể không hỗ trợ</li>
                </ul>
                <p className="text-xs text-amber-700 mt-2">
                  <strong>Quan trọng:</strong> Cần HTTPS hoặc localhost để truy cập camera
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

