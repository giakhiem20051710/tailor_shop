import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import flashSaleService from '../services/flashSaleService';

/**
 * Flash Sale Page - Customer View
 * Features: Countdown timer, Real-time stock, Purchase modal
 */
const FlashSalePage = () => {
    const navigate = useNavigate();
    const [activeSales, setActiveSales] = useState([]);
    const [upcomingSales, setUpcomingSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Purchase modal state
    const [selectedSale, setSelectedSale] = useState(null);
    const [purchaseQuantity, setPurchaseQuantity] = useState('');
    const [purchasing, setPurchasing] = useState(false);
    const [purchaseResult, setPurchaseResult] = useState(null);

    // Fetch flash sales
    const fetchSales = useCallback(async () => {
        try {
            const [activeRes, upcomingRes] = await Promise.all([
                flashSaleService.getActiveSales(),
                flashSaleService.getUpcomingSales()
            ]);

            setActiveSales(activeRes.data || []);
            setUpcomingSales(upcomingRes.data || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching flash sales:', err);
            setError('Không thể tải flash sale. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSales();
        // Refresh every 30 seconds
        const interval = setInterval(fetchSales, 30000);
        return () => clearInterval(interval);
    }, [fetchSales]);

    // Handle purchase
    const handlePurchase = async () => {
        if (!selectedSale || !purchaseQuantity) return;

        const quantity = parseFloat(purchaseQuantity);
        if (isNaN(quantity) || quantity <= 0) {
            setPurchaseResult({ success: false, message: 'Số lượng không hợp lệ' });
            return;
        }

        setPurchasing(true);
        try {
            const result = await flashSaleService.purchase(selectedSale.id, { quantity });
            setPurchaseResult(result);

            if (result.success) {
                // Refresh sales data
                fetchSales();
            }
        } catch (err) {
            console.error('Purchase error:', err);
            setPurchaseResult({
                success: false,
                message: err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.'
            });
        } finally {
            setPurchasing(false);
        }
    };

    // Close modal
    const closeModal = () => {
        setSelectedSale(null);
        setPurchaseQuantity('');
        setPurchaseResult(null);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-red-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-red-600 via-red-500 to-orange-500 text-white">
                <div className="max-w-7xl mx-auto px-4 py-12">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="text-4xl animate-bounce">⚡</span>
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">FLASH SALE</h1>
                        <span className="text-4xl animate-bounce">⚡</span>
                    </div>
                    <p className="text-center text-lg text-white/90">
                        Vải cao cấp giá siêu sốc - Số lượng có hạn!
                    </p>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Active Sales */}
                <section className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white text-xl">🔥</span>
                        <h2 className="text-2xl font-bold text-gray-900">Đang diễn ra</h2>
                        <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                            {activeSales.length} sản phẩm
                        </span>
                    </div>

                    {activeSales.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
                            <span className="text-5xl mb-4 block">😢</span>
                            <p className="text-gray-500">Hiện không có flash sale nào đang diễn ra</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeSales.map((sale) => (
                                <FlashSaleCard
                                    key={sale.id}
                                    sale={sale}
                                    onBuy={() => setSelectedSale(sale)}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* Upcoming Sales */}
                {upcomingSales.length > 0 && (
                    <section>
                        <div className="flex items-center gap-3 mb-6">
                            <span className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl">⏰</span>
                            <h2 className="text-2xl font-bold text-gray-900">Sắp diễn ra</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {upcomingSales.map((sale) => (
                                <FlashSaleCard
                                    key={sale.id}
                                    sale={sale}
                                    upcoming={true}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* Purchase Modal */}
            {selectedSale && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-gray-900">Mua Flash Sale</h3>
                                <button
                                    onClick={closeModal}
                                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                                >
                                    ✕
                                </button>
                            </div>

                            {purchaseResult ? (
                                /* Result View */
                                <div className="text-center py-6">
                                    {purchaseResult.success ? (
                                        <>
                                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="text-3xl">✓</span>
                                            </div>
                                            <h4 className="text-xl font-bold text-green-600 mb-2">Đặt hàng thành công!</h4>
                                            <p className="text-gray-600 mb-4">{purchaseResult.message}</p>
                                            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
                                                <p className="text-sm text-gray-500 mb-1">Mã đơn hàng</p>
                                                <p className="font-bold text-lg">{purchaseResult.data?.orderCode}</p>
                                                <p className="text-sm text-gray-500 mt-3 mb-1">Thành tiền</p>
                                                <p className="font-bold text-xl text-red-600">
                                                    {purchaseResult.data?.totalAmount?.toLocaleString('vi-VN')}đ
                                                </p>
                                            </div>
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                                                ⏰ Vui lòng thanh toán trong {Math.ceil(purchaseResult.data?.paymentRemainingSeconds / 60)} phút
                                            </div>
                                            <button
                                                onClick={() => navigate('/flash-sale/orders')}
                                                className="mt-4 w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600"
                                            >
                                                Xem đơn hàng
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="text-3xl">✕</span>
                                            </div>
                                            <h4 className="text-xl font-bold text-red-600 mb-2">Không thể đặt hàng</h4>
                                            <p className="text-gray-600 mb-4">{purchaseResult.message}</p>
                                            <button
                                                onClick={closeModal}
                                                className="w-full py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
                                            >
                                                Đóng
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                /* Purchase Form */
                                <>
                                    {/* Product Info */}
                                    <div className="flex gap-4 mb-6">
                                        <img
                                            src={selectedSale.fabricImage || '/placeholder-fabric.jpg'}
                                            alt={selectedSale.fabricName}
                                            className="w-24 h-24 rounded-lg object-cover"
                                        />
                                        <div>
                                            <h4 className="font-bold text-gray-900">{selectedSale.name}</h4>
                                            <p className="text-sm text-gray-500">{selectedSale.fabricName}</p>
                                            <div className="flex items-baseline gap-2 mt-1">
                                                <span className="text-xl font-bold text-red-600">
                                                    {selectedSale.flashPrice?.toLocaleString('vi-VN')}đ/m
                                                </span>
                                                <span className="text-sm text-gray-400 line-through">
                                                    {selectedSale.originalPrice?.toLocaleString('vi-VN')}đ
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stock Info */}
                                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-500">Còn lại</span>
                                            <span className="font-medium">{selectedSale.availableQuantity} mét</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Bạn có thể mua thêm</span>
                                            <span className="font-medium text-green-600">{selectedSale.userRemainingLimit} mét</span>
                                        </div>
                                    </div>

                                    {/* Quantity Input */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Số lượng (mét)
                                        </label>
                                        <input
                                            type="number"
                                            value={purchaseQuantity}
                                            onChange={(e) => setPurchaseQuantity(e.target.value)}
                                            placeholder={`Tối thiểu ${selectedSale.minPurchase} mét`}
                                            min={selectedSale.minPurchase}
                                            max={Math.min(selectedSale.availableQuantity, selectedSale.userRemainingLimit)}
                                            step="0.5"
                                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                        />
                                    </div>

                                    {/* Total */}
                                    {purchaseQuantity && !isNaN(parseFloat(purchaseQuantity)) && (
                                        <div className="bg-red-50 rounded-lg p-4 mb-6">
                                            <div className="flex justify-between">
                                                <span className="text-gray-700">Thành tiền</span>
                                                <span className="text-2xl font-bold text-red-600">
                                                    {(parseFloat(purchaseQuantity) * selectedSale.flashPrice).toLocaleString('vi-VN')}đ
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm text-green-600 mt-1">
                                                <span>Tiết kiệm</span>
                                                <span>
                                                    {(parseFloat(purchaseQuantity) * (selectedSale.originalPrice - selectedSale.flashPrice)).toLocaleString('vi-VN')}đ
                                                </span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Buy Button */}
                                    <button
                                        onClick={handlePurchase}
                                        disabled={purchasing || !purchaseQuantity}
                                        className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold text-lg
                             hover:from-red-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                                    >
                                        {purchasing ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                Đang xử lý...
                                            </>
                                        ) : (
                                            <>
                                                ⚡ MUA NGAY
                                            </>
                                        )}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * Flash Sale Card Component
 */
const FlashSaleCard = ({ sale, onBuy, upcoming = false }) => {
    const [countdown, setCountdown] = useState('');

    useEffect(() => {
        const updateCountdown = () => {
            const now = new Date().getTime();
            const targetTime = upcoming
                ? new Date(sale.startTime).getTime()
                : new Date(sale.endTime).getTime();

            const diff = targetTime - now;

            if (diff <= 0) {
                setCountdown('00:00:00');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown(
                `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            );
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [sale, upcoming]);

    const soldPercent = sale.soldPercentage || 0;

    return (
        <div className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow
                    ${upcoming ? 'opacity-80' : ''}`}>
            {/* Image */}
            <div className="relative">
                <img
                    src={sale.fabricImage || '/placeholder-fabric.jpg'}
                    alt={sale.fabricName}
                    className="w-full h-48 object-cover"
                />

                {/* Discount Badge */}
                <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full font-bold">
                    -{sale.discountPercent}%
                </div>

                {/* Countdown */}
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm font-mono font-bold
                        ${upcoming ? 'bg-blue-500 text-white' : 'bg-black/70 text-white'}`}>
                    {upcoming ? '⏰ ' : '🔥 '}{countdown}
                </div>

                {/* Sold Out Overlay */}
                {sale.isSoldOut && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <span className="text-white text-2xl font-bold">HẾT HÀNG</span>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4">
                <h3 className="font-bold text-gray-900 mb-1 truncate">{sale.name}</h3>
                <p className="text-sm text-gray-500 mb-3 truncate">{sale.fabricName}</p>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-bold text-red-600">
                        {sale.flashPrice?.toLocaleString('vi-VN')}đ
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                        {sale.originalPrice?.toLocaleString('vi-VN')}đ
                    </span>
                </div>

                {/* Progress Bar */}
                {!upcoming && (
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <span>Đã bán {soldPercent}%</span>
                            <span>Còn {sale.availableQuantity}m</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-red-500 to-orange-400 rounded-full transition-all duration-500"
                                style={{ width: `${soldPercent}%` }}
                            ></div>
                        </div>
                    </div>
                )}

                {/* Action Button */}
                {upcoming ? (
                    <button
                        disabled
                        className="w-full py-3 bg-gray-100 text-gray-500 rounded-xl font-medium"
                    >
                        Chưa bắt đầu
                    </button>
                ) : sale.isSoldOut ? (
                    <button
                        disabled
                        className="w-full py-3 bg-gray-200 text-gray-500 rounded-xl font-medium"
                    >
                        Đã hết hàng
                    </button>
                ) : (
                    <button
                        onClick={onBuy}
                        className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold
                     hover:from-red-600 hover:to-orange-600 transition-all
                     flex items-center justify-center gap-2"
                    >
                        ⚡ MUA NGAY
                    </button>
                )}
            </div>
        </div>
    );
};

export default FlashSalePage;
