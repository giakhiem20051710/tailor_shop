import { useState } from "react";

export default function SampleImagesDisplay({ images }) {
  const [selectedImage, setSelectedImage] = useState(null);

  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
        Chưa có ảnh mẫu
      </div>
    );
  }

  const imageArray = Array.isArray(images) ? images : [images];

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {imageArray.map((imageUrl, index) => (
          <div
            key={index}
            className="relative group cursor-pointer"
            onClick={() => setSelectedImage(imageUrl)}
          >
            <img
              src={imageUrl}
              alt={`Ảnh mẫu ${index + 1}`}
              className="w-full h-48 object-cover rounded-lg border border-gray-200 hover:border-green-500 transition"
              onError={(e) => {
                e.target.src =
                  "https://via.placeholder.com/300x300?text=Ảnh+không+khả+dụng";
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {/* Full Screen Image Viewer */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <svg
              className="w-8 h-8"
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
          <img
            src={selectedImage}
            alt="Ảnh mẫu phóng to"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

