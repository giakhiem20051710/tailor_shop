import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header.jsx";
import usePageMeta from "../hooks/usePageMeta";
import { SelfieSegmentation } from "@mediapipe/selfie_segmentation";
import { Camera } from "@mediapipe/camera_utils";
import { productService } from "../services/index.js";
import OptimizedImage from "../components/OptimizedImage.jsx";
import { createLogger } from "../utils/logger.js";
import AITryOnSection from "../components/AITryOnSection.jsx";

const logger = createLogger("VirtualTryOn");

export default function VirtualTryOnPage() {
  const navigate = useNavigate();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [error, setError] = useState(null);
  const [isARReady, setIsARReady] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState("camera"); // "camera" or "upload"
  const [tryOnMode, setTryOnMode] = useState("ar"); // "ar" or "ai"
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const selfieSegmentationRef = useRef(null);
  const cameraRef = useRef(null);
  const productImageRef = useRef(null);
  const cachedProductImages = useRef(new Map());
  const fileInputRef = useRef(null);

  usePageMeta({
    title: "Thử áo ảo AR | My Hiền Tailor",
    description: "Thử áo dài, vest, đầm trên người bạn bằng công nghệ AR thực tế",
  });

  // Load products from backend
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setIsLoadingProducts(true);
      setError(null);

      console.log("Loading products from API...");

      // Load products from backend API
      const response = await productService.list({}, { page: 0, size: 50 });
      console.log("Products API response:", response);

      const data = productService.parseResponse(response);
      console.log("Parsed products data:", data);

      const productsList = data?.content || data?.data || (Array.isArray(data) ? data : []);
      console.log("Products list:", productsList.length, "items");

      // Transform products for AR use
      const transformedProducts = productsList
        .filter(product => {
          // Only show products with images
          const hasImage =
            product.imageUrl ||
            product.images?.[0]?.url ||
            product.primaryImageUrl ||
            // New: lấy từ cấu trúc media của BE (theo ProductDetailResponse)
            product.media?.thumbnail ||
            (Array.isArray(product.media?.gallery) && product.media.gallery[0]) ||
            product.image;

          if (!hasImage) {
            console.log("Product without image:", product.name || product.id || product.key);
          }
          return hasImage;
        })
        .map(product => {
          // Get product image – ưu tiên đúng theo BE
          const imageUrl =
            product.imageUrl ||
            product.images?.[0]?.url ||
            product.primaryImageUrl ||
            product.media?.thumbnail ||
            (Array.isArray(product.media?.gallery) && product.media.gallery[0]) ||
            product.image ||
            "https://via.placeholder.com/400x600?text=No+Image";

          // Determine overlay position based on category
          const category = product.category?.toLowerCase() || product.name?.toLowerCase() || "";
          let overlayPosition = { x: 0.2, y: 0.1, width: 0.6, height: 0.8 }; // Default

          if (category.includes("áo dài") || category.includes("ao dai")) {
            overlayPosition = { x: 0.2, y: 0.1, width: 0.6, height: 0.8 };
          } else if (category.includes("vest") || category.includes("suit")) {
            overlayPosition = { x: 0.15, y: 0.05, width: 0.7, height: 0.9 };
          } else if (category.includes("đầm") || category.includes("dam") || category.includes("dress")) {
            overlayPosition = { x: 0.2, y: 0.15, width: 0.6, height: 0.75 };
          } else if (category.includes("áo sơ mi") || category.includes("shirt")) {
            overlayPosition = { x: 0.2, y: 0.2, width: 0.6, height: 0.6 };
          }

          return {
            id: product.id || product.key || product.slug,
            key: product.key || product.slug,
            name: product.name || "Sản phẩm",
            image: imageUrl,
            category: product.category || "Khác",
            price: product.price,
            overlayPosition,
            originalProduct: product, // Keep reference to original product
          };
        });

      if (transformedProducts.length === 0) {
        console.warn("No products with images found, using demo products");
        // Fallback to demo products
        setProducts([
          {
            id: "demo-ao-dai",
            name: "Áo dài cưới",
            image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&auto=format&fit=crop&q=80",
            category: "Áo dài",
            overlayPosition: { x: 0.2, y: 0.1, width: 0.6, height: 0.8 },
          },
          {
            id: "demo-vest",
            name: "Vest công sở",
            image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
            category: "Vest",
            overlayPosition: { x: 0.15, y: 0.05, width: 0.7, height: 0.9 },
          },
          {
            id: "demo-dam",
            name: "Đầm dạ hội",
            image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&auto=format&fit=crop&q=80",
            category: "Đầm",
            overlayPosition: { x: 0.2, y: 0.15, width: 0.6, height: 0.75 },
          },
        ]);
      } else {
        setProducts(transformedProducts);
        console.log("✅ Loaded products for AR:", transformedProducts.length);
      }
    } catch (err) {
      console.error("Error loading products:", err);
      setError("Không thể tải danh sách sản phẩm. Đang dùng sản phẩm demo.");
      // Fallback to demo products
      setProducts([
        {
          id: "demo-ao-dai",
          name: "Áo dài cưới",
          image: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&auto=format&fit=crop&q=80",
          category: "Áo dài",
          overlayPosition: { x: 0.2, y: 0.1, width: 0.6, height: 0.8 },
        },
        {
          id: "demo-vest",
          name: "Vest công sở",
          image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
          category: "Vest",
          overlayPosition: { x: 0.15, y: 0.05, width: 0.7, height: 0.9 },
        },
        {
          id: "demo-dam",
          name: "Đầm dạ hội",
          image: "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=400&auto=format&fit=crop&q=80",
          category: "Đầm",
          overlayPosition: { x: 0.2, y: 0.15, width: 0.6, height: 0.75 },
        },
      ]);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  // Filter products by search query
  const filteredProducts = products.filter(product => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  // Helper function to draw product overlay with improved blending
  const drawProductOverlay = (ctx, canvas, mask, productImg, product) => {
    if (!productImg.complete) return;

    const pos = product.overlayPosition;
    const x = pos.x * canvas.width;
    const y = pos.y * canvas.height;
    const width = pos.width * canvas.width;
    const height = pos.height * canvas.height;

    // Save context
    ctx.save();

    // Create a clipping path from the segmentation mask
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);

    // Use destination-in to only draw where mask exists
    ctx.globalCompositeOperation = "destination-in";
    ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);

    // Draw product image with proper blending
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 0.9; // Slight transparency for more realistic look
    ctx.drawImage(productImg, x, y, width, height);
    ctx.globalAlpha = 1.0;

    ctx.restore();
  };

  // Initialize MediaPipe Selfie Segmentation when camera is active
  useEffect(() => {
    if (!isCameraActive || !videoRef.current) return;

    let isMounted = true;
    let mediaPipeCamera = null;
    let retryCount = 0;
    const maxRetries = 10;

    const initializeAR = async () => {
      try {
        // Wait for video stream with retry logic
        if (!videoRef.current?.srcObject) {
          console.log("Waiting for video stream...", retryCount);
          retryCount++;
          if (retryCount < maxRetries) {
            // Retry after a short delay
            setTimeout(() => {
              if (isMounted && isCameraActive) {
                initializeAR();
              }
            }, 200);
            return;
          } else {
            console.error("Video stream not available after retries");
            setError("Không thể khởi tạo video stream. Vui lòng thử lại.");
            setIsLoading(false);
            return;
          }
        }

        console.log("Video stream found, proceeding with AR initialization");

        // Wait for video metadata to load
        await new Promise((resolve) => {
          if (videoRef.current?.readyState >= 2) {
            resolve();
          } else {
            const onLoadedMetadata = () => {
              videoRef.current?.removeEventListener("loadedmetadata", onLoadedMetadata);
              resolve();
            };
            videoRef.current?.addEventListener("loadedmetadata", onLoadedMetadata);
          }
        });

        if (!isMounted) return;

        setIsLoading(true);
        setError(null);

        console.log("Initializing MediaPipe Selfie Segmentation...");

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
          if (!isMounted || !canvasRef.current || !videoRef.current) return;

          const canvas = canvasRef.current;
          const video = videoRef.current;
          const ctx = canvas.getContext("2d");

          // Set canvas size to match video
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            console.log("Canvas size set to:", canvas.width, "x", canvas.height);
          }

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw video frame
          if (results.image) {
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

            // Mark AR as ready after first frame
            if (!isARReady) {
              setIsARReady(true);
              console.log("AR ready, switching to canvas");
            }
          }

          // Draw product overlay on person with improved blending
          if (selectedProduct && results.segmentationMask) {
            const mask = results.segmentationMask;

            // Get cached product image or load it
            let productImg = cachedProductImages.current.get(selectedProduct.id);
            if (!productImg) {
              productImg = new Image();
              productImg.crossOrigin = "anonymous";
              productImg.onload = () => {
                if (isMounted) {
                  cachedProductImages.current.set(selectedProduct.id, productImg);
                  drawProductOverlay(ctx, canvas, mask, productImg, selectedProduct);
                }
              };
              productImg.onerror = () => {
                console.error("Failed to load product image:", selectedProduct.image);
              };
              productImg.src = selectedProduct.image;
            } else if (productImg.complete) {
              drawProductOverlay(ctx, canvas, mask, productImg, selectedProduct);
            }
          }
        });

        selfieSegmentationRef.current = selfieSegmentation;

        // Use MediaPipe Camera with existing stream
        if (videoRef.current && videoRef.current.srcObject) {
          console.log("Starting MediaPipe Camera...");
          mediaPipeCamera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (isMounted && videoRef.current && selfieSegmentationRef.current) {
                await selfieSegmentationRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480,
          });

          cameraRef.current = mediaPipeCamera;
          await mediaPipeCamera.start();

          if (isMounted) {
            console.log("AR ready!");
            setIsARReady(true);
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error("AR initialization error:", err);
        if (isMounted) {
          setError("Không thể khởi tạo AR. Vui lòng thử lại hoặc dùng trình duyệt khác.");
          setIsLoading(false);
        }
      }
    };

    // Small delay to ensure video stream is ready
    const timer = setTimeout(() => {
      initializeAR();
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (mediaPipeCamera) {
        try {
          mediaPipeCamera.stop();
        } catch (e) {
          console.error("Error stopping MediaPipe camera:", e);
        }
      }
    };
  }, [isCameraActive, selectedProduct]);

  const startCamera = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Trình duyệt không hỗ trợ camera. Vui lòng dùng Chrome, Edge, Firefox hoặc Safari.");
      }

      // Wait for video element to be available (with retry)
      let retries = 0;
      const maxRetries = 10;
      while (!videoRef.current && retries < maxRetries) {
        console.log("Waiting for video element...", retries);
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }

      if (!videoRef.current) {
        throw new Error("Video element not found. Please refresh the page.");
      }

      console.log("Video element found, requesting camera...");

      // Request camera permission first
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
      });

      console.log("Camera stream obtained, setting to video element...");

      // Set stream to video element FIRST, before setting isCameraActive
      if (!videoRef.current) {
        // Double check after getting stream
        throw new Error("Video element lost. Please refresh the page.");
      }

      console.log("Setting video stream to video element...");
      const video = videoRef.current;

      // Set stream immediately
      video.srcObject = stream;
      console.log("Stream set, srcObject:", !!video.srcObject);

      // Verify stream is set before proceeding
      if (!video.srcObject) {
        throw new Error("Failed to set video stream");
      }

      // Wait for video to be ready and playing
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          console.warn("Video load timeout, but stream is set - proceeding");
          video.removeEventListener("loadedmetadata", onLoadedMetadata);
          video.removeEventListener("canplay", onCanPlay);
          video.removeEventListener("playing", onPlaying);
          video.removeEventListener("error", onError);
          resolve();
        }, 3000);

        const onLoadedMetadata = () => {
          console.log("Video metadata loaded, dimensions:", video.videoWidth, "x", video.videoHeight);
        };

        const onCanPlay = () => {
          console.log("Video can play");
        };

        const onPlaying = () => {
          console.log("Video is playing");
          clearTimeout(timeout);
          video.removeEventListener("loadedmetadata", onLoadedMetadata);
          video.removeEventListener("canplay", onCanPlay);
          video.removeEventListener("playing", onPlaying);
          video.removeEventListener("error", onError);
          resolve();
        };

        const onError = (error) => {
          console.error("Video error:", error);
          video.removeEventListener("loadedmetadata", onLoadedMetadata);
          video.removeEventListener("canplay", onCanPlay);
          video.removeEventListener("playing", onPlaying);
          video.removeEventListener("error", onError);
          clearTimeout(timeout);
          reject(error);
        };

        // Add event listeners
        video.addEventListener("loadedmetadata", onLoadedMetadata);
        video.addEventListener("canplay", onCanPlay);
        video.addEventListener("playing", onPlaying);
        video.addEventListener("error", onError);

        // Try to play immediately
        video.play()
          .then(() => {
            console.log("Video play() called successfully");
            // onPlaying will be called when video actually starts
          })
          .catch((err) => {
            console.warn("Video play() error (may be expected):", err);
            // Continue anyway, video might still work
          });
      });

      // Double check stream is still set
      if (!video.srcObject) {
        throw new Error("Video stream was lost");
      }

      console.log("Video stream set successfully, readyState:", video.readyState);

      // NOW set isCameraActive to true - stream is guaranteed to be set
      console.log("Camera activated, setting isCameraActive to true");
      setIsCameraActive(true);
      setIsLoading(false);
    } catch (error) {
      console.error("Error accessing camera:", error);
      setIsLoading(false);

      let errorMessage = "Không thể truy cập camera. ";
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        errorMessage += "Vui lòng cho phép truy cập camera trong cài đặt trình duyệt.";
      } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
        errorMessage += "Không tìm thấy camera. Vui lòng kiểm tra thiết bị.";
      } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
        errorMessage += "Camera đang được sử dụng bởi ứng dụng khác.";
      } else if (error.name === "OverconstrainedError" || error.name === "ConstraintNotSatisfiedError") {
        errorMessage += "Camera không hỗ trợ yêu cầu. Đang thử cài đặt mặc định...";
        // Retry with default settings
        try {
          const defaultStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = defaultStream;
            setIsCameraActive(true);
            setIsLoading(false);
            return;
          }
        } catch (retryError) {
          errorMessage += " Vẫn không thể truy cập camera.";
        }
      } else {
        errorMessage += error.message || "Vui lòng thử lại sau.";
      }

      setError(errorMessage);
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

  // Handle image upload
  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn file ảnh (JPG, PNG, etc.)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn 10MB.");
      return;
    }

    setIsProcessingImage(true);
    setError(null);
    setMode("upload");

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result;
      setUploadedImageUrl(imageUrl);

      // Create image element to get dimensions
      const img = new Image();
      img.onload = () => {
        setUploadedImage(img);
        setIsProcessingImage(false);
        // Process image with MediaPipe
        processUploadedImage(img);
      };
      img.onerror = () => {
        setError("Không thể load ảnh. Vui lòng thử lại với ảnh khác.");
        setIsProcessingImage(false);
      };
      img.src = imageUrl;
    };
    reader.onerror = () => {
      setError("Không thể đọc file. Vui lòng thử lại.");
      setIsProcessingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Process uploaded image with MediaPipe
  const processUploadedImage = async (imageElement) => {
    try {
      setIsLoading(true);
      setError(null);

      // Initialize MediaPipe Selfie Segmentation if not already done
      if (!selfieSegmentationRef.current) {
        const selfieSegmentation = new SelfieSegmentation({
          locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
          },
        });

        selfieSegmentation.setOptions({
          modelSelection: 1,
          selfieMode: true,
        });

        selfieSegmentation.onResults((results) => {
          if (!canvasRef.current) return;

          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");

          // Set canvas size to match image
          canvas.width = results.image.width;
          canvas.height = results.image.height;

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw image
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

          // Draw product overlay if selected
          if (selectedProduct && results.segmentationMask) {
            const mask = results.segmentationMask;
            let productImg = cachedProductImages.current.get(selectedProduct.id);

            if (!productImg) {
              productImg = new Image();
              productImg.crossOrigin = "anonymous";
              productImg.onload = () => {
                cachedProductImages.current.set(selectedProduct.id, productImg);
                drawProductOverlay(ctx, canvas, mask, productImg, selectedProduct);
              };
              productImg.onerror = () => {
                console.error("Failed to load product image:", selectedProduct.image);
              };
              productImg.src = selectedProduct.image;
            } else if (productImg.complete) {
              drawProductOverlay(ctx, canvas, mask, productImg, selectedProduct);
            }
          }
        });

        selfieSegmentationRef.current = selfieSegmentation;
      }

      // Process the uploaded image
      await selfieSegmentationRef.current.send({ image: imageElement });
      setIsARReady(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Error processing image:", err);
      setError("Không thể xử lý ảnh. Vui lòng thử lại.");
      setIsLoading(false);
    }
  };

  // Re-process image when product changes
  useEffect(() => {
    if (mode === "upload" && uploadedImage && selectedProduct) {
      processUploadedImage(uploadedImage);
    }
  }, [selectedProduct, mode]);

  // Clear uploaded image
  const clearUploadedImage = () => {
    setUploadedImage(null);
    setUploadedImageUrl(null);
    setIsARReady(false);
    setSelectedProduct(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
    const dataURL = canvas.toDataURL("image/png");

    // Create download link
    const link = document.createElement("a");
    const fileName = `try-on-${selectedProduct?.name?.replace(/\s+/g, "-") || selectedProduct?.id || "photo"}-${Date.now()}.png`;
    link.download = fileName;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Optional: Show success message
    const successMsg = document.createElement("div");
    successMsg.className = "fixed top-20 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50";
    successMsg.textContent = "✅ Đã lưu ảnh thành công!";
    document.body.appendChild(successMsg);
    setTimeout(() => {
      document.body.removeChild(successMsg);
    }, 3000);
  };

  const handleViewProductDetail = () => {
    if (selectedProduct?.key) {
      navigate(`/products/${selectedProduct.key}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Header currentPage="/virtual-tryon" />
      <main className="pt-[170px] md:pt-[190px] pb-16">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-4">
              <span>{tryOnMode === "ar" ? "📱" : "🤖"}</span>
              <span>{tryOnMode === "ar" ? "AR Virtual Try-On" : "AI Virtual Try-On"}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Thử áo ảo trên người bạn
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-6">
              {tryOnMode === "ar"
                ? "Sử dụng công nghệ AR thực tế với MediaPipe để overlay sản phẩm lên người bạn"
                : "Sử dụng AI để ghép quần áo lên ảnh của bạn với độ chính xác cao"
              }
            </p>

            {/* Mode Switcher Tabs */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setTryOnMode("ar")}
                className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${tryOnMode === "ar"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                📱 AR Camera
              </button>
              <button
                onClick={() => setTryOnMode("ai")}
                className={`px-6 py-2 rounded-lg font-medium text-sm transition-all ${tryOnMode === "ai"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                🤖 AI Try-On
              </button>
            </div>
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

          {/* AI Try-On Mode */}
          {tryOnMode === "ai" && (
            <AITryOnSection
              products={products}
              onSelectProduct={setSelectedProduct}
            />
          )}

          {/* AR Camera Mode */}
          {tryOnMode === "ar" && (
            <div className="grid gap-8 lg:grid-cols-2">
              {/* Camera View */}
              <div className="bg-white rounded-3xl p-6 shadow-xl">
                <div className="relative bg-slate-900 rounded-2xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                  {/* Always render video element (hidden when not active) so ref is available */}
                  {mode === "camera" && (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                      style={{
                        display: (isCameraActive && isARReady && canvasRef.current) ? "none" : "block",
                        transform: "scaleX(-1)", // Mirror for better UX
                        backgroundColor: "#000"
                      }}
                      onLoadedMetadata={() => {
                        console.log("Video loaded metadata in render");
                      }}
                      onPlay={() => {
                        console.log("Video started playing");
                      }}
                      onError={(e) => {
                        console.error("Video element error:", e);
                        setError("Lỗi hiển thị video. Vui lòng thử lại.");
                      }}
                    />
                  )}

                  {!isCameraActive && mode === "camera" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 z-10">
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
                  )}

                  {isCameraActive && (
                    <>

                      {/* Upload mode - show uploaded image preview */}
                      {mode === "upload" && uploadedImageUrl && (
                        <img
                          src={uploadedImageUrl}
                          alt="Uploaded"
                          className="w-full h-full object-contain"
                          style={{
                            display: isARReady && canvasRef.current ? "none" : "block",
                            backgroundColor: "#000"
                          }}
                        />
                      )}

                      {/* Canvas for AR overlay */}
                      <canvas
                        ref={canvasRef}
                        className="w-full h-full object-contain"
                        style={{
                          display: isARReady && canvasRef.current ? "block" : "none",
                          transform: mode === "camera" ? "scaleX(-1)" : "none", // Mirror only for camera
                          backgroundColor: "#000",
                          position: isARReady ? "absolute" : "relative",
                          top: 0,
                          left: 0
                        }}
                      />

                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="text-white text-center">
                            <div className="animate-spin text-4xl mb-2">⏳</div>
                            <p>{mode === "upload" ? "Đang xử lý ảnh..." : "Đang khởi tạo AR..."}</p>
                          </div>
                        </div>
                      )}

                      {isProcessingImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <div className="text-white text-center">
                            <div className="animate-spin text-4xl mb-2">⏳</div>
                            <p>Đang load ảnh...</p>
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
                            title="Lưu ảnh"
                          >
                            💾
                          </button>
                        )}
                        {mode === "camera" && isCameraActive && (
                          <button
                            onClick={stopCamera}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                          >
                            Tắt
                          </button>
                        )}
                        {mode === "upload" && uploadedImageUrl && (
                          <button
                            onClick={clearUploadedImage}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                            title="Xóa ảnh"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {mode === "camera" && isCameraActive && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Mẹo:</strong> Đứng cách camera 1-2 mét, giữ thẳng người, đảm bảo ánh sáng đủ để có kết quả tốt nhất
                    </p>
                  </div>
                )}

                {mode === "upload" && uploadedImageUrl && (
                  <div className="mt-4 p-4 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-800">
                      ✅ <strong>Ảnh đã upload:</strong> Chọn sản phẩm bên dưới để thử áo ảo trên ảnh của bạn
                    </p>
                  </div>
                )}
              </div>

              {/* Product Selection */}
              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-6 shadow-xl">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">
                    Chọn sản phẩm để thử
                  </h2>

                  {/* Search bar */}
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Tìm kiếm sản phẩm..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {isLoadingProducts ? (
                    <div className="text-center py-8">
                      <div className="animate-spin text-4xl mb-2">⏳</div>
                      <p className="text-slate-600">Đang tải sản phẩm...</p>
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-600">Không tìm thấy sản phẩm nào.</p>
                      <button
                        onClick={loadProducts}
                        className="mt-4 text-blue-600 hover:underline"
                      >
                        Tải lại
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                      {filteredProducts.map((product) => (
                        <button
                          key={product.id}
                          onClick={() => handleTryOn(product)}
                          disabled={isLoading}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition ${selectedProduct?.id === product.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-blue-500"
                            } disabled:opacity-50`}
                        >
                          <OptimizedImage
                            src={product.image}
                            alt={product.name}
                            className="w-20 h-20 object-cover rounded-lg"
                            fallback="https://via.placeholder.com/80x80?text=No+Image"
                          />
                          <div className="flex-1 text-left">
                            <p className="font-semibold text-slate-900">
                              {product.name}
                            </p>
                            <p className="text-sm text-slate-500">{product.category}</p>
                            {product.price && (
                              <p className="text-sm font-semibold text-blue-600">
                                {new Intl.NumberFormat("vi-VN", {
                                  style: "currency",
                                  currency: "VND",
                                }).format(product.price)}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-center gap-2">
                            {selectedProduct?.id === product.id && (
                              <span className="text-blue-600 font-bold text-xl">✓</span>
                            )}
                            {selectedProduct?.id !== product.id && (
                              <span className="text-blue-600">→</span>
                            )}
                            {product.key && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/products/${product.key}`);
                                }}
                                className="text-xs text-blue-600 hover:underline"
                                title="Xem chi tiết"
                              >
                                Chi tiết
                              </button>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Product Info */}
                {selectedProduct && (
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-6 border-2 border-blue-200">
                    <h3 className="text-lg font-bold text-slate-900 mb-3">
                      Sản phẩm đang thử: {selectedProduct.name}
                    </h3>
                    {selectedProduct.price && (
                      <p className="text-lg font-semibold text-blue-600 mb-3">
                        {new Intl.NumberFormat("vi-VN", {
                          style: "currency",
                          currency: "VND",
                        }).format(selectedProduct.price)}
                      </p>
                    )}
                    {selectedProduct.key && (
                      <button
                        onClick={handleViewProductDetail}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
                      >
                        Xem chi tiết sản phẩm →
                      </button>
                    )}
                  </div>
                )}

                {/* Instructions */}
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-4">Hướng dẫn sử dụng</h3>
                  <ol className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="font-bold">1.</span>
                      <span>Chọn chế độ: <strong>Camera</strong> (real-time) hoặc <strong>Upload Ảnh</strong> (từ máy)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">2.</span>
                      <span><strong>Camera:</strong> Bật camera và cho phép truy cập (cần HTTPS hoặc localhost)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">3.</span>
                      <span><strong>Upload:</strong> Chọn ảnh từ máy (JPG, PNG, tối đa 10MB)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">4.</span>
                      <span>Chọn sản phẩm muốn thử từ danh sách</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">5.</span>
                      <span>Sản phẩm sẽ được overlay lên người/ảnh bằng AR</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold">6.</span>
                      <span>Lưu ảnh để so sánh và chia sẻ</span>
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
          )}
        </div>
      </main>
    </div>
  );
}

