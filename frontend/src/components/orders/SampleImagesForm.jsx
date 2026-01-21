import { useState, useRef } from "react";

export default function SampleImagesForm({ images, onChange }) {
  const [imageUrl, setImageUrl] = useState("");
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const imageArray = Array.isArray(images) ? images : images ? [images] : [];

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      const newImages = [...imageArray, imageUrl.trim()];
      onChange(newImages);
      setImageUrl("");
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);

    try {
      const newImages = [...imageArray];
      
      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`File ${file.name} không phải là ảnh. Vui lòng chọn file ảnh.`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`File ${file.name} quá lớn. Vui lòng chọn file nhỏ hơn 5MB.`);
          continue;
        }

        // Convert to base64
        const base64 = await fileToBase64(file);
        newImages.push(base64);
      }

      onChange(newImages.length > 0 ? newImages : null);
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Có lỗi xảy ra khi upload ảnh. Vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleRemoveImage = (index) => {
    const newImages = imageArray.filter((_, i) => i !== index);
    onChange(newImages.length > 0 ? newImages : null);
  };

  const isBase64Image = (str) => {
    return str && (str.startsWith('data:image/') || str.startsWith('/9j/') || str.startsWith('iVBORw0KGgo'));
  };

  return (
    <div className="border border-gray-200 rounded-xl p-6 bg-gray-50">
      <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <svg
          className="w-5 h-5 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Ảnh mẫu
      </h3>

      {/* Upload from Computer */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload ảnh từ máy tính
        </label>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className={`flex-1 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition text-center ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-sm text-gray-600">
                {uploading ? "Đang upload..." : "Chọn ảnh từ máy tính (có thể chọn nhiều ảnh)"}
              </span>
            </div>
          </label>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Hỗ trợ: JPG, PNG, GIF. Tối đa 5MB mỗi ảnh
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-4">
        <div className="flex-1 border-t border-gray-300"></div>
        <span className="text-sm text-gray-500">hoặc</span>
        <div className="flex-1 border-t border-gray-300"></div>
      </div>

      {/* Add Image by URL */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Thêm ảnh từ URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            className="flex-1 p-2 border rounded-lg focus:ring-green-500 focus:border-green-500"
            placeholder="Nhập URL ảnh mẫu (ví dụ: https://example.com/image.jpg)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddImage();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddImage}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Thêm URL
          </button>
        </div>
      </div>

      {/* Image Preview Grid */}
      {imageArray.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {imageArray.map((imageSrc, index) => (
            <div key={index} className="relative group">
              <img
                src={imageSrc}
                alt={`Ảnh mẫu ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  e.target.src =
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Crect fill='%23f3f4f6' width='300' height='300'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='14' fill='%239ca3af' text-anchor='middle' dominant-baseline='middle'%3EẢnh không khả dụng%3C/text%3E%3C/svg%3E";
                }}
              />
              <div className="absolute top-2 left-2">
                {isBase64Image(imageSrc) ? (
                  <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded">
                    Upload
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-gray-500 text-white text-xs rounded">
                    URL
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveImage(index)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition opacity-0 group-hover:opacity-100"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {imageArray.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          Chưa có ảnh mẫu. Upload ảnh từ máy tính hoặc thêm URL ảnh.
        </p>
      )}
    </div>
  );
}

