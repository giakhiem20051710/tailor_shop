import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gamificationService from '../services/gamificationService.js';
import { showSuccess, showError } from '../components/NotificationToast.jsx';

/**
 * Challenge Management Page for Admin
 * CRUD operations for Seasonal Challenges
 */
export default function ChallengeManagementPage() {
    const navigate = useNavigate();
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingChallenge, setEditingChallenge] = useState(null);
    const [filter, setFilter] = useState('all'); // all, active, inactive

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        description: '',
        season: 'TET',
        year: new Date().getFullYear(),
        startDate: '',
        endDate: '',
        challengeType: 'ORDER_COUNT',
        conditionKey: '',
        targetValue: 1,
        rewardPoints: 0,
        rewardType: 'POINTS',
        rewardDescription: '',
        rewardVoucherCode: '',
        rewardVoucherValue: 0,
        displayOrder: 1,
        themeColor: '#C41E3A',
        isGrandPrize: false,
        isActive: true
    });

    useEffect(() => {
        fetchChallenges();
    }, []);

    const fetchChallenges = async () => {
        try {
            setLoading(true);
            const data = await gamificationService.getAllChallenges();
            setChallenges(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch challenges:', err);
            // Use mock data for demo
            setChallenges(getMockChallenges());
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingChallenge) {
                await gamificationService.updateChallenge(editingChallenge.id, formData);
                showSuccess('Đã cập nhật thử thách!');
            } else {
                await gamificationService.createChallenge(formData);
                showSuccess('Đã tạo thử thách mới!');
            }
            setShowForm(false);
            setEditingChallenge(null);
            resetForm();
            fetchChallenges();
        } catch (err) {
            console.error('Error saving challenge:', err);
            showError('Không thể lưu thử thách');
        }
    };

    const handleEdit = (challenge) => {
        setEditingChallenge(challenge);
        setFormData({
            ...challenge,
            startDate: challenge.startDate?.slice(0, 16) || '',
            endDate: challenge.endDate?.slice(0, 16) || ''
        });
        setShowForm(true);
    };

    const handleDeactivate = async (id) => {
        if (!confirm('Bạn có chắc muốn vô hiệu hóa thử thách này?')) return;
        try {
            await gamificationService.deactivateChallenge(id);
            showSuccess('Đã vô hiệu hóa thử thách');
            fetchChallenges();
        } catch (err) {
            showError('Không thể vô hiệu hóa');
        }
    };

    const resetForm = () => {
        setFormData({
            code: '',
            name: '',
            description: '',
            season: 'TET',
            year: new Date().getFullYear(),
            startDate: '',
            endDate: '',
            challengeType: 'ORDER_COUNT',
            conditionKey: '',
            targetValue: 1,
            rewardPoints: 0,
            rewardType: 'POINTS',
            rewardDescription: '',
            rewardVoucherCode: '',
            rewardVoucherValue: 0,
            displayOrder: 1,
            themeColor: '#C41E3A',
            isGrandPrize: false,
            isActive: true
        });
    };

    const filteredChallenges = challenges.filter(c => {
        if (filter === 'active') return c.isActive;
        if (filter === 'inactive') return !c.isActive;
        return true;
    });

    const getChallengeTypeLabel = (type) => {
        const types = {
            ORDER_COUNT: '🛒 Số đơn hàng',
            ORDER_VALUE: '💰 Giá trị đơn',
            PRODUCT_CATEGORY: '👔 Danh mục SP',
            FABRIC_PURCHASE: '🧵 Mua vải',
            REVIEW_COUNT: '⭐ Đánh giá',
            REFERRAL_COUNT: '👥 Giới thiệu',
            CHECKIN_STREAK: '📅 Check-in',
            COMBO: '🏆 Kết hợp'
        };
        return types[type] || type;
    };

    const getSeasonLabel = (season) => {
        const seasons = {
            TET: '🧧 Tết',
            VALENTINE: '💝 Valentine',
            WOMEN_DAY: '🌸 8/3',
            SUMMER: '☀️ Mùa Hè',
            MID_AUTUMN: '🥮 Trung Thu',
            HALLOWEEN: '🎃 Halloween',
            CHRISTMAS: '🎄 Giáng Sinh',
            NEW_YEAR: '🎊 Năm Mới'
        };
        return seasons[season] || season;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">🎯 Quản lý Thử thách</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Tạo và quản lý các thử thách theo mùa để thu hút khách hàng
                    </p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingChallenge(null); resetForm(); }}
                    className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg"
                >
                    + Tạo thử thách mới
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                    <p className="text-gray-500 text-sm">Tổng thử thách</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{challenges.length}</p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-green-100">
                    <p className="text-gray-500 text-sm">Đang hoạt động</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">
                        {challenges.filter(c => c.isActive).length}
                    </p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100">
                    <p className="text-gray-500 text-sm">Grand Prize</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">
                        {challenges.filter(c => c.isGrandPrize).length}
                    </p>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-purple-100">
                    <p className="text-gray-500 text-sm">Tổng tiền thưởng</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">
                        {challenges.reduce((sum, c) => sum + (c.rewardPoints || 0), 0).toLocaleString()} xu
                    </p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                {['all', 'active', 'inactive'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === f
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {f === 'all' ? 'Tất cả' : f === 'active' ? 'Hoạt động' : 'Đã tắt'}
                    </button>
                ))}
            </div>

            {/* Challenges List */}
            {loading ? (
                <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-500 mt-4">Đang tải...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Thử thách</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Mùa</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Loại</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Mục tiêu</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Phần thưởng</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Trạng thái</th>
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredChallenges.map(challenge => (
                                <tr key={challenge.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                                style={{ backgroundColor: challenge.themeColor + '20' }}
                                            >
                                                {challenge.isGrandPrize ? '🏆' : '🎯'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{challenge.name}</p>
                                                <p className="text-xs text-gray-500">{challenge.code}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-sm">{getSeasonLabel(challenge.season)}</td>
                                    <td className="px-4 py-4 text-sm">{getChallengeTypeLabel(challenge.challengeType)}</td>
                                    <td className="px-4 py-4 text-sm font-medium text-gray-700">
                                        {challenge.targetValue?.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm">
                                            {challenge.rewardPoints ? `${challenge.rewardPoints} xu` : ''}
                                            {challenge.rewardDescription ? ` ${challenge.rewardDescription}` : ''}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${challenge.isActive
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {challenge.isActive ? 'Hoạt động' : 'Đã tắt'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <button
                                            onClick={() => handleEdit(challenge)}
                                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-3"
                                        >
                                            Sửa
                                        </button>
                                        {challenge.isActive && (
                                            <button
                                                onClick={() => handleDeactivate(challenge.id)}
                                                className="text-red-600 hover:text-red-800 text-sm font-medium"
                                            >
                                                Tắt
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Create/Edit Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-800">
                                {editingChallenge ? 'Sửa thử thách' : '✨ Tạo thử thách mới'}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mã code</label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="VD: TET_2026_FIRST_ORDER"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên thử thách</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        placeholder="VD: Đơn Hàng Đầu Xuân"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    rows={2}
                                    placeholder="Mô tả ngắn về thử thách"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mùa</label>
                                    <select
                                        value={formData.season}
                                        onChange={e => setFormData({ ...formData, season: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="TET">🧧 Tết</option>
                                        <option value="VALENTINE">💝 Valentine</option>
                                        <option value="WOMEN_DAY">🌸 Ngày 8/3</option>
                                        <option value="SUMMER">☀️ Mùa Hè</option>
                                        <option value="MID_AUTUMN">🥮 Trung Thu</option>
                                        <option value="CHRISTMAS">🎄 Giáng Sinh</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Năm</label>
                                    <input
                                        type="number"
                                        value={formData.year}
                                        onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại thử thách</label>
                                    <select
                                        value={formData.challengeType}
                                        onChange={e => setFormData({ ...formData, challengeType: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="ORDER_COUNT">Số đơn hàng</option>
                                        <option value="ORDER_VALUE">Giá trị đơn</option>
                                        <option value="PRODUCT_CATEGORY">Danh mục SP</option>
                                        <option value="REVIEW_COUNT">Số đánh giá</option>
                                        <option value="REFERRAL_COUNT">Giới thiệu</option>
                                        <option value="COMBO">Kết hợp</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.startDate}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.endDate}
                                        onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mục tiêu</label>
                                    <input
                                        type="number"
                                        value={formData.targetValue}
                                        onChange={e => setFormData({ ...formData, targetValue: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Điểm thưởng (xu)</label>
                                    <input
                                        type="number"
                                        value={formData.rewardPoints}
                                        onChange={e => setFormData({ ...formData, rewardPoints: parseInt(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả phần thưởng</label>
                                <input
                                    type="text"
                                    value={formData.rewardDescription}
                                    onChange={e => setFormData({ ...formData, rewardDescription: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    placeholder="VD: Voucher giảm 15% + 200 xu"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Màu theme</label>
                                    <input
                                        type="color"
                                        value={formData.themeColor}
                                        onChange={e => setFormData({ ...formData, themeColor: e.target.value })}
                                        className="w-full h-10 px-1 border border-gray-300 rounded-lg cursor-pointer"
                                    />
                                </div>
                                <div className="flex items-center gap-4 pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isGrandPrize}
                                            onChange={e => setFormData({ ...formData, isGrandPrize: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">🏆 Grand Prize</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Kích hoạt</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700"
                                >
                                    {editingChallenge ? 'Cập nhật' : 'Tạo thử thách'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowForm(false); setEditingChallenge(null); }}
                                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200"
                                >
                                    Hủy
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Mock data for demo (when API not available)
function getMockChallenges() {
    return [
        {
            id: 1,
            code: 'TET_2026_FIRST_ORDER',
            name: 'Đơn Hàng Đầu Xuân',
            description: 'Đặt 1 đơn hàng trong dịp Tết',
            season: 'TET',
            year: 2026,
            challengeType: 'ORDER_COUNT',
            targetValue: 1,
            rewardPoints: 200,
            rewardDescription: '200 xu',
            themeColor: '#C41E3A',
            isGrandPrize: false,
            isActive: true
        },
        {
            id: 2,
            code: 'TET_2026_AO_DAI',
            name: 'Sưu Tầm Áo Dài',
            description: 'Mua 1 sản phẩm Áo Dài',
            season: 'TET',
            year: 2026,
            challengeType: 'PRODUCT_CATEGORY',
            targetValue: 1,
            rewardPoints: null,
            rewardDescription: 'Badge "Người Yêu Áo Dài"',
            themeColor: '#C41E3A',
            isGrandPrize: false,
            isActive: true
        },
        {
            id: 3,
            code: 'TET_2026_SPEND_2M',
            name: 'Lì Xì Cho Bản Thân',
            description: 'Chi tiêu 2.000.000đ trong dịp Tết',
            season: 'TET',
            year: 2026,
            challengeType: 'ORDER_VALUE',
            targetValue: 2000000,
            rewardPoints: 500,
            rewardDescription: 'Voucher 15%',
            themeColor: '#C41E3A',
            isGrandPrize: false,
            isActive: true
        },
        {
            id: 4,
            code: 'TET_2026_REVIEW',
            name: 'Review Chúc Xuân',
            description: 'Viết 2 đánh giá sản phẩm',
            season: 'TET',
            year: 2026,
            challengeType: 'REVIEW_COUNT',
            targetValue: 2,
            rewardPoints: 150,
            rewardDescription: '150 xu',
            themeColor: '#C41E3A',
            isGrandPrize: false,
            isActive: true
        },
        {
            id: 5,
            code: 'TET_2026_GRAND_PRIZE',
            name: 'Tết Master 2026',
            description: 'Hoàn thành tất cả thử thách Tết',
            season: 'TET',
            year: 2026,
            challengeType: 'COMBO',
            targetValue: 4,
            rewardPoints: 1000,
            rewardDescription: 'Badge Legendary + 1000 xu',
            themeColor: '#FFD700',
            isGrandPrize: true,
            isActive: true
        }
    ];
}
