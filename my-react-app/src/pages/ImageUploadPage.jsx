import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { imageAssetService, productService } from "../services/index.js";
import Header from "../components/Header.jsx";
import OptimizedImage from "../components/OptimizedImage.jsx";
import usePageMeta from "../hooks/usePageMeta";

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
  
  usePageMeta({
    title: "Quản lý ảnh sản phẩm",
    description: "Upload và phân loại ảnh sản phẩm tự động",
  });

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
  const pollingIntervalRef = useRef(null);
  
  // Detail modal state
  const [selectedImage, setSelectedImage] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loadingRelatedProducts, setLoadingRelatedProducts] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    category: "",
    type: "",
    gender: "",
    page: 0,
    size: 20,
  });

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

    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);

      // Tự động lấy mô tả từ tên file
      // Ví dụ: "dress_women_blue_summer_collage.jpg" -> "dress women blue summer collage"
      const fileName = file.name;
      const description = fileName
        .replace(/\.[^/.]+$/, "") // Bỏ extension
        .replace(/_/g, " ") // Thay _ bằng space
        .replace(/-/g, " "); // Thay - bằng space
      
      console.log(`📁 File: ${fileName}`);
      console.log(`📝 Auto description: ${description}`);
      
      // Upload với tên file làm mô tả (backend sẽ tự động phân loại)
      const response = await imageAssetService.upload(file, {
        description: description, // Gửi tên file đã parse làm mô tả
      });

      const data = imageAssetService.parseResponse(response);
      
      // Reload images
      await loadImages();
      
      alert(`✅ Upload thành công!\n\n` +
            `📁 File: ${fileName}\n` +
            `📂 Category: ${data.category}\n` +
            `👕 Type: ${data.type}\n` +
            `👤 Gender: ${data.gender}\n` +
            `🏷️ Tags: ${data.tags?.join(", ") || "N/A"}`);
      
      // Reset file input
      event.target.value = "";
    } catch (err) {
      console.error("Error uploading image:", err);
      setError(err.message || "Không thể upload ảnh");
      alert(`❌ Lỗi: ${err.message || "Không thể upload ảnh"}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
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

    try {
      setBulkUploading(true);
      setError(null);
      setSelectedFiles(files);

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
        alert('⚠️ Tất cả các file đều là duplicate!');
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
        alert(`✅ Upload thành công ${nonDuplicateFiles.length} files!\n\n` +
              `Job ID: ${jobId}\n` +
              `(Chưa tạo sản phẩm vì tùy chọn "Tự động tạo sản phẩm" đã tắt)`);
        setBulkUploading(false);
      }

      // Reset file input
      event.target.value = "";
    } catch (err) {
      console.error('❌ Error in bulk upload:', err);
      setError(err.message || 'Không thể upload ảnh');
      alert(`❌ Lỗi: ${err.message || 'Không thể upload ảnh'}`);
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
            alert(`✅ Hoàn thành!\n\n` +
                  `Tổng số file: ${data.totalFiles}\n` +
                  `Thành công: ${data.successCount}\n` +
                  `Thất bại: ${data.failedCount}`);
            // Reload images
            await loadImages();
          } else {
            alert(`❌ Job thất bại: ${data.errorMessage || 'Unknown error'}`);
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Quản Lý Ảnh Sản Phẩm</h1>

        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload Ảnh</h2>
          
          {/* Single Upload */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Upload Đơn Lẻ</h3>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                {uploading ? "Đang upload..." : "Chọn 1 ảnh"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              {uploading && (
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Bulk Upload */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-2">Upload Hàng Loạt (Bulk Upload)</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label className="cursor-pointer bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                  {bulkUploading ? "Đang xử lý..." : "Chọn nhiều ảnh (1000+ files)"}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleBulkUpload}
                    disabled={bulkUploading}
                    className="hidden"
                  />
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoCreateProducts}
                    onChange={(e) => setAutoCreateProducts(e.target.checked)}
                    disabled={bulkUploading}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">Tự động tạo sản phẩm</span>
                </label>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="text-sm text-gray-600">
                  Đã chọn: <strong>{selectedFiles.length}</strong> files
                </div>
              )}

              {/* Bulk Upload Progress */}
              {bulkProgress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tiến độ: {bulkProgress.processedFiles} / {bulkProgress.totalFiles}</span>
                    <span>{bulkProgress.progressPercentage?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-600 h-3 rounded-full transition-all"
                      style={{ width: `${bulkProgress.progressPercentage || 0}%` }}
                    />
                  </div>
                  <div className="text-sm text-gray-600">
                    Thành công: <strong className="text-green-600">{bulkProgress.successCount}</strong> | 
                    Thất bại: <strong className="text-red-600">{bulkProgress.failedCount}</strong> | 
                    Trạng thái: <strong>{bulkProgress.status}</strong>
                  </div>
                  {bulkJobId && (
                    <div className="text-xs text-gray-500">
                      Job ID: {bulkJobId}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-600 mt-4">
            💡 Hệ thống sẽ <strong>tự động phân loại</strong> ảnh dựa trên <strong>tên file</strong><br/>
            Ví dụ: <code className="bg-gray-100 px-1 rounded">dress_women_blue_summer.jpg</code> → Category: template, Type: vay_dam, Gender: female<br/>
            💡 <strong>Bulk Upload:</strong> Upload trực tiếp lên S3, tự động tạo ImageAsset và Product (nếu bật)
          </p>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Lọc Ảnh</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Tất cả</option>
                <option value="template">Template</option>
                <option value="fabric">Fabric</option>
                <option value="style">Style</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <input
                type="text"
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                placeholder="ao_so_mi, quan_tay..."
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Gender</label>
              <select
                value={filters.gender}
                onChange={(e) => handleFilterChange("gender", e.target.value)}
                className="w-full border rounded px-3 py-2"
              >
                <option value="">Tất cả</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="unisex">Unisex</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({ category: "", type: "", gender: "", page: 0, size: 20 });
                }}
                className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Images Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Đang tải...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">Chưa có ảnh nào</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
              {images.map((image) => (
                <div
                  key={image.id}
                  className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition cursor-pointer"
                  onClick={() => handleImageClick(image)}
                >
                  <div className="aspect-square relative">
                    <OptimizedImage
                      src={image.url || image.s3Key}
                      alt={image.s3Key}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      👁️ Xem chi tiết
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>
                        <span className="font-semibold">Category:</span> {image.category}
                      </div>
                      <div>
                        <span className="font-semibold">Type:</span> {image.type}
                      </div>
                      <div>
                        <span className="font-semibold">Gender:</span> {image.gender}
                      </div>
                      {image.tags && image.tags.length > 0 && (
                        <div>
                          <span className="font-semibold">Tags:</span> {image.tags.join(", ")}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 0}
                  className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="px-4 py-2">
                  Trang {pagination.page + 1} / {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages - 1}
                  className="px-4 py-2 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}

            {/* Summary */}
            <div className="mt-4 text-center text-sm text-gray-600">
              Hiển thị {images.length} / {pagination.totalElements} ảnh
            </div>
          </>
        )}
        
        {/* Image Detail Modal */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={closeDetailModal}
          >
            <div 
              className="bg-white rounded-[24px] max-w-6xl w-full max-h-[95vh] flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-semibold text-gray-800">Chi tiết ảnh sản phẩm</h2>
                <button
                  onClick={closeDetailModal}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                >
                  ×
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 p-6 overflow-y-auto min-h-0">
                <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-8 h-full min-h-[calc(95vh-120px)]">
                  {/* LEFT: HÌNH ẢNH */}
                  <div className="flex flex-col h-full">
                    <div className="relative rounded-2xl overflow-hidden h-full shadow-md bg-gray-50">
                      <img
                        src={selectedImage.url || selectedImage.s3Key}
                        alt={selectedImage.s3Key}
                        className="w-full h-full object-cover"
                        style={{
                          imageRendering: '-webkit-optimize-contrast',
                          objectFit: 'cover',
                          minHeight: '100%',
                          width: '100%',
                          height: '100%',
                          transform: 'scale(1)',
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden'
                        }}
                        loading="eager"
                        decoding="async"
                        onError={(e) => {
                          e.target.src = selectedImage.s3Key;
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* RIGHT: THÔNG TIN CHI TIẾT */}
                  <div className="space-y-6">
                    {/* MÔ TẢ SẢN PHẨM */}
                    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 md:p-6">
                      <h3 className="text-[14px] font-semibold text-[#111827] mb-2">
                        Mô tả sản phẩm
                      </h3>
                      <p className="text-[13px] text-[#4B5563] leading-relaxed">
                        {selectedImage.category === "template" 
                          ? `Ảnh mẫu ${selectedImage.type ? selectedImage.type.replace(/_/g, " ") : "sản phẩm"} - ${selectedImage.gender === "male" ? "Nam" : selectedImage.gender === "female" ? "Nữ" : "Unisex"}`
                          : `Ảnh ${selectedImage.category} - ${selectedImage.type || "sản phẩm"}`}
                        {selectedImage.tags && selectedImage.tags.length > 0 && (
                          <span className="ml-2">
                            ({selectedImage.tags.join(", ")})
                          </span>
                        )}
                      </p>

                      <div className="mt-4 grid grid-cols-3 gap-3 text-[11px] text-[#4B5563]">
                        <InfoChip label="Thời gian may" value="7–14 ngày" />
                        <InfoChip label="Số lần thử đồ" value="1–2 lần" />
                        <InfoChip label="Bảo hành" value="Chỉnh sửa miễn phí 1 lần" />
                      </div>
                    </div>

                    {/* CHI TIẾT MAY ĐO */}
                    <div className="bg-[#FFF7ED] rounded-2xl border border-[#FED7AA] p-5 md:p-6 shadow-sm">
                      <p className="text-[11px] tracking-[0.25em] uppercase text-[#92400E] mb-2">
                        Chi tiết may đo
                      </p>
                      <div className="grid grid-cols-2 gap-3 text-[12px] text-[#4B5563] mb-3">
                        <DetailRow 
                          label="Form dáng" 
                          value="Ôm nhẹ, tôn eo" 
                        />
                        <DetailRow 
                          label="Độ dài" 
                          value="Qua gối / maxi tùy chọn" 
                        />
                        <DetailRow
                          label="Chất liệu gợi ý"
                          value="Lụa, satin, crepe cao cấp"
                        />
                        <DetailRow 
                          label="Lót trong" 
                          value="Có, chống hằn & thoáng" 
                        />
                        <DetailRow
                          label="Màu sắc"
                          value={
                            selectedImage.tags && selectedImage.tags.length > 0
                              ? selectedImage.tags.filter(t => ["đỏ", "xanh", "trắng", "đen", "vàng", "hồng", "tím", "nâu", "xám"].some(c => t.toLowerCase().includes(c))).join(", ") || "Tùy chọn theo bảng màu tại tiệm"
                              : "Tùy chọn theo bảng màu tại tiệm"
                          }
                        />
                        <DetailRow
                          label="Phụ kiện"
                          value="Có thể phối thêm belt, hoa cài, khăn choàng"
                        />
                      </div>

                      <p className="text-[11px] text-[#92400E] italic">
                        * Nếu bạn có ảnh mẫu yêu thích, hãy mang theo – thợ may sẽ
                        tư vấn xem form và chất liệu đó có phù hợp với dáng của bạn
                        không.
                      </p>
                    </div>

                    {/* PHÙ HỢP VỚI AI / DỊP NÀO */}
                    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5 md:p-6">
                      <h3 className="text-[14px] font-semibold text-[#111827] mb-3">
                        Mẫu này phù hợp với
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4 text-[12px] text-[#4B5563]">
                        <div>
                          <p className="font-medium mb-1">Dịp sử dụng</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Cưới hỏi, lễ kỷ niệm, tiệc tối</li>
                            <li>Chụp ảnh kỷ niệm, pre-wedding</li>
                            <li>Sự kiện cần sự chỉn chu, thanh lịch</li>
                          </ul>
                        </div>
                        <div>
                          <p className="font-medium mb-1">Phong cách khách hàng</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Thích sự nữ tính, mềm mại nhưng không sến</li>
                            <li>Muốn tôn dáng nhưng vẫn di chuyển thoải mái</li>
                            <li>Cần trang phục "đẹp ngoài đời & đẹp trên hình"</li>
                          </ul>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t border-[#E5E7EB] text-[12px] text-[#4B5563]">
                        <p className="font-medium mb-1">Gợi ý bảo quản</p>
                        <ul className="list-disc list-inside space-y-1">
                          <li>Ưu tiên giặt tay hoặc giặt chế độ nhẹ, nước lạnh.</li>
                          <li>Không vắt xoắn mạnh, phơi nơi thoáng mát, tránh nắng gắt.</li>
                          <li>
                            Ủi ở nhiệt độ thấp, dùng khăn lót để bề mặt vải luôn mịn.
                          </li>
                        </ul>
                      </div>
                    </div>
                    
                    {/* THÔNG TIN PHÂN LOẠI */}
                    <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 md:p-6">
                      <h3 className="text-[14px] font-semibold text-[#111827] mb-3">
                        Thông tin phân loại
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <span className="font-medium text-gray-700">Category:</span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                            {selectedImage.category}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                          <span className="font-medium text-gray-700">Type:</span>
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            {selectedImage.type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                          <span className="font-medium text-gray-700">Gender:</span>
                          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium capitalize">
                            {selectedImage.gender || "unisex"}
                          </span>
                        </div>
                        {selectedImage.tags && selectedImage.tags.length > 0 && (
                          <div className="p-3 bg-yellow-50 rounded-lg">
                            <span className="font-medium text-gray-700 block mb-2">Tags:</span>
                            <div className="flex flex-wrap gap-2">
                              {selectedImage.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs"
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
                                <div className="aspect-square relative mb-2 rounded overflow-hidden bg-gray-100">
                                  <OptimizedImage
                                    src={product.image || product.imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
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
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => {
                          if (selectedImage.url) {
                            window.open(selectedImage.url, "_blank");
                          }
                        }}
                        className="w-full px-6 py-3.5 text-[14px] font-medium bg-[#1B4332] text-white rounded-full hover:bg-[#14532d] transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                      >
                        <span>🔗</span>
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
                          className="w-full px-6 py-3.5 text-[14px] font-medium border-2 border-[#1B4332] text-[#1B4332] rounded-full hover:bg-[#1B4332] hover:text-white transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          <span>📦</span>
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
      </div>
    </div>
  );
};

export default ImageUploadPage;

