import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { imageAssetService, productService } from "../services/index.js";
import OptimizedImage from "../components/OptimizedImage.jsx";
import AIAnalysisModal from "../components/AIAnalysisModal.jsx";
import { Upload, Filter, Search, X, Image as ImageIcon, Grid3x3, List, CheckCircle2, AlertCircle, Clock, UserCheck, Shield, Scissors, Palette, Sparkles, Heart, Info, Trash2, Zap } from "lucide-react";
import { showSuccess, showError, showInfo } from "../components/NotificationToast.jsx";

// Sub-components giống ProductDetailPage
function InfoChip({ label, value }) {
  return (
    <div className="bg-[#F9FAFB] rounded-lg px-3 py-2 border border-[#E5E7EB]">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[#9CA3AF]">
        {label}
      </p>
      <p className="text-[12px] text-[#111827] mt-0.5 font-medium">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-[11px] text-[#9CA3AF] uppercase tracking-[0.12em]">
        {label}
      </p>
      <p className="text-[12px] text-[#111827] font-medium">{value}</p>
    </div>
  );
}

/**
 * Trang Upload và Quản Lý Ảnh
 * Cho phép upload ảnh, tự động phân loại, và filter/search
 */
const ImageUploadPage = () => {
  const navigate = useNavigate();

  // State
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Bulk upload state
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkJobId, setBulkJobId] = useState(null);
  const [bulkProgress, setBulkProgress] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [autoCreateProducts, setAutoCreateProducts] = useState(true);
  const [autoCropBlackBorders, setAutoCropBlackBorders] = useState(true);
  const pollingIntervalRef = useRef(null);

  // Detail modal state
  const [selectedImage, setSelectedImage] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelatedProducts, setLoadingRelatedProducts] = useState(false);

  // Success modal state for detailed results
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk delete state
  const [selectedImageIds, setSelectedImageIds] = useState(new Set());
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  // Cleanup orphan checksums state
  const [cleaningUp, setCleaningUp] = useState(false);

  // AI Analysis state
  const [useAIAnalysis, setUseAIAnalysis] = useState(true); // Toggle AI analysis
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [pendingFile, setPendingFile] = useState(null); // File chưa upload, đang chờ edit
  const [imagePreview, setImagePreview] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    category: "",
    type: "",
    gender: "",
    page: 0,
    size: 20,
  });

  // View mode: grid or list
  const [viewMode, setViewMode] = useState("grid");

  // Pagination
  const [pagination, setPagination] = useState({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  });

  // Load images
  useEffect(() => {
    loadImages();
  }, [filters]);

  // Handle image click to show detail
  const handleImageClick = (image) => {
    setSelectedImage(image);
    setShowDetailModal(true);
  };

  // Load related products based on image category/type
  const loadRelatedProducts = async (image) => {
    if (!image) return;

    try {
      setLoadingRelatedProducts(true);

      // Map image type to product category
      const categoryMap = {
        "ao_dai": "ao-dai",
        "ao_so_mi": "ao-so-mi",
        "quan_tay": "quan-tay",
        "vest": "vest",
        "vay_dam": "dam",
        "dam": "dam",
      };

      const productCategory = categoryMap[image.type] || image.category || undefined;

      if (productCategory) {
        const response = await productService.list(
          { category: productCategory },
          { page: 0, size: 6 }
        );
        const data = productService.parseResponse(response);
        const products = data?.content || data?.data || (Array.isArray(data) ? data : []);
        setRelatedProducts(products);
      } else {
        setRelatedProducts([]);
      }
    } catch (err) {
      console.error("Error loading related products:", err);
      setRelatedProducts([]);
    } finally {
      setLoadingRelatedProducts(false);
    }
  };

  // Close detail modal
  const closeDetailModal = () => {
    setSelectedImage(null);
    setRelatedProducts([]);
  };

  // Navigate to product detail
  const handleViewProduct = (product) => {
    const productKey = product.key || product.slug || `product-${product.id}`;
    navigate(`/product/${productKey}`, { state: { product } });
    closeDetailModal();
  };

  // Load related products when image is selected
  useEffect(() => {
    if (selectedImage) {
      loadRelatedProducts(selectedImage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage]);

  // Single delete handlers
  const handleDeleteClick = (e, image) => {
    e.stopPropagation(); // Prevent opening detail modal
    setImageToDelete(image);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;

    try {
      setDeleting(true);
      await imageAssetService.delete(imageToDelete.id);

      showSuccess(`Đã xóa ảnh: ${imageToDelete.s3Key || imageToDelete.fileName || 'Image'}`, 3000);

      // Reload images
      await loadImages();

      // Close modals
      setShowDeleteModal(false);
      setImageToDelete(null);

      // If deleted image was selected, close detail modal
      if (selectedImage && selectedImage.id === imageToDelete.id) {
        setShowDetailModal(false);
        setSelectedImage(null);
      }
    } catch (err) {
      console.error("Error deleting image:", err);
      showError(`Lỗi xóa ảnh: ${err.message || "Không thể xóa ảnh"}`);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setImageToDelete(null);
  };

  // Bulk delete handlers
  const handleToggleSelect = (e, imageId) => {
    e.stopPropagation();
    setSelectedImageIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(imageId)) {
        newSet.delete(imageId);
      } else {
        newSet.add(imageId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedImageIds.size === images.length) {
      setSelectedImageIds(new Set());
    } else {
      setSelectedImageIds(new Set(images.map(img => img.id)));
    }
  };

  const handleBulkDeleteClick = () => {
    console.log('🔴 handleBulkDeleteClick called, selectedImageIds:', selectedImageIds);
    if (selectedImageIds.size === 0) {
      showInfo("Vui lòng chọn ít nhất một ảnh để xóa");
      return;
    }
    console.log('✅ Opening bulk delete modal');
    setShowBulkDeleteModal(true);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedImageIds.size === 0) return;

    try {
      setBulkDeleting(true);
      const ids = Array.from(selectedImageIds);
      console.log('🗑️ Bulk deleting images with IDs:', ids);
      const response = await imageAssetService.bulkDelete(ids);
      console.log('📦 Bulk delete response:', response);
      const data = imageAssetService.parseResponse(response);
      console.log('📊 Parsed data:', data);

      const successCount = data.successCount || 0;
      const failedCount = data.failedCount || 0;

      if (successCount > 0) {
        showSuccess(`Đã xóa thành công ${successCount} ảnh${successCount > 1 ? '' : ''}`, 3000);
      }

      if (failedCount > 0) {
        showError(`Không thể xóa ${failedCount} ảnh`, 3000);
      }

      // Reload images
      await loadImages();

      // Clear selection
      setSelectedImageIds(new Set());
      setShowBulkDeleteModal(false);

      // Close detail modal if selected image was deleted
      if (selectedImage && selectedImageIds.has(selectedImage.id)) {
        setShowDetailModal(false);
        setSelectedImage(null);
      }
    } catch (err) {
      console.error("Error bulk deleting images:", err);
      showError(`Lỗi xóa ảnh: ${err.message || "Không thể xóa ảnh"}`);
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleBulkDeleteCancel = () => {
    setShowBulkDeleteModal(false);
  };

  // Cleanup orphan checksums (xử lý duplicate sau khi xóa ảnh trước khi có code cleanup)
  const handleCleanupOrphanChecksums = async () => {
    if (!confirm("Bạn có chắc chắn muốn cleanup các checksum orphan?\n\nĐiều này sẽ xóa các checksum không có ImageAsset tương ứng, cho phép upload lại các file đã bị duplicate.")) {
      return;
    }

    try {
      setCleaningUp(true);
      const response = await imageAssetService.cleanupOrphanChecksums();
      const data = imageAssetService.parseResponse(response);

      const deletedCount = data.deletedCount || 0;
      const message = data.message || `Đã xóa ${deletedCount} checksum orphan.`;

      if (deletedCount > 0) {
        showSuccess(message, 5000);
      } else {
        showInfo("Không có checksum orphan nào cần xóa.");
      }
    } catch (err) {
      console.error("Error cleaning up orphan checksums:", err);
      showError(`Lỗi cleanup: ${err.message || "Không thể cleanup checksum orphan"}`);
    } finally {
      setCleaningUp(false);
    }
  };

  // Auto-crop black borders from image
  const autoCropImage = async (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          const width = imageData.width;
          const height = imageData.height;

          // Find top, bottom, left, right boundaries (non-black/transparent)
          let top = 0, bottom = height, left = 0, right = width;

          // Find top boundary
          for (let y = 0; y < height; y++) {
            let hasContent = false;
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const a = data[idx + 3];

              // Check if pixel is not black/transparent (threshold: RGB < 30 or alpha < 10)
              if (a > 10 && (r > 30 || g > 30 || b > 30)) {
                hasContent = true;
                break;
              }
            }
            if (hasContent) {
              top = y;
              break;
            }
          }

          // Find bottom boundary
          for (let y = height - 1; y >= top; y--) {
            let hasContent = false;
            for (let x = 0; x < width; x++) {
              const idx = (y * width + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const a = data[idx + 3];

              if (a > 10 && (r > 30 || g > 30 || b > 30)) {
                hasContent = true;
                break;
              }
            }
            if (hasContent) {
              bottom = y + 1;
              break;
            }
          }

          // Find left boundary
          for (let x = 0; x < width; x++) {
            let hasContent = false;
            for (let y = top; y < bottom; y++) {
              const idx = (y * width + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const a = data[idx + 3];

              if (a > 10 && (r > 30 || g > 30 || b > 30)) {
                hasContent = true;
                break;
              }
            }
            if (hasContent) {
              left = x;
              break;
            }
          }

          // Find right boundary
          for (let x = width - 1; x >= left; x--) {
            let hasContent = false;
            for (let y = top; y < bottom; y++) {
              const idx = (y * width + x) * 4;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const a = data[idx + 3];

              if (a > 10 && (r > 30 || g > 30 || b > 30)) {
                hasContent = true;
                break;
              }
            }
            if (hasContent) {
              right = x + 1;
              break;
            }
          }

          // Add small padding (2% of image size)
          const paddingX = Math.max(1, Math.floor((right - left) * 0.02));
          const paddingY = Math.max(1, Math.floor((bottom - top) * 0.02));

          left = Math.max(0, left - paddingX);
          top = Math.max(0, top - paddingY);
          right = Math.min(width, right + paddingX);
          bottom = Math.min(height, bottom + paddingY);

          const cropWidth = right - left;
          const cropHeight = bottom - top;

          // If no significant crop needed (less than 5% reduction), return original
          const originalArea = width * height;
          const cropArea = cropWidth * cropHeight;
          if (cropArea > originalArea * 0.95) {
            resolve(file);
            return;
          }

          // Create new canvas with cropped dimensions
          const croppedCanvas = document.createElement('canvas');
          const croppedCtx = croppedCanvas.getContext('2d');
          croppedCanvas.width = cropWidth;
          croppedCanvas.height = cropHeight;

          // Draw cropped image
          croppedCtx.drawImage(
            img,
            left, top, cropWidth, cropHeight,
            0, 0, cropWidth, cropHeight
          );

          // Convert to blob
          croppedCanvas.toBlob((blob) => {
            if (blob) {
              const croppedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(croppedFile);
            } else {
              resolve(file); // Fallback to original
            }
          }, file.type, 0.95); // High quality
        } catch (error) {
          console.error('Error cropping image:', error);
          resolve(file); // Fallback to original on error
        }
      };

      img.onerror = () => {
        resolve(file); // Fallback to original on error
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const loadImages = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (filters.category || filters.type || filters.gender) {
        // Use filter API
        response = await imageAssetService.filter({
          category: filters.category || undefined,
          type: filters.type || undefined,
          gender: filters.gender || undefined,
          page: filters.page,
          size: filters.size,
        });
      } else {
        // Use getAll API
        response = await imageAssetService.getAll({
          page: filters.page,
          size: filters.size,
        });
      }

      // Parse response
      const data = imageAssetService.parseResponse(response);

      if (data?.content) {
        // Paginated response
        setImages(data.content);
        setPagination({
          page: data.number || 0,
          size: data.size || 20,
          totalElements: data.totalElements || 0,
          totalPages: data.totalPages || 0,
        });
      } else if (Array.isArray(data)) {
        // Array response
        setImages(data);
      } else {
        setImages([]);
      }
    } catch (err) {
      console.error("Error loading images:", err);
      setError(err.message || "Không thể tải danh sách ảnh");
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset file input immediately
    event.target.value = "";

    try {
      setError(null);

      // Create image preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setPendingFile(file);

      if (useAIAnalysis) {
        // === AI ANALYSIS MODE ===
        setAnalyzing(true);
        console.log(`🤖 Analyzing image with AI: ${file.name}`);
        console.log(`📊 File size: ${(file.size / 1024).toFixed(2)} KB, type: ${file.type}`);

        // Call analyze-only endpoint (không upload, chỉ phân tích)
        const response = await imageAssetService.analyzeOnly(file);
        console.log('📦 Raw API response:', response);

        const result = imageAssetService.parseResponse(response);
        console.log(`✅ AI Analysis result:`, result);
        console.log(`🎯 Confidence: ${result?.confidence}, Category: ${result?.category}, Type: ${result?.type}`);

        // Kiểm tra xem result có dữ liệu hay không
        if (!result || (result.confidence === 0 && result.description === "Chưa có mô tả")) {
          console.warn('⚠️ AI returned default/empty result');
          showInfo('AI phân tích chậm, đang thử lại...', 2000);
        }

        setAnalysisResult(result);
        setShowAIModal(true); // Hiển thị modal để user review/edit
        setAnalyzing(false);

      } else {
        // === LEGACY MODE (không dùng AI) ===
        setUploading(true);
        setUploadProgress(0);

        const fileName = file.name;
        const description = fileName
          .replace(/\.[^/.]+$/, "")
          .replace(/_/g, " ")
          .replace(/-/g, " ");

        console.log(`📁 File: ${fileName}`);

        let fileToUpload = file;
        if (autoCropBlackBorders) {
          setUploadProgress(30);
          fileToUpload = await autoCropImage(file);
          setUploadProgress(60);
        }

        setUploadProgress(80);
        const response = await imageAssetService.upload(fileToUpload, {
          description: description,
        });

        const data = imageAssetService.parseResponse(response);

        await loadImages();

        setSuccessData({
          title: "Upload thành công!",
          type: "single",
          details: {
            fileName,
            category: data.category,
            type: data.type,
            gender: data.gender,
            tags: data.tags?.join(", ") || "N/A",
          }
        });
        setShowSuccessModal(true);

        showSuccess(`Upload thành công: ${file.name}`, 3000);
        setUploading(false);
        setUploadProgress(0);

        // Cleanup preview
        URL.revokeObjectURL(previewUrl);
        setImagePreview(null);
        setPendingFile(null);
      }
    } catch (err) {
      console.error("Error uploading/analyzing image:", err);
      console.error("Error details:", JSON.stringify(err, null, 2));
      setError(err.message || "Không thể xử lý ảnh");
      showError(`Lỗi: ${err.message || "Không thể xử lý ảnh"}`);
      setUploading(false);
      setAnalyzing(false);
      setUploadProgress(0);
    }
  };

  // Handler khi user confirm lưu từ AI modal
  const handleAISave = async (editedResult) => {
    if (!pendingFile) return;

    const fileName = pendingFile.name; // Store before cleanup

    try {
      setUploading(true);
      console.log(`💾 Saving image with edited AI metadata:`, editedResult);

      // Gọi endpoint save-with-metadata (upload + lưu với metadata đã edit)
      const response = await imageAssetService.saveWithMetadata(pendingFile, editedResult);
      const result = imageAssetService.parseResponse(response);

      // Close modal FIRST
      setShowAIModal(false);
      setAnalysisResult(null);

      // Cleanup preview
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setImagePreview(null);
      setPendingFile(null);
      setUploading(false);

      // Show success ngay lập tức
      setSuccessData({
        title: "🤖 Upload với AI thành công!",
        type: "single",
        details: {
          fileName: fileName,
          category: result.category,
          type: result.type,
          gender: result.gender,
          description: result.description?.substring(0, 100) + "...",
          confidence: `${((result.confidence || 0) * 100).toFixed(0)}%`,
        }
      });
      setShowSuccessModal(true);
      showSuccess(`Phân tích AI và upload thành công!`, 3000);

      // Wait để S3/database sync
      console.log('⏳ Waiting for data sync...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Reload images
      console.log('🔄 Reloading images...');
      await loadImages();
      console.log('✅ Images reloaded');

    } catch (err) {
      console.error("Error saving with AI:", err);
      showError(`Lỗi lưu ảnh: ${err.message || "Không thể lưu ảnh"}`);
      setUploading(false);
    }
  };

  // Handler khi user đóng AI modal (hủy)
  const handleAIModalClose = () => {
    setShowAIModal(false);
    setAnalysisResult(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setPendingFile(null);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 0, // Reset to first page when filter changes
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  // Calculate MD5 checksum for a file
  const calculateChecksum = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;
          const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          resolve(hashHex);
        } catch (err) {
          // Fallback: use file name + size as checksum
          resolve(`${file.name}_${file.size}_${file.lastModified}`);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  // Upload file directly to S3 using pre-signed URL
  const uploadToS3 = async (presignedUrl, file) => {
    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    // Check if upload was successful
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Failed to upload to S3: ${response.status} ${response.statusText}. ${errorText}`);
    }

    return response;
  };

  // Handle bulk upload
  const handleBulkUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Reset file input immediately
    event.target.value = "";

    try {
      setBulkUploading(true);
      setError(null);
      setSelectedFiles(files);

      // ============ AI ANALYSIS MODE ============
      if (useAIAnalysis) {
        console.log(`🤖 Bulk AI Analysis: ${files.length} files`);

        // Giới hạn số lượng file cho AI analysis (tránh timeout)
        const maxFilesForAI = 20;
        if (files.length > maxFilesForAI) {
          showError(`AI analysis chỉ hỗ trợ tối đa ${maxFilesForAI} files. Bạn đã chọn ${files.length} files. Vui lòng giảm số lượng hoặc tắt AI.`);
          setBulkUploading(false);
          return;
        }

        // Gọi API bulk analyze
        const response = await imageAssetService.analyzeBulkWithAI(files);
        const results = imageAssetService.parseResponse(response);

        console.log(`✅ Bulk AI Analysis complete:`, results);

        // Show success FIRST (trước khi reload để user thấy feedback ngay)
        const successCount = results.filter(r => r.confidence > 0).length;
        const failCount = results.filter(r => r.confidence === 0).length;

        setSuccessData({
          title: "🤖 Bulk AI Analysis hoàn tất!",
          type: "bulk",
          details: {
            totalFiles: files.length,
            successCount: successCount,
            failedCount: failCount,
            note: `Đã phân tích và upload ${successCount} ảnh với AI`
          }
        });
        setShowSuccessModal(true);
        showSuccess(`Bulk AI Analysis: ${successCount}/${files.length} ảnh thành công!`, 4000);

        // Set uploading = false FIRST để unlock UI
        setBulkUploading(false);
        setSelectedFiles([]);

        // Wait để S3/database sync xong
        console.log('⏳ Waiting for data sync...');
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Reload images SAU KHI đã set state xong
        console.log('🔄 Reloading images...');
        await loadImages();
        console.log('✅ Images reloaded');

        return;
      }

      // ============ LEGACY MODE (không dùng AI) ============
      // Step 1: Calculate checksums
      console.log(`📊 Calculating checksums for ${files.length} files...`);
      const fileInfos = await Promise.all(
        files.map(async (file) => ({
          fileName: file.name,
          contentType: file.type || 'image/jpeg',
          checksum: await calculateChecksum(file),
          file: file,
        }))
      );

      // Step 2: Get pre-signed URLs (Job created here)
      console.log('🔗 Requesting pre-signed URLs...');
      const presignedResponse = await productService.getPresignedUrls({
        fileNames: fileInfos.map(f => f.fileName),
        contentTypes: fileInfos.map(f => f.contentType),
        checksums: fileInfos.map(f => f.checksum),
      });

      const responseData = productService.parseResponse(presignedResponse);
      const jobId = responseData.jobId;
      setBulkJobId(jobId);
      console.log(`✅ Job created: ${jobId}`);

      // Step 3: Filter out duplicates
      const nonDuplicateFiles = fileInfos.filter((fileInfo, index) => {
        const urlInfo = responseData.urls[index];
        if (urlInfo.isDuplicate) {
          console.warn(`⚠️ File ${fileInfo.fileName} is duplicate, skipping upload`);
          return false;
        }
        return true;
      });

      if (nonDuplicateFiles.length === 0) {
        showError('Tất cả các file đều là duplicate! Vui lòng chọn file khác.');
        setBulkUploading(false);
        return;
      }

      // Step 4: Upload directly to S3 (only non-duplicates)
      console.log(`📤 Uploading ${nonDuplicateFiles.length} files to S3...`);
      const uploadPromises = nonDuplicateFiles.map(async (fileInfo, index) => {
        const urlInfo = responseData.urls.find((u, i) =>
          !responseData.urls[i].isDuplicate &&
          responseData.urls[i].fileName === fileInfo.fileName
        );
        if (!urlInfo) return;

        try {
          await uploadToS3(urlInfo.presignedUrl, fileInfo.file);
          console.log(`✅ Uploaded: ${fileInfo.fileName}`);
        } catch (err) {
          console.error(`❌ Failed to upload ${fileInfo.fileName}:`, err);
          throw err;
        }
      });

      await Promise.all(uploadPromises);
      console.log('✅ All files uploaded to S3');

      // Step 4.5: Wait a bit to ensure S3 has committed the files (eventual consistency)
      // S3 có thể có delay nhỏ trước khi file thực sự có sẵn
      console.log('⏳ Waiting for S3 to commit files...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      console.log('✅ Ready to submit job');

      // Step 5: Submit job (only if auto-create products is enabled)
      if (autoCreateProducts) {
        const s3Urls = responseData.urls
          .filter(u => !u.isDuplicate)
          .map(u => u.s3Url);
        const fileNames = responseData.urls
          .filter(u => !u.isDuplicate)
          .map(u => u.fileName);
        const checksums = fileInfos
          .filter((f, i) => !responseData.urls[i].isDuplicate)
          .map(f => f.checksum);

        console.log('🚀 Submitting job for processing...');
        await productService.submitBulkUpload({
          jobId,
          s3Urls,
          fileNames,
          checksums,
        });
        console.log('✅ Job submitted');

        // Step 6: Start polling for progress
        startPolling(jobId);
      } else {
        setSuccessData({
          title: "Upload thành công!",
          type: "bulk",
          details: {
            totalFiles: nonDuplicateFiles.length,
            successCount: nonDuplicateFiles.length,
            failedCount: 0,
            jobId: jobId,
            note: "Chưa tạo sản phẩm vì tùy chọn 'Tự động tạo sản phẩm' đã tắt"
          }
        });
        setShowSuccessModal(true);
        showSuccess(`Upload thành công ${nonDuplicateFiles.length} files!`, 4000);
        setBulkUploading(false);
      }

    } catch (err) {
      console.error('❌ Error in bulk upload:', err);
      setError(err.message || 'Không thể upload ảnh');
      showError(`Lỗi bulk upload: ${err.message || 'Không thể upload ảnh'}`);
      setBulkUploading(false);
    }
  };

  // Start polling for job status
  const startPolling = (jobId) => {
    // Clear existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    // Poll every 2 seconds
    pollingIntervalRef.current = setInterval(async () => {
      try {
        const response = await productService.getJobStatus(jobId);
        const data = productService.parseResponse(response);
        setBulkProgress(data);

        // Stop polling if job is completed or failed
        if (data.status === 'COMPLETED' || data.status === 'FAILED') {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          setBulkUploading(false);

          if (data.status === 'COMPLETED') {
            // Show detailed success modal
            setSuccessData({
              title: "Hoàn thành!",
              type: "bulk",
              details: {
                totalFiles: data.totalFiles,
                successCount: data.successCount,
                failedCount: data.failedCount,
                jobId: data.jobId || bulkJobId,
              }
            });
            setShowSuccessModal(true);

            showSuccess(
              `Hoàn thành! Tổng: ${data.totalFiles} | Thành công: ${data.successCount} | Thất bại: ${data.failedCount}`,
              4000
            );
            // Reload images
            await loadImages();
          } else {
            showError(`Job thất bại: ${data.errorMessage || 'Unknown error'}`);
          }
        }
      } catch (err) {
        console.error('Error polling job status:', err);
      }
    }, 2000);
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* TITLE SECTION */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-700">
            Quản lý ảnh sản phẩm
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload và phân loại ảnh tự động dựa trên tên file
          </p>
        </div>
      </div>

      {/* UPLOAD SECTION */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-6">
          <Upload className="text-emerald-600" size={24} />
          <h2 className="text-xl font-semibold text-gray-800">Upload Ảnh</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Single Upload */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <ImageIcon size={18} />
              Upload Đơn Lẻ
              {useAIAnalysis && (
                <span className="ml-auto px-2 py-0.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                  <Zap size={10} />
                  AI
                </span>
              )}
            </h3>

            <label className={`cursor-pointer inline-flex items-center gap-2 ${useAIAnalysis ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-blue-600'} text-white px-4 py-2 rounded-lg hover:opacity-90 transition text-sm font-medium ${(uploading || analyzing) ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {analyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang phân tích AI...
                </>
              ) : uploading ? (
                <>
                  <Upload size={18} />
                  Đang upload...
                </>
              ) : (
                <>
                  {useAIAnalysis ? <Sparkles size={18} /> : <Upload size={18} />}
                  {useAIAnalysis ? 'Chọn ảnh (AI phân tích)' : 'Chọn 1 ảnh'}
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading || analyzing}
                className="hidden"
              />
            </label>

            {uploading && (
              <div className="mt-3 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {analyzing && (
              <div className="mt-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-3 text-sm text-purple-800 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                <span>Gemini AI đang phân tích nội dung ảnh...</span>
              </div>
            )}

            <div className="mt-3 space-y-2">
              {/* AI Analysis Toggle */}
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={useAIAnalysis}
                  onChange={(e) => setUseAIAnalysis(e.target.checked)}
                  disabled={uploading || analyzing}
                  className="w-3.5 h-3.5 text-purple-600 rounded focus:ring-purple-500"
                />
                <span className={`${useAIAnalysis ? 'text-purple-700 font-medium' : 'text-gray-600'}`}>
                  🤖 Phân tích với Gemini AI (xem trước & chỉnh sửa)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={autoCropBlackBorders}
                  onChange={(e) => setAutoCropBlackBorders(e.target.checked)}
                  disabled={uploading || analyzing}
                  className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span>🖼️ Tự động crop vùng đen bao quanh</span>
              </label>
            </div>
          </div>

          {/* Bulk Upload */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Grid3x3 size={18} />
              Upload Hàng Loạt
              {useAIAnalysis && (
                <span className="ml-auto px-2 py-0.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-[10px] font-bold rounded-full flex items-center gap-1">
                  <Zap size={10} />
                  AI
                </span>
              )}
            </h3>
            <div className="space-y-3">
              <label className={`cursor-pointer inline-flex items-center gap-2 ${useAIAnalysis ? 'bg-gradient-to-r from-purple-600 to-blue-600' : 'bg-green-600'} text-white px-4 py-2 rounded-lg hover:opacity-90 transition text-sm font-medium ${bulkUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {bulkUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {useAIAnalysis ? 'Đang phân tích AI...' : 'Đang xử lý...'}
                  </>
                ) : (
                  <>
                    {useAIAnalysis ? <Sparkles size={18} /> : <Upload size={18} />}
                    {useAIAnalysis ? 'Chọn nhiều ảnh (AI phân tích)' : 'Chọn nhiều ảnh (1000+ files)'}
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleBulkUpload}
                  disabled={bulkUploading}
                  className="hidden"
                />
              </label>
              <div className="space-y-2">
                {/* AI Analysis Toggle for Bulk */}
                <label className="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    checked={useAIAnalysis}
                    onChange={(e) => setUseAIAnalysis(e.target.checked)}
                    disabled={bulkUploading}
                    className="w-3.5 h-3.5 text-purple-600 rounded focus:ring-purple-500"
                  />
                  <span className={`${useAIAnalysis ? 'text-purple-700 font-medium' : 'text-gray-600'}`}>
                    🤖 Phân tích với Gemini AI
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={autoCreateProducts}
                    onChange={(e) => setAutoCreateProducts(e.target.checked)}
                    disabled={bulkUploading}
                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                  />
                  <span>Tự động tạo sản phẩm</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={autoCropBlackBorders}
                    onChange={(e) => setAutoCropBlackBorders(e.target.checked)}
                    disabled={bulkUploading}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span>🖼️ Tự động crop vùng đen bao quanh</span>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="text-xs text-gray-600 bg-gray-50 px-3 py-2 rounded">
                  Đã chọn: <strong>{selectedFiles.length}</strong> files
                </div>
              )}

              {/* Bulk Upload Progress */}
              {bulkProgress && (
                <div className="space-y-2 bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Tiến độ: {bulkProgress.processedFiles} / {bulkProgress.totalFiles}</span>
                    <span className="text-emerald-600">{bulkProgress.progressPercentage?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${bulkProgress.progressPercentage || 0}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-xs text-gray-600">
                    <span>✅ <strong className="text-green-600">{bulkProgress.successCount}</strong></span>
                    <span>❌ <strong className="text-red-600">{bulkProgress.failedCount}</strong></span>
                    <span>📊 <strong>{bulkProgress.status}</strong></span>
                  </div>
                  {bulkJobId && (
                    <div className="text-xs text-gray-500 font-mono">
                      Job ID: {bulkJobId}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-2">💡 Hướng dẫn:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Hệ thống sẽ <strong>tự động phân loại</strong> ảnh dựa trên <strong>tên file</strong></li>
              <li>Ví dụ: <code className="bg-blue-100 px-1 rounded">dress_women_blue_summer.jpg</code> → Category: template, Type: vay_dam, Gender: female</li>
              <li><strong>Bulk Upload:</strong> Upload trực tiếp lên S3, tự động tạo ImageAsset và Product (nếu bật)</li>
              <li><strong>🖼️ Auto-crop:</strong> Tự động loại bỏ vùng đen/transparent bao quanh ảnh để ảnh gọn gàng hơn</li>
            </ul>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-xl shadow-sm border p-4 flex flex-wrap gap-4 items-center">
        {/* TYPE FILTER - Dropdown với 50+ loại */}
        <div className="relative flex-1 min-w-[200px]">
          <select
            className="w-full p-2 pl-10 border rounded-lg outline-none cursor-pointer bg-white text-sm appearance-none"
            value={filters.type}
            onChange={(e) => handleFilterChange("type", e.target.value)}
          >
            <option value="">🏷️ Tất cả loại trang phục</option>
            <optgroup label="👔 Áo (Tops)">
              <option value="ao_so_mi">👔 Áo sơ mi</option>
              <option value="ao_thun">👕 Áo thun</option>
              <option value="ao_polo">👕 Áo polo</option>
              <option value="ao_len">🧶 Áo len</option>
              <option value="ao_hoodie">🧥 Áo hoodie</option>
              <option value="ao_croptop">👚 Áo crop top</option>
              <option value="ao_kiem">👚 Áo kiểu</option>
              <option value="ao_ba_lo">🎽 Áo ba lỗ</option>
            </optgroup>
            <optgroup label="🧥 Áo khoác">
              <option value="ao_khoac">🧥 Áo khoác</option>
              <option value="blazer">🧥 Blazer</option>
              <option value="vest">🤵 Vest / Suit</option>
              <option value="cardigan">🧥 Cardigan</option>
            </optgroup>
            <optgroup label="👖 Quần">
              <option value="quan_tay">👖 Quần tây</option>
              <option value="quan_jean">👖 Quần jean</option>
              <option value="quan_short">🩳 Quần short</option>
              <option value="quan_ong_rong">👖 Quần ống rộng</option>
              <option value="quan_culottes">👖 Quần culottes</option>
              <option value="quan_jogger">🏃 Quần jogger</option>
              <option value="quan_palazzo">👖 Quần palazzo</option>
            </optgroup>
            <optgroup label="👗 Váy">
              <option value="chan_vay">👗 Chân váy</option>
              <option value="vay_a">👗 Váy chữ A</option>
              <option value="vay_but_chi">👗 Váy bút chì</option>
              <option value="vay_xoe">💃 Váy xòe</option>
              <option value="vay_midi">👗 Váy midi</option>
              <option value="vay_maxi">👗 Váy maxi</option>
            </optgroup>
            <optgroup label="✨ Đầm">
              <option value="vay_dam">👗 Đầm / Váy liền</option>
              <option value="dam_da_hoi">✨ Đầm dạ hội</option>
              <option value="dam_cocktail">🍸 Đầm cocktail</option>
              <option value="dam_cuoi">💒 Đầm cưới</option>
              <option value="dam_du_tiec">🎉 Đầm dự tiệc</option>
              <option value="dam_cong_so">💼 Đầm công sở</option>
            </optgroup>
            <optgroup label="🎯 Bộ đồ">
              <option value="jumpsuit">🦸 Jumpsuit</option>
              <option value="romper">👶 Romper</option>
              <option value="pantsuit">👩‍💼 Pantsuit</option>
              <option value="bo_vest">🤵 Bộ vest</option>
              <option value="bo_tap_gym">🏋️ Bộ tập gym</option>
            </optgroup>
            <optgroup label="🏮 Truyền thống">
              <option value="ao_dai">🇻🇳 Áo dài</option>
              <option value="ao_dai_cuoi">💒 Áo dài cưới</option>
              <option value="hanbok">🇰🇷 Hanbok</option>
              <option value="kimono">🇯🇵 Kimono</option>
              <option value="cheongsam">🇨🇳 Sườn xám</option>
            </optgroup>
          </select>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
        </div>

        {/* CATEGORY FILTER */}
        <div className="flex items-center gap-2">
          <Filter size={18} className="text-gray-500" />
          <select
            className="p-2 border rounded-lg outline-none cursor-pointer bg-white text-sm"
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
          >
            <option value="">📂 Tất cả Category</option>
            <option value="template">📷 Mẫu trang phục</option>
            <option value="fabric">🧵 Vải</option>
            <option value="style">✨ Phong cách</option>
          </select>
        </div>

        {/* GENDER FILTER */}
        <div className="flex items-center gap-2">
          <select
            className="p-2 border rounded-lg outline-none cursor-pointer bg-white text-sm"
            value={filters.gender}
            onChange={(e) => handleFilterChange("gender", e.target.value)}
          >
            <option value="">👥 Tất cả giới tính</option>
            <option value="female">👩 Nữ</option>
            <option value="male">👨 Nam</option>
            <option value="unisex">👤 Unisex</option>
          </select>
        </div>

        <div className="flex items-center gap-2 border-l pl-4 ml-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-100'}`}
            title="Grid view"
          >
            <Grid3x3 size={20} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:bg-gray-100'}`}
            title="List view"
          >
            <List size={20} />
          </button>
        </div>

        {/* Bulk delete button */}
        {selectedImageIds.size > 0 && (
          <button
            onClick={handleBulkDeleteClick}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center gap-2"
          >
            <Trash2 size={16} />
            Xóa đã chọn ({selectedImageIds.size})
          </button>
        )}

        <button
          onClick={() => {
            setFilters({ category: "", type: "", gender: "", page: 0, size: 20 });
          }}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium flex items-center gap-2"
        >
          <X size={16} />
          Xóa bộ lọc
        </button>

        {/* Cleanup orphan checksums button */}
        <button
          onClick={handleCleanupOrphanChecksums}
          disabled={cleaningUp}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Xóa các checksum orphan (không có ImageAsset tương ứng) để có thể upload lại các file đã bị duplicate"
        >
          {cleaningUp ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Đang cleanup...</span>
            </>
          ) : (
            <>
              <Info size={16} />
              <span>Cleanup Duplicate</span>
            </>
          )}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">Lỗi</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* IMAGES GRID/LIST */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border p-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <p className="mt-3 text-gray-600 text-sm">Đang tải ảnh...</p>
          </div>
        </div>
      ) : images.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12">
          <div className="text-center">
            <ImageIcon className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-600 font-medium">Chưa có ảnh nào</p>
            <p className="text-sm text-gray-500 mt-1">Upload ảnh để bắt đầu quản lý</p>
          </div>
        </div>
      ) : (
        <>
          {/* Select All Checkbox */}
          {images.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedImageIds.size === images.length && images.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Chọn tất cả ({selectedImageIds.size}/{images.length})
                </span>
              </label>
              {selectedImageIds.size > 0 && (
                <button
                  onClick={() => setSelectedImageIds(new Set())}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Bỏ chọn
                </button>
              )}
            </div>
          )}

          <div className={`${viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4' : 'space-y-3'}`}>
            {images.map((image) => {
              const isSelected = selectedImageIds.has(image.id);
              return (
                <div
                  key={image.id}
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group ${viewMode === 'list' ? 'flex items-center gap-4 p-3' : ''
                    } ${isSelected ? 'ring-2 ring-red-500 ring-offset-2' : ''}`}
                  onClick={() => handleImageClick(image)}
                >
                  <div className={`${viewMode === 'grid' ? 'aspect-[3/4] relative bg-gray-100 overflow-hidden' : 'w-24 h-32 flex-shrink-0 relative bg-gray-100 overflow-hidden'}`}>
                    {/* Selection checkbox */}
                    <div className="absolute top-2 left-2 z-20">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleToggleSelect(e, image.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-5 h-5 text-red-600 rounded focus:ring-red-500 cursor-pointer bg-white"
                      />
                    </div>
                    <div className="absolute inset-0">
                      <OptimizedImage
                        src={image.url || image.largeUrl || image.s3Key}
                        alt={image.s3Key || image.fileName || 'Product image'}
                        className="w-full h-full"
                        style={{
                          objectFit: 'cover',
                          objectPosition: 'center',
                          WebkitImageRendering: '-webkit-optimize-contrast',
                          imageRendering: 'auto',
                          width: '100%',
                          height: '100%',
                          maxWidth: '100%',
                          maxHeight: '100%',
                          display: 'block',
                          backfaceVisibility: 'hidden',
                          transform: 'translateZ(0)',
                          willChange: 'opacity',
                          filter: 'none',
                        }}
                      />
                    </div>
                    {/* Delete button - visible on hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(e, image);
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-700 z-10"
                      title="Xóa ảnh"
                    >
                      <Trash2 size={14} />
                    </button>
                    <div className={`absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-200 ${isSelected ? 'bg-red-500/10' : ''}`}></div>
                    <div className={`absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 ${viewMode === 'list' ? 'hidden' : ''}`}>
                      👁️ Xem
                    </div>
                  </div>
                  <div className={`${viewMode === 'grid' ? 'p-3 space-y-1.5' : 'flex-1 min-w-0 space-y-1'}`}>
                    <div className={`text-xs ${viewMode === 'grid' ? 'space-y-1' : 'space-y-0.5'}`}>
                      <div className="truncate">
                        <span className="font-semibold text-gray-700">Category:</span>
                        <span className="ml-1 capitalize text-gray-600">{image.category || 'N/A'}</span>
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-gray-700">Type:</span>
                        <span className="ml-1 text-gray-600">{image.type || 'N/A'}</span>
                      </div>
                      <div className="truncate">
                        <span className="font-semibold text-gray-700">Gender:</span>
                        <span className="ml-1 capitalize text-gray-600">{image.gender || 'unisex'}</span>
                      </div>
                      {image.tags && image.tags.length > 0 && viewMode === 'grid' && (
                        <div className="line-clamp-1 pt-0.5">
                          <span className="font-semibold text-gray-700">Tags:</span>
                          <span className="ml-1 text-gray-600">
                            {image.tags.slice(0, 2).join(", ")}
                            {image.tags.length > 2 && ` +${image.tags.length - 2}`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* PAGINATION */}
          {pagination.totalPages > 1 && (
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Hiển thị <strong>{images.length}</strong> / <strong>{pagination.totalElements}</strong> ảnh
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 0}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium"
                  >
                    Trước
                  </button>
                  <span className="px-4 py-2 text-sm text-gray-700">
                    Trang {pagination.page + 1} / {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages - 1}
                    className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-sm font-medium"
                  >
                    Sau
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Image Detail Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in"
          onClick={closeDetailModal}
        >
          <div
            className="bg-white rounded-3xl max-w-7xl w-full max-h-[96vh] flex flex-col shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex-shrink-0 bg-gradient-to-r from-emerald-50 to-blue-50 border-b border-gray-200 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <ImageIcon className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Chi tiết ảnh sản phẩm</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Thông tin chi tiết và phân loại</p>
                </div>
              </div>
              <button
                onClick={closeDetailModal}
                className="w-9 h-9 rounded-xl bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all shadow-sm hover:shadow"
                title="Đóng"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto min-h-0 bg-gray-50">
              <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-6 lg:gap-8">
                {/* LEFT: HÌNH ẢNH */}
                <div className="flex flex-col">
                  <div className="relative rounded-2xl overflow-hidden shadow-xl bg-white border border-gray-200 aspect-square lg:aspect-auto lg:h-[calc(96vh-200px)]">
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                      <OptimizedImage
                        src={selectedImage.largeUrl || selectedImage.url || selectedImage.s3Key}
                        alt={selectedImage.s3Key || selectedImage.fileName || 'Product image'}
                        className="w-auto h-auto max-w-full max-h-full"
                        loading="eager"
                        style={{
                          objectFit: 'contain',
                          objectPosition: 'center',
                          WebkitImageRendering: '-webkit-optimize-contrast',
                          imageRendering: 'crisp-edges',
                          imageRendering: '-webkit-optimize-contrast',
                          imageRendering: 'auto',
                          width: 'auto',
                          height: 'auto',
                          maxWidth: '100%',
                          maxHeight: '100%',
                          display: 'block',
                          margin: 'auto',
                          backfaceVisibility: 'hidden',
                          transform: 'translateZ(0)',
                          willChange: 'opacity',
                          filter: 'none',
                        }}
                      />
                    </div>
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-sm z-10">
                      <span className="text-xs font-semibold text-gray-700">Preview</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: THÔNG TIN CHI TIẾT */}
                <div className="space-y-5">
                  {/* MÔ TẢ SẢN PHẨM */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Info className="text-blue-600" size={18} />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">
                        Mô tả sản phẩm
                      </h3>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed mb-4">
                      {selectedImage.category === "template"
                        ? `Ảnh mẫu ${selectedImage.type ? selectedImage.type.replace(/_/g, " ") : "sản phẩm"} - ${selectedImage.gender === "male" ? "Nam" : selectedImage.gender === "female" ? "Nữ" : "Unisex"}`
                        : `Ảnh ${selectedImage.category} - ${selectedImage.type || "sản phẩm"}`}
                      {selectedImage.tags && selectedImage.tags.length > 0 && (
                        <span className="ml-2 text-gray-500">
                          ({selectedImage.tags.join(", ")})
                        </span>
                      )}
                    </p>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="text-blue-600" size={14} />
                          <p className="text-[10px] uppercase tracking-wider text-blue-700 font-semibold">
                            Thời gian may
                          </p>
                        </div>
                        <p className="text-sm font-bold text-blue-900">{selectedImage.tailoringTime || "7–14 ngày"}</p>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 border border-purple-200">
                        <div className="flex items-center gap-2 mb-1">
                          <UserCheck className="text-purple-600" size={14} />
                          <p className="text-[10px] uppercase tracking-wider text-purple-700 font-semibold">
                            Số lần thử đồ
                          </p>
                        </div>
                        <p className="text-sm font-bold text-purple-900">{selectedImage.fittingCount || "1–2 lần"}</p>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 border border-green-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="text-green-600" size={14} />
                          <p className="text-[10px] uppercase tracking-wider text-green-700 font-semibold">
                            Bảo hành
                          </p>
                        </div>
                        <p className="text-xs font-bold text-green-900 leading-tight">{selectedImage.warranty || "Chỉnh sửa miễn phí 1 lần"}</p>
                      </div>
                    </div>
                  </div>

                  {/* CHI TIẾT MAY ĐO */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-5 md:p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-sm">
                        <Scissors className="text-white" size={18} />
                      </div>
                      <h3 className="text-base font-bold text-amber-900">
                        Chi tiết may đo
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      <div className="bg-white/70 rounded-xl p-3 border border-amber-200">
                        <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mb-1">
                          Form dáng
                        </p>
                        <p className="text-sm font-semibold text-gray-800">{selectedImage.silhouette || "Ôm nhẹ, tôn eo"}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-3 border border-amber-200">
                        <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mb-1">
                          Độ dài
                        </p>
                        <p className="text-sm font-semibold text-gray-800">{selectedImage.lengthInfo || "Qua gối / maxi tùy chọn"}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-3 border border-amber-200">
                        <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mb-1">
                          Chất liệu gợi ý
                        </p>
                        <p className="text-sm font-semibold text-gray-800">
                          {selectedImage.materials && selectedImage.materials.length > 0
                            ? selectedImage.materials.join(", ")
                            : "Lụa, satin, crepe cao cấp"}
                        </p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-3 border border-amber-200">
                        <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold mb-1">
                          Lót trong
                        </p>
                        <p className="text-sm font-semibold text-gray-800">{selectedImage.lining || "Có, chống hằn & thoáng"}</p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-3 border border-amber-200">
                        <div className="flex items-center gap-1 mb-1">
                          <Palette className="text-amber-600" size={12} />
                          <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">
                            Màu sắc
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">
                          {selectedImage.colors && selectedImage.colors.length > 0
                            ? selectedImage.colors.join(", ")
                            : selectedImage.tags && selectedImage.tags.length > 0
                              ? selectedImage.tags.filter(t => ["đỏ", "xanh", "trắng", "đen", "vàng", "hồng", "tím", "nâu", "xám", "navy", "be", "kem"].some(c => t.toLowerCase().includes(c))).join(", ") || "Tùy chọn theo bảng màu tại tiệm"
                              : "Tùy chọn theo bảng màu tại tiệm"}
                        </p>
                      </div>
                      <div className="bg-white/70 rounded-xl p-3 border border-amber-200">
                        <div className="flex items-center gap-1 mb-1">
                          <Sparkles className="text-amber-600" size={12} />
                          <p className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">
                            Phụ kiện
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{selectedImage.accessories || "Có thể phối thêm belt, hoa cài, khăn choàng"}</p>
                      </div>
                    </div>

                    <div className="bg-white/80 rounded-lg p-3 border border-amber-300">
                      <p className="text-xs text-amber-800 leading-relaxed flex items-start gap-2">
                        <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={14} />
                        <span className="italic">Nếu bạn có ảnh mẫu yêu thích, hãy mang theo – thợ may sẽ tư vấn xem form và chất liệu đó có phù hợp với dáng của bạn không.</span>
                      </p>
                    </div>
                  </div>

                  {/* PHÙ HỢP VỚI AI / DỊP NÀO */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                        <Heart className="text-pink-600" size={18} />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">
                        Mẫu này phù hợp với
                      </h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                        <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <Sparkles className="text-purple-600" size={14} />
                          Dịp sử dụng
                        </p>
                        <ul className="space-y-1.5 text-sm text-gray-700">
                          {selectedImage.occasions && selectedImage.occasions.length > 0 ? (
                            selectedImage.occasions.slice(0, 3).map((occasion, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-purple-500 mt-1">•</span>
                                <span>{occasion}</span>
                              </li>
                            ))
                          ) : (
                            <>
                              <li className="flex items-start gap-2">
                                <span className="text-purple-500 mt-1">•</span>
                                <span>{selectedImage.occasion === 'wedding' ? 'Cưới hỏi, lễ kỷ niệm' : selectedImage.occasion === 'party' ? 'Tiệc tùng, dạ hội' : selectedImage.occasion === 'work' ? 'Công sở, họp hành' : selectedImage.occasion === 'daily' ? 'Hàng ngày, dạo phố' : 'Cưới hỏi, lễ kỷ niệm, tiệc tối'}</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-purple-500 mt-1">•</span>
                                <span>Chụp ảnh kỷ niệm, pre-wedding</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-purple-500 mt-1">•</span>
                                <span>Sự kiện cần sự chỉn chu, thanh lịch</span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
                        <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                          <UserCheck className="text-blue-600" size={14} />
                          Phong cách khách hàng
                        </p>
                        <ul className="space-y-1.5 text-sm text-gray-700">
                          {selectedImage.customerStyles && selectedImage.customerStyles.length > 0 ? (
                            selectedImage.customerStyles.slice(0, 3).map((style, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{style}</span>
                              </li>
                            ))
                          ) : (
                            <>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{selectedImage.styleCategory === 'elegant' ? 'Thích sự sang trọng, tinh tế' : selectedImage.styleCategory === 'casual' ? 'Thích sự thoải mái, năng động' : selectedImage.styleCategory === 'sexy' ? 'Thích sự quyến rũ, gợi cảm' : 'Thích sự nữ tính, mềm mại nhưng không sến'}</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>Muốn tôn dáng nhưng vẫn di chuyển thoải mái</span>
                              </li>
                              <li className="flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>Cần trang phục "đẹp ngoài đời & đẹp trên hình"</span>
                              </li>
                            </>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                      <p className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <Shield className="text-green-600" size={14} />
                        Gợi ý bảo quản
                      </p>
                      <ul className="space-y-1.5 text-sm text-gray-700">
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span>Ưu tiên giặt tay hoặc giặt chế độ nhẹ, nước lạnh.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span>Không vắt xoắn mạnh, phơi nơi thoáng mát, tránh nắng gắt.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="text-green-500 mt-1">•</span>
                          <span>Ủi ở nhiệt độ thấp, dùng khăn lót để bề mặt vải luôn mịn.</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* THÔNG TIN PHÂN LOẠI */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Info className="text-indigo-600" size={18} />
                      </div>
                      <h3 className="text-base font-bold text-gray-900">
                        Thông tin phân loại
                      </h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
                        <span className="font-semibold text-gray-700 flex items-center gap-2">
                          <span className="text-blue-600">Category:</span>
                        </span>
                        <span className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-bold capitalize shadow-sm">
                          {selectedImage.category || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
                        <span className="font-semibold text-gray-700 flex items-center gap-2">
                          <span className="text-green-600">Type:</span>
                        </span>
                        <span className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-sm font-bold shadow-sm">
                          {selectedImage.type || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 shadow-sm">
                        <span className="font-semibold text-gray-700 flex items-center gap-2">
                          <span className="text-purple-600">Gender:</span>
                        </span>
                        <span className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-bold capitalize shadow-sm">
                          {selectedImage.gender || "unisex"}
                        </span>
                      </div>
                      {selectedImage.tags && selectedImage.tags.length > 0 && (
                        <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-200 shadow-sm">
                          <span className="font-semibold text-gray-700 block mb-3 flex items-center gap-2">
                            <Sparkles className="text-amber-600" size={14} />
                            Tags:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {selectedImage.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-amber-600 transition-colors"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Related Products */}
                  {relatedProducts.length > 0 && (
                    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 md:p-6">
                      <h3 className="text-[14px] font-semibold text-[#111827] mb-3">
                        Sản phẩm liên quan
                        {loadingRelatedProducts && <span className="text-xs font-normal text-gray-500 ml-2">(Đang tải...)</span>}
                      </h3>

                      {loadingRelatedProducts ? (
                        <div className="text-center py-4">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      ) : relatedProducts.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                          {relatedProducts.map((product) => (
                            <div
                              key={product.id}
                              onClick={() => handleViewProduct(product)}
                              className="bg-white border border-gray-200 rounded-lg p-3 hover:border-blue-500 hover:shadow-md transition cursor-pointer"
                            >
                              <div className="aspect-[3/4] relative mb-2 rounded overflow-hidden bg-gray-100">
                                <OptimizedImage
                                  src={product.image || product.imageUrl}
                                  alt={product.name}
                                  className="w-full h-full"
                                  style={{
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                    WebkitImageRendering: '-webkit-optimize-contrast',
                                    imageRendering: 'auto',
                                    backfaceVisibility: 'hidden',
                                    transform: 'translateZ(0)',
                                    filter: 'none',
                                  }}
                                />
                              </div>
                              <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-1">
                                {product.name}
                              </h4>
                              <p className="text-xs text-gray-600">
                                {product.price || "Liên hệ"}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col gap-3 pt-2">
                    <button
                      onClick={() => {
                        if (selectedImage.url) {
                          window.open(selectedImage.url, "_blank");
                        }
                      }}
                      className="w-full px-6 py-3.5 text-sm font-semibold bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <ImageIcon size={18} />
                      <span>Mở ảnh gốc</span>
                    </button>
                    {relatedProducts.length > 0 && (
                      <button
                        onClick={() => {
                          const categoryMap = {
                            "ao_dai": "ao-dai",
                            "ao_so_mi": "ao-so-mi",
                            "quan_tay": "quan-tay",
                            "vest": "vest",
                            "vay_dam": "dam",
                            "dam": "dam",
                          };
                          const category = categoryMap[selectedImage.type] || selectedImage.category;
                          navigate(`/products?category=${category}`);
                          closeDetailModal();
                        }}
                        className="w-full px-6 py-3.5 text-sm font-semibold border-2 border-emerald-600 text-emerald-700 rounded-xl hover:bg-emerald-600 hover:text-white transition-all duration-200 flex items-center justify-center gap-2 bg-white"
                      >
                        <Grid3x3 size={18} />
                        <span>Xem tất cả sản phẩm</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && successData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowSuccessModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="text-green-600" size={24} />
                </div>
                <h3 className="text-xl font-semibold text-gray-800">{successData.title}</h3>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3">
              {successData.type === "single" ? (
                <>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-2"><strong>File:</strong> {successData.details.fileName}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Category:</span>
                        <span className="ml-2 font-medium capitalize">{successData.details.category}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-2 font-medium">{successData.details.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Gender:</span>
                        <span className="ml-2 font-medium capitalize">{successData.details.gender}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Tags:</span>
                        <span className="ml-2 font-medium">{successData.details.tags}</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tổng số file:</span>
                      <span className="font-semibold text-gray-800">{successData.details.totalFiles}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Thành công:</span>
                      <span className="font-semibold text-green-600">{successData.details.successCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Thất bại:</span>
                      <span className="font-semibold text-red-600">{successData.details.failedCount}</span>
                    </div>
                    {successData.details.jobId && (
                      <div className="pt-2 border-t border-gray-200">
                        <span className="text-xs text-gray-500">Job ID:</span>
                        <span className="ml-2 text-xs font-mono text-gray-700">{successData.details.jobId}</span>
                      </div>
                    )}
                    {successData.details.note && (
                      <div className="pt-2 border-t border-gray-200">
                        <p className="text-xs text-amber-600 italic">{successData.details.note}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && imageToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Xác nhận xóa ảnh</h3>
                <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-3">
                Bạn có chắc chắn muốn xóa ảnh này không?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                    <OptimizedImage
                      src={imageToDelete.url || imageToDelete.s3Key}
                      alt={imageToDelete.s3Key || imageToDelete.fileName || 'Image'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {imageToDelete.s3Key || imageToDelete.fileName || 'Image'}
                    </p>
                    {imageToDelete.category && (
                      <p className="text-xs text-gray-500 mt-1">
                        {imageToDelete.category} • {imageToDelete.type || ''} • {imageToDelete.gender || 'unisex'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Xóa ảnh</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE CONFIRMATION MODAL */}
      {showBulkDeleteModal && selectedImageIds.size > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Xác nhận xóa nhiều ảnh</h3>
                <p className="text-sm text-gray-500">Hành động này không thể hoàn tác</p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-3">
                Bạn có chắc chắn muốn xóa <strong>{selectedImageIds.size}</strong> ảnh đã chọn không?
              </p>
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 max-h-48 overflow-y-auto">
                <div className="grid grid-cols-4 gap-2">
                  {images
                    .filter(img => selectedImageIds.has(img.id))
                    .slice(0, 12)
                    .map((image) => (
                      <div key={image.id} className="aspect-[3/4] rounded overflow-hidden bg-gray-200">
                        <OptimizedImage
                          src={image.url || image.largeUrl || image.s3Key}
                          alt={image.s3Key || image.fileName || 'Image'}
                          className="w-full h-full object-cover"
                          style={{
                            objectFit: 'cover',
                            objectPosition: 'center',
                            WebkitImageRendering: '-webkit-optimize-contrast',
                            imageRendering: 'auto',
                            backfaceVisibility: 'hidden',
                            transform: 'translateZ(0)',
                            filter: 'none',
                          }}
                        />
                      </div>
                    ))}
                </div>
                {selectedImageIds.size > 12 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    và {selectedImageIds.size - 12} ảnh khác...
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBulkDeleteCancel}
                disabled={bulkDeleting}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={handleBulkDeleteConfirm}
                disabled={bulkDeleting}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {bulkDeleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Xóa {selectedImageIds.size} ảnh</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI ANALYSIS MODAL */}
      <AIAnalysisModal
        isOpen={showAIModal}
        onClose={handleAIModalClose}
        analysisResult={analysisResult}
        imagePreview={imagePreview}
        onSave={handleAISave}
        saving={uploading}
        error={error}
      />
    </div>
  );
};

export default ImageUploadPage;

