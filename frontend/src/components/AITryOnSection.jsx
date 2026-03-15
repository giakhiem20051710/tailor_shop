/**
 * AI Try-On Section Component
 * Integrates with FastAPI backend for AI-powered virtual try-on
 */

import { useState, useRef, useCallback } from "react";
import { tryOnService } from "../services/tryOnService.js";

export default function AITryOnSection({ products = [], onSelectProduct }) {
    const [personImage, setPersonImage] = useState(null);
    const [personImageUrl, setPersonImageUrl] = useState(null);
    const [garmentImage, setGarmentImage] = useState(null);
    const [garmentImageUrl, setGarmentImageUrl] = useState(null);
    const [resultImage, setResultImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState(null);
    const [serviceStatus, setServiceStatus] = useState(null);
    const [processingTime, setProcessingTime] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState("upper_body");

    const personInputRef = useRef(null);
    const garmentInputRef = useRef(null);

    // Check service health on mount
    useState(() => {
        checkServiceHealth();
    }, []);

    const checkServiceHealth = async () => {
        try {
            const health = await tryOnService.checkHealth();
            setServiceStatus(health);
        } catch (err) {
            setServiceStatus({ status: "unavailable" });
        }
    };

    const handlePersonImageSelect = useCallback((event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Vui long chon file anh");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError("File anh qua lon (max 10MB)");
            return;
        }

        setPersonImage(file);
        setPersonImageUrl(URL.createObjectURL(file));
        setResultImage(null);
        setError(null);
    }, []);

    const handleGarmentImageSelect = useCallback((event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setError("Vui long chon file anh");
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            setError("File anh qua lon (max 10MB)");
            return;
        }

        setGarmentImage(file);
        setGarmentImageUrl(URL.createObjectURL(file));
        setResultImage(null);
        setError(null);
    }, []);

    const handleSelectProductAsGarment = useCallback((product) => {
        // Create a fetch request to get the product image as a file
        fetch(product.image)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], "garment.jpg", { type: "image/jpeg" });
                setGarmentImage(file);
                setGarmentImageUrl(product.image);
                setResultImage(null);
                setError(null);
                if (onSelectProduct) onSelectProduct(product);
            })
            .catch(err => {
                console.error("Failed to load product image:", err);
                setError("Khong the tai anh san pham");
            });
    }, [onSelectProduct]);

    const handleTryOn = async () => {
        if (!personImage || !garmentImage) {
            setError("Vui long chon ca anh nguoi va anh quan ao");
            return;
        }

        setIsProcessing(true);
        setError(null);
        setResultImage(null);
        setProcessingTime(null);

        const startTime = Date.now();

        try {
            const resultBlob = await tryOnService.tryOn(personImage, garmentImage, selectedCategory);
            const resultUrl = tryOnService.blobToUrl(resultBlob);
            setResultImage(resultUrl);
            setProcessingTime(((Date.now() - startTime) / 1000).toFixed(2));
        } catch (err) {
            console.error("Try-on failed:", err);
            setError(err.message || "Thu ao that bai. Vui long thu lai.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDownloadResult = () => {
        if (!resultImage) return;

        const link = document.createElement("a");
        link.href = resultImage;
        link.download = `tryon-result-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleReset = () => {
        setPersonImage(null);
        setPersonImageUrl(null);
        setGarmentImage(null);
        setGarmentImageUrl(null);
        setResultImage(null);
        setError(null);
        setProcessingTime(null);
        if (personInputRef.current) personInputRef.current.value = "";
        if (garmentInputRef.current) garmentInputRef.current.value = "";
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">AI Virtual Try-On</h2>
                    <p className="text-sm text-slate-500">Upload anh de thu ao bang AI</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${serviceStatus?.status === "healthy" ? "bg-green-500" : "bg-red-500"}`}></span>
                    <span className="text-xs text-slate-500">
                        {serviceStatus?.status === "healthy" ? "Service san sang" : "Service khong kha dung"}
                    </span>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
                    <p className="font-semibold">Loi</p>
                    <p>{error}</p>
                    <button onClick={() => setError(null)} className="mt-2 text-xs underline">Dong</button>
                </div>
            )}

            {/* Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Person Image Upload */}
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-slate-700 mb-2">Anh cua ban</label>
                    <div
                        className="relative bg-slate-100 rounded-xl overflow-hidden cursor-pointer hover:bg-slate-200 transition-colors"
                        style={{ aspectRatio: "3/4" }}
                        onClick={() => personInputRef.current?.click()}
                    >
                        {personImageUrl ? (
                            <img src={personImageUrl} alt="Person" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span className="text-sm">Chon anh nguoi</span>
                                <span className="text-xs text-slate-400 mt-1">Full body, nen don gian</span>
                            </div>
                        )}
                    </div>
                    <input
                        ref={personInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePersonImageSelect}
                        className="hidden"
                    />
                </div>

                {/* Garment Image Upload */}
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-slate-700 mb-2">Quan ao muon thu</label>
                    <div
                        className="relative bg-slate-100 rounded-xl overflow-hidden cursor-pointer hover:bg-slate-200 transition-colors"
                        style={{ aspectRatio: "3/4" }}
                        onClick={() => garmentInputRef.current?.click()}
                    >
                        {garmentImageUrl ? (
                            <img src={garmentImageUrl} alt="Garment" className="w-full h-full object-cover" />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm">Chon anh quan ao</span>
                                <span className="text-xs text-slate-400 mt-1">Hoac chon tu danh sach</span>
                            </div>
                        )}
                    </div>
                    <input
                        ref={garmentInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleGarmentImageSelect}
                        className="hidden"
                    />
                </div>

                {/* Result Display */}
                <div className="flex flex-col">
                    <label className="text-sm font-medium text-slate-700 mb-2">Ket qua</label>
                    <div
                        className="relative bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl overflow-hidden"
                        style={{ aspectRatio: "3/4" }}
                    >
                        {isProcessing ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <span className="text-sm text-slate-600">Dang xu ly...</span>
                                <span className="text-xs text-slate-400 mt-1">Co the mat 30-60 giay</span>
                            </div>
                        ) : resultImage ? (
                            <>
                                <img src={resultImage} alt="Result" className="w-full h-full object-cover" />
                                {processingTime && (
                                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                                        {processingTime}s
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                                <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm">Ket qua se hien o day</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Category Selection */}
            <div className="mt-6">
                <label className="text-sm font-medium text-slate-700 mb-2 block">Loai quan ao</label>
                <div className="flex gap-2">
                    {[
                        { value: "upper_body", label: "Ao (upper)" },
                        { value: "lower_body", label: "Quan (lower)" },
                        { value: "full_body", label: "Full body" },
                    ].map(cat => (
                        <button
                            key={cat.value}
                            onClick={() => setSelectedCategory(cat.value)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat.value
                                    ? "bg-purple-600 text-white"
                                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-6">
                <button
                    onClick={handleTryOn}
                    disabled={!personImage || !garmentImage || isProcessing}
                    className={`flex-1 py-3 px-6 rounded-xl font-semibold text-white transition-all ${!personImage || !garmentImage || isProcessing
                            ? "bg-slate-300 cursor-not-allowed"
                            : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl"
                        }`}
                >
                    {isProcessing ? "Dang xu ly..." : "Thu ngay"}
                </button>

                {resultImage && (
                    <button
                        onClick={handleDownloadResult}
                        className="py-3 px-6 rounded-xl font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                        Tai anh
                    </button>
                )}

                <button
                    onClick={handleReset}
                    className="py-3 px-6 rounded-xl font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
                >
                    Lam moi
                </button>
            </div>

            {/* Product Grid for Quick Selection */}
            {products.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Chon nhanh tu catalog</h3>
                    <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                        {products.slice(0, 12).map(product => (
                            <div
                                key={product.id}
                                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-purple-500 transition-all"
                                onClick={() => handleSelectProductAsGarment(product)}
                            >
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity flex items-end p-2">
                                    <span className="text-white text-xs font-medium truncate">{product.name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Service Info */}
            {serviceStatus && (
                <div className="mt-6 text-xs text-slate-400 flex items-center gap-4">
                    <span>GPU: {serviceStatus.gpu_available ? "Co" : "Khong (CPU mode)"}</span>
                    <span>Model: {serviceStatus.model_loaded ? "San sang" : "Dang tai..."}</span>
                    <span>Version: {serviceStatus.version}</span>
                </div>
            )}
        </div>
    );
}
