import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import pointsService, { POINTS_CONFIG } from '../services/pointsService.js';
import PointsGuidePopup, { PointsInfoCard } from '../components/PointsGuidePopup.jsx';
import { isAuthenticated } from '../utils/authStorage.js';
import { showSuccess, showError } from '../components/NotificationToast.jsx';

/**
 * Daily Check-in Page
 * Beautiful page for users to check in daily and earn points
 */
export default function CheckinPage() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [checking, setChecking] = useState(false);
    const [showGuide, setShowGuide] = useState(false);

    // User data
    const [userPoints, setUserPoints] = useState(0);
    const [streakData, setStreakData] = useState({
        currentStreak: 0,
        longestStreak: 0,
        lastCheckinDate: null,
        canCheckinToday: true
    });
    const [recentCheckins, setRecentCheckins] = useState([]);
    const [showReward, setShowReward] = useState(false);
    const [earnedPoints, setEarnedPoints] = useState(0);

    useEffect(() => {
        document.title = "Điểm danh - My Hiền Tailor";
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            // In production, call API
            // const wallet = await pointsService.getWallet();
            // const status = await pointsService.getCheckinStatus();

            // Mock data for demo
            const today = new Date().toISOString().split('T')[0];
            const mockStreak = {
                currentStreak: 3,
                longestStreak: 7,
                lastCheckinDate: null, // null means can check in today
                totalCheckins: 15,
                canCheckinToday: true
            };

            setUserPoints(320);
            setStreakData(mockStreak);
            setRecentCheckins(generateWeekDays(mockStreak.currentStreak));
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const generateWeekDays = (currentStreak) => {
        const days = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            const dayNum = 7 - i;

            days.push({
                date: date.toISOString().split('T')[0],
                dayOfWeek: date.toLocaleDateString('vi-VN', { weekday: 'short' }),
                dayNum,
                points: POINTS_CONFIG.earn.checkinDays[dayNum - 1] || 10,
                checked: i > 0 && (7 - i <= currentStreak),
                isToday: i === 0,
                isPast: i > 0
            });
        }
        return days;
    };

    const handleCheckin = async () => {
        if (!streakData.canCheckinToday || checking) return;

        try {
            setChecking(true);
            // In production: await pointsService.checkin()

            const newStreak = streakData.currentStreak + 1;
            const todayPoints = POINTS_CONFIG.earn.checkinDays[Math.min(newStreak - 1, 6)] || 10;

            // Show reward animation
            setEarnedPoints(todayPoints);
            setShowReward(true);

            setTimeout(() => {
                setUserPoints(prev => prev + todayPoints);
                setStreakData(prev => ({
                    ...prev,
                    currentStreak: newStreak,
                    longestStreak: Math.max(prev.longestStreak, newStreak),
                    canCheckinToday: false,
                    lastCheckinDate: new Date().toISOString().split('T')[0]
                }));

                // Update week display
                setRecentCheckins(generateWeekDays(newStreak).map((d, i) =>
                    i === 6 ? { ...d, checked: true } : d
                ));

                showSuccess(`+${todayPoints} xu! Streak ${newStreak} ngày 🔥`);
                setShowReward(false);
                setChecking(false);
            }, 2000);

        } catch (error) {
            showError('Không thể điểm danh. Vui lòng thử lại!');
            setChecking(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
                <Header currentPage="/checkin" />
                <div className="pt-[180px] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
                        <p className="mt-4 text-gray-500">Đang tải...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50">
            <Header currentPage="/checkin" />

            <main className="pt-[180px] pb-16 px-4">
                <div className="max-w-lg mx-auto space-y-6">

                    {/* Header */}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            📅 Điểm Danh Hàng Ngày
                        </h1>
                        <p className="text-gray-600 mt-2">Điểm danh mỗi ngày để nhận xu thưởng!</p>
                    </div>

                    {/* Points Card */}
                    <PointsInfoCard
                        points={userPoints}
                        onLearnMore={() => setShowGuide(true)}
                    />

                    {/* Streak Info */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-gray-500 text-sm">Chuỗi điểm danh</p>
                                <p className="text-3xl font-bold text-orange-500">
                                    🔥 {streakData.currentStreak} ngày
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-400 text-xs">Kỷ lục</p>
                                <p className="text-lg font-semibold text-gray-700">
                                    {streakData.longestStreak} ngày
                                </p>
                            </div>
                        </div>

                        {/* Weekly Calendar */}
                        <div className="grid grid-cols-7 gap-2">
                            {recentCheckins.map((day, i) => (
                                <div
                                    key={i}
                                    className={`flex flex-col items-center p-2 rounded-xl transition-all ${day.isToday
                                            ? 'bg-gradient-to-b from-purple-100 to-indigo-100 border-2 border-purple-400'
                                            : day.checked
                                                ? 'bg-green-100'
                                                : 'bg-gray-50'
                                        }`}
                                >
                                    <span className={`text-xs ${day.isToday ? 'text-purple-600 font-bold' : 'text-gray-500'}`}>
                                        {day.dayOfWeek}
                                    </span>
                                    <span className="text-lg my-1">
                                        {day.checked ? '✅' : day.isToday ? '🎁' : '⭕'}
                                    </span>
                                    <span className={`text-xs font-bold ${day.isToday ? 'text-purple-600' : day.checked ? 'text-green-600' : 'text-gray-400'
                                        }`}>
                                        +{day.points}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Check-in Button */}
                    <button
                        onClick={handleCheckin}
                        disabled={!streakData.canCheckinToday || checking}
                        className={`w-full py-5 rounded-2xl font-bold text-xl transition-all shadow-lg ${streakData.canCheckinToday && !checking
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 active:scale-[0.98]'
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {checking ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Đang điểm danh...
                            </span>
                        ) : streakData.canCheckinToday ? (
                            `🎁 Điểm Danh Nhận ${pointsService.getCheckinPoints(streakData.currentStreak + 1)} Xu`
                        ) : (
                            '✅ Đã điểm danh hôm nay'
                        )}
                    </button>

                    {/* Rewards Preview */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4">🎁 Phần thưởng theo ngày</h3>
                        <div className="space-y-2">
                            {POINTS_CONFIG.earn.checkinDays.map((points, i) => {
                                const isCompleted = i < streakData.currentStreak;
                                const isNext = i === streakData.currentStreak;
                                return (
                                    <div
                                        key={i}
                                        className={`flex items-center justify-between p-3 rounded-xl ${isNext
                                                ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200'
                                                : isCompleted
                                                    ? 'bg-green-50'
                                                    : 'bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isCompleted
                                                    ? 'bg-green-500 text-white'
                                                    : isNext
                                                        ? 'bg-purple-500 text-white'
                                                        : 'bg-gray-200 text-gray-500'
                                                }`}>
                                                {isCompleted ? '✓' : i + 1}
                                            </span>
                                            <span className={`font-medium ${isNext ? 'text-purple-700' : 'text-gray-700'}`}>
                                                Ngày {i + 1}
                                                {i === 6 && <span className="ml-2 text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full">BONUS</span>}
                                            </span>
                                        </div>
                                        <span className={`font-bold ${isCompleted ? 'text-green-600' : isNext ? 'text-purple-600' : 'text-gray-500'
                                            }`}>
                                            +{points} xu
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Navigation */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => navigate('/S')}
                            className="py-4 bg-amber-100 text-amber-800 rounded-xl font-semibold hover:bg-amber-200"
                        >
                            🏆 Thử thách
                        </button>
                        <button
                            onClick={() => navigate('/customer/dashboard')}
                            className="py-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200"
                        >
                            📊 Dashboard
                        </button>
                    </div>
                </div>
            </main>

            {/* Reward Animation */}
            {showReward && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="text-center animate-bounce">
                        <div className="text-8xl mb-4">🎉</div>
                        <div className="bg-white rounded-3xl px-10 py-6 shadow-2xl">
                            <p className="text-gray-500 mb-2">Chúc mừng!</p>
                            <p className="text-5xl font-bold text-purple-600">+{earnedPoints} xu</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Guide Popup */}
            <PointsGuidePopup
                isOpen={showGuide}
                onClose={() => setShowGuide(false)}
                userPoints={userPoints}
            />
        </div>
    );
}
