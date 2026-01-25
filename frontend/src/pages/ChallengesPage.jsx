import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import usePageMeta from '../hooks/usePageMeta';
import gamificationService from '../services/gamificationService.js';
import { isAuthenticated } from '../utils/authStorage.js';

/**
 * Seasonal Challenges Page
 * Displays seasonal challenges with Tết theme
 */
function ChallengesPage() {
    usePageMeta({
        title: 'Thử Thách Theo Mùa',
        description: 'Hoàn thành thử thách và nhận thưởng hấp dẫn'
    });

    const navigate = useNavigate();
    const [challenges, setChallenges] = useState([]);
    const [seasonData, setSeasonData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [claiming, setClaiming] = useState(null);
    const [countdown, setCountdown] = useState('');

    // Fetch challenges on mount
    useEffect(() => {
        fetchChallenges();
    }, []);

    // Countdown timer
    useEffect(() => {
        if (!seasonData?.remainingTimeMillis) return;

        const timer = setInterval(() => {
            setCountdown(gamificationService.formatRemainingTime(seasonData.remainingTimeMillis));
        }, 1000);

        return () => clearInterval(timer);
    }, [seasonData]);

    const fetchChallenges = async () => {
        try {
            setLoading(true);
            if (isAuthenticated()) {
                // Fetch with user progress
                const data = await gamificationService.getMyProgress();
                setChallenges(Array.isArray(data) ? data : []);
            } else {
                // Fetch public challenges
                const data = await gamificationService.getActiveChallenges();
                setChallenges(Array.isArray(data) ? data : []);
            }

            // Fetch season data
            try {
                const season = await gamificationService.getChallengesBySeason('TET', 2026);
                setSeasonData(season);
            } catch (e) {
                console.log('No season data available');
            }
        } catch (err) {
            console.error('Failed to fetch challenges:', err);
            setError('Không thể tải thử thách. Vui lòng thử lại sau.');
        } finally {
            setLoading(false);
        }
    };

    const handleClaimReward = async (challengeId) => {
        if (!isAuthenticated()) {
            navigate('/login');
            return;
        }

        try {
            setClaiming(challengeId);
            const result = await gamificationService.claimReward(challengeId);
            if (result.success) {
                // Refresh challenges to update progress
                await fetchChallenges();
                alert(`🎉 ${result.message}\n${result.rewardDescription || ''}`);
            }
        } catch (err) {
            console.error('Failed to claim reward:', err);
            alert('Không thể nhận thưởng. Vui lòng thử lại.');
        } finally {
            setClaiming(null);
        }
    };

    const getProgressBarColor = (percentage) => {
        if (percentage >= 100) return '#22C55E';
        if (percentage >= 75) return '#84CC16';
        if (percentage >= 50) return '#FACC15';
        if (percentage >= 25) return '#FB923C';
        return '#EF4444';
    };

    const getChallengeTypeIcon = (type) => {
        const icons = {
            ORDER_COUNT: '🛒',
            ORDER_VALUE: '💰',
            PRODUCT_CATEGORY: '👔',
            FABRIC_PURCHASE: '🧵',
            REVIEW_COUNT: '⭐',
            REFERRAL_COUNT: '👥',
            CHECKIN_STREAK: '📅',
            COMBO: '🏆'
        };
        return icons[type] || '🎯';
    };

    return (
        <div className="challenges-page" style={styles.page}>
            <Header currentPage="challenges" />

            {/* Hero Banner - Tết Theme */}
            <section style={styles.heroBanner}>
                <div style={styles.heroOverlay}></div>
                <div style={styles.heroContent}>
                    <div style={styles.heroEmoji}>🧧</div>
                    <h1 style={styles.heroTitle}>Thử Thách Tết 2026</h1>
                    <p style={styles.heroSubtitle}>
                        Hoàn thành thử thách, nhận lì xì may mắn!
                    </p>
                    {countdown && (
                        <div style={styles.countdown}>
                            <span style={styles.countdownLabel}>⏰ Còn lại:</span>
                            <span style={styles.countdownTime}>{countdown}</span>
                        </div>
                    )}
                </div>

                {/* Decorative elements */}
                <div style={styles.decoration1}>🏮</div>
                <div style={styles.decoration2}>🎊</div>
                <div style={styles.decoration3}>💐</div>
            </section>

            {/* Grand Prize Section */}
            {seasonData?.grandPrize && (
                <section style={styles.grandPrizeSection}>
                    <div style={styles.grandPrizeCard}>
                        <div style={styles.grandPrizeIcon}>🏆</div>
                        <div style={styles.grandPrizeInfo}>
                            <h3 style={styles.grandPrizeTitle}>{seasonData.grandPrize.name}</h3>
                            <p style={styles.grandPrizeDesc}>{seasonData.grandPrize.description}</p>
                            <div style={styles.grandPrizeReward}>
                                <span>🎁 {seasonData.grandPrize.rewardDescription}</span>
                            </div>
                            <div style={styles.grandPrizeProgress}>
                                <span>Tiến độ: {seasonData.completedChallenges || 0} / {seasonData.totalChallenges || 0} thử thách</span>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Main Content */}
            <main style={styles.main}>
                {loading ? (
                    <div style={styles.loading}>
                        <div style={styles.spinner}></div>
                        <p>Đang tải thử thách...</p>
                    </div>
                ) : error ? (
                    <div style={styles.error}>
                        <span>⚠️</span>
                        <p>{error}</p>
                        <button onClick={fetchChallenges} style={styles.retryBtn}>
                            Thử lại
                        </button>
                    </div>
                ) : challenges.length === 0 ? (
                    <div style={styles.empty}>
                        <span style={styles.emptyIcon}>🎯</span>
                        <h3>Chưa có thử thách nào</h3>
                        <p>Hãy quay lại sau để khám phá các thử thách mới!</p>
                    </div>
                ) : (
                    <div style={styles.challengesGrid}>
                        {challenges.map(challenge => (
                            <div
                                key={challenge.id}
                                style={{
                                    ...styles.challengeCard,
                                    ...(challenge.isCompleted ? styles.completedCard : {}),
                                    borderColor: challenge.themeColor || '#C41E3A'
                                }}
                            >
                                {/* Badge for completed */}
                                {challenge.isCompleted && (
                                    <div style={styles.completedBadge}>✓ Hoàn thành</div>
                                )}

                                {/* Challenge Header */}
                                <div style={styles.cardHeader}>
                                    <span style={styles.typeIcon}>
                                        {getChallengeTypeIcon(challenge.challengeType)}
                                    </span>
                                    <h3 style={styles.cardTitle}>{challenge.name}</h3>
                                </div>

                                {/* Description */}
                                <p style={styles.cardDesc}>{challenge.description}</p>

                                {/* Progress Bar */}
                                <div style={styles.progressContainer}>
                                    <div style={styles.progressBar}>
                                        <div
                                            style={{
                                                ...styles.progressFill,
                                                width: `${Math.min(challenge.progressPercentage || 0, 100)}%`,
                                                backgroundColor: getProgressBarColor(challenge.progressPercentage || 0)
                                            }}
                                        ></div>
                                    </div>
                                    <div style={styles.progressText}>
                                        <span>{challenge.currentProgress || 0} / {challenge.targetValue}</span>
                                        <span>{challenge.progressPercentage || 0}%</span>
                                    </div>
                                </div>

                                {/* Reward */}
                                <div style={styles.rewardSection}>
                                    <div style={styles.rewardLabel}>🎁 Phần thưởng:</div>
                                    <div style={styles.rewardValue}>
                                        {challenge.rewardPoints && <span>+{challenge.rewardPoints} xu </span>}
                                        {challenge.rewardDescription || challenge.rewardVoucherCode}
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div style={styles.cardFooter}>
                                    {challenge.rewardClaimed ? (
                                        <div style={styles.claimedStatus}>
                                            ✓ Đã nhận thưởng
                                        </div>
                                    ) : challenge.isCompleted ? (
                                        <button
                                            style={styles.claimBtn}
                                            onClick={() => handleClaimReward(challenge.id)}
                                            disabled={claiming === challenge.id}
                                        >
                                            {claiming === challenge.id ? 'Đang xử lý...' : '🎉 Nhận Thưởng'}
                                        </button>
                                    ) : (
                                        <div style={styles.inProgress}>
                                            Đang thực hiện...
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* How It Works Section */}
            <section style={styles.howItWorks}>
                <h2 style={styles.sectionTitle}>Cách Tham Gia</h2>
                <div style={styles.stepsGrid}>
                    <div style={styles.step}>
                        <div style={styles.stepNumber}>1</div>
                        <h4>Xem thử thách</h4>
                        <p>Khám phá các thử thách đang diễn ra</p>
                    </div>
                    <div style={styles.step}>
                        <div style={styles.stepNumber}>2</div>
                        <h4>Hoàn thành</h4>
                        <p>Mua sắm, đánh giá để hoàn thành</p>
                    </div>
                    <div style={styles.step}>
                        <div style={styles.stepNumber}>3</div>
                        <h4>Nhận thưởng</h4>
                        <p>Nhấn nút nhận thưởng khi hoàn thành</p>
                    </div>
                </div>
            </section>
        </div>
    );
}

// Styles
const styles = {
    page: {
        minHeight: '100vh',
        backgroundColor: '#FDF2F2',
        fontFamily: "'Inter', sans-serif"
    },

    // Hero Banner
    heroBanner: {
        position: 'relative',
        background: 'linear-gradient(135deg, #C41E3A 0%, #8B0000 50%, #C41E3A 100%)',
        padding: '80px 20px',
        textAlign: 'center',
        overflow: 'hidden'
    },
    heroOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.3
    },
    heroContent: {
        position: 'relative',
        zIndex: 2
    },
    heroEmoji: {
        fontSize: '64px',
        marginBottom: '16px',
        animation: 'bounce 2s infinite'
    },
    heroTitle: {
        color: '#FFD700',
        fontSize: '42px',
        fontWeight: 'bold',
        marginBottom: '12px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
    },
    heroSubtitle: {
        color: '#FFFFFF',
        fontSize: '18px',
        marginBottom: '20px'
    },
    countdown: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: '12px 24px',
        borderRadius: '50px',
        backdropFilter: 'blur(5px)'
    },
    countdownLabel: {
        color: '#FFFFFF',
        fontSize: '14px'
    },
    countdownTime: {
        color: '#FFD700',
        fontSize: '20px',
        fontWeight: 'bold'
    },
    decoration1: {
        position: 'absolute',
        top: '20px',
        left: '10%',
        fontSize: '48px',
        animation: 'float 3s ease-in-out infinite'
    },
    decoration2: {
        position: 'absolute',
        top: '40px',
        right: '15%',
        fontSize: '40px',
        animation: 'float 3.5s ease-in-out infinite'
    },
    decoration3: {
        position: 'absolute',
        bottom: '20px',
        right: '10%',
        fontSize: '36px',
        animation: 'float 2.5s ease-in-out infinite'
    },

    // Grand Prize
    grandPrizeSection: {
        padding: '30px 20px',
        backgroundColor: '#FFFBEB'
    },
    grandPrizeCard: {
        display: 'flex',
        alignItems: 'center',
        gap: '24px',
        maxWidth: '800px',
        margin: '0 auto',
        padding: '24px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(196, 30, 58, 0.15)',
        border: '2px solid #FFD700'
    },
    grandPrizeIcon: {
        fontSize: '64px',
        flexShrink: 0
    },
    grandPrizeInfo: {
        flex: 1
    },
    grandPrizeTitle: {
        color: '#C41E3A',
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '8px'
    },
    grandPrizeDesc: {
        color: '#6B7280',
        fontSize: '14px',
        marginBottom: '12px'
    },
    grandPrizeReward: {
        color: '#D97706',
        fontSize: '16px',
        fontWeight: '600',
        marginBottom: '8px'
    },
    grandPrizeProgress: {
        color: '#4B5563',
        fontSize: '14px'
    },

    // Main
    main: {
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '40px 20px'
    },

    // Loading, Error, Empty states
    loading: {
        textAlign: 'center',
        padding: '60px 20px'
    },
    spinner: {
        width: '48px',
        height: '48px',
        border: '4px solid #E5E7EB',
        borderTopColor: '#C41E3A',
        borderRadius: '50%',
        margin: '0 auto 16px',
        animation: 'spin 1s linear infinite'
    },
    error: {
        textAlign: 'center',
        padding: '60px 20px',
        color: '#EF4444'
    },
    retryBtn: {
        marginTop: '16px',
        padding: '10px 24px',
        backgroundColor: '#C41E3A',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px'
    },
    empty: {
        textAlign: 'center',
        padding: '60px 20px',
        color: '#6B7280'
    },
    emptyIcon: {
        fontSize: '64px',
        display: 'block',
        marginBottom: '16px'
    },

    // Challenges Grid
    challengesGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '24px'
    },
    challengeCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        border: '2px solid',
        transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative',
        overflow: 'hidden'
    },
    completedCard: {
        backgroundColor: '#F0FDF4'
    },
    completedBadge: {
        position: 'absolute',
        top: '12px',
        right: '-30px',
        backgroundColor: '#22C55E',
        color: '#FFFFFF',
        padding: '4px 40px',
        fontSize: '12px',
        fontWeight: 'bold',
        transform: 'rotate(45deg)'
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '12px'
    },
    typeIcon: {
        fontSize: '32px'
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#1F2937',
        margin: 0
    },
    cardDesc: {
        color: '#6B7280',
        fontSize: '14px',
        marginBottom: '20px',
        minHeight: '40px'
    },

    // Progress
    progressContainer: {
        marginBottom: '20px'
    },
    progressBar: {
        height: '12px',
        backgroundColor: '#E5E7EB',
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '8px'
    },
    progressFill: {
        height: '100%',
        borderRadius: '6px',
        transition: 'width 0.5s ease-out'
    },
    progressText: {
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '13px',
        color: '#6B7280'
    },

    // Reward
    rewardSection: {
        backgroundColor: '#FFFBEB',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px'
    },
    rewardLabel: {
        fontSize: '12px',
        color: '#92400E',
        marginBottom: '4px'
    },
    rewardValue: {
        fontSize: '15px',
        fontWeight: '600',
        color: '#B45309'
    },

    // Footer
    cardFooter: {
        textAlign: 'center'
    },
    claimBtn: {
        width: '100%',
        padding: '14px',
        background: 'linear-gradient(135deg, #C41E3A 0%, #E11D48 100%)',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '10px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s'
    },
    claimedStatus: {
        color: '#22C55E',
        fontWeight: 'bold',
        padding: '14px'
    },
    inProgress: {
        color: '#6B7280',
        fontSize: '14px',
        padding: '14px'
    },

    // How It Works
    howItWorks: {
        backgroundColor: '#FFFFFF',
        padding: '60px 20px',
        textAlign: 'center'
    },
    sectionTitle: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: '40px'
    },
    stepsGrid: {
        display: 'flex',
        justifyContent: 'center',
        gap: '40px',
        flexWrap: 'wrap',
        maxWidth: '900px',
        margin: '0 auto'
    },
    step: {
        flex: '1',
        minWidth: '200px',
        maxWidth: '280px'
    },
    stepNumber: {
        width: '50px',
        height: '50px',
        backgroundColor: '#C41E3A',
        color: '#FFFFFF',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        margin: '0 auto 16px'
    }
};

// Add keyframes to document
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0) rotate(0deg); }
    50% { transform: translateY(-15px) rotate(5deg); }
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default ChallengesPage;
