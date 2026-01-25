import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gamificationService from '../services/gamificationService.js';
import { useSeasonalTheme } from '../contexts/SeasonalThemeContext.jsx';
import { isAuthenticated } from '../utils/authStorage.js';

/**
 * Challenges Widget for Customer Dashboard
 * Shows user's active challenges and progress
 */
function ChallengesWidget() {
    const navigate = useNavigate();
    const { theme, isSeasonActive } = useSeasonalTheme();
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isAuthenticated()) {
            fetchProgress();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchProgress = async () => {
        try {
            setLoading(true);
            const data = await gamificationService.getMyProgress();
            // Show top 3 active challenges
            setChallenges((data || []).slice(0, 3));
        } catch (err) {
            console.error('Failed to fetch challenges:', err);
            setError('Không thể tải thử thách');
        } finally {
            setLoading(false);
        }
    };

    const handleViewAll = () => {
        navigate('/S');
    };

    // Don't show if not seasonal or no challenges
    if (!isSeasonActive && challenges.length === 0) {
        return null;
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div style={styles.titleRow}>
                    <span style={styles.emoji}>{theme?.emoji || '🎯'}</span>
                    <h3 style={styles.title}>Thử thách của tôi</h3>
                </div>
                <button style={styles.viewAllBtn} onClick={handleViewAll}>
                    Xem tất cả →
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div style={styles.loading}>Đang tải...</div>
            ) : error ? (
                <div style={styles.error}>{error}</div>
            ) : challenges.length === 0 ? (
                <div style={styles.empty}>
                    <p>Chưa có thử thách nào</p>
                    <button style={styles.discoverBtn} onClick={handleViewAll}>
                        Khám phá thử thách
                    </button>
                </div>
            ) : (
                <div style={styles.challengesList}>
                    {challenges.map(challenge => (
                        <div key={challenge.id} style={styles.challengeItem}>
                            <div style={styles.challengeInfo}>
                                <span style={styles.challengeName}>{challenge.name}</span>
                                <span style={styles.progressText}>
                                    {challenge.currentProgress || 0}/{challenge.targetValue}
                                </span>
                            </div>
                            <div style={styles.progressBar}>
                                <div
                                    style={{
                                        ...styles.progressFill,
                                        width: `${Math.min(challenge.progressPercentage || 0, 100)}%`,
                                        backgroundColor: challenge.isCompleted
                                            ? '#22C55E'
                                            : (theme?.colors?.primary || '#8B5CF6')
                                    }}
                                />
                            </div>
                            {challenge.isCompleted && !challenge.rewardClaimed && (
                                <span style={styles.claimBadge}>🎁 Nhận thưởng!</span>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        marginBottom: '20px'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
    },
    titleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    emoji: {
        fontSize: '24px'
    },
    title: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#1F2937',
        margin: 0
    },
    viewAllBtn: {
        background: 'none',
        border: 'none',
        color: '#6B7280',
        fontSize: '13px',
        cursor: 'pointer',
        padding: '4px 8px'
    },
    loading: {
        textAlign: 'center',
        padding: '20px',
        color: '#9CA3AF'
    },
    error: {
        textAlign: 'center',
        padding: '20px',
        color: '#EF4444'
    },
    empty: {
        textAlign: 'center',
        padding: '20px'
    },
    discoverBtn: {
        marginTop: '12px',
        padding: '8px 16px',
        backgroundColor: '#8B5CF6',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '13px'
    },
    challengesList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
    },
    challengeItem: {
        padding: '12px',
        backgroundColor: '#F9FAFB',
        borderRadius: '10px'
    },
    challengeInfo: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px'
    },
    challengeName: {
        fontSize: '13px',
        fontWeight: '500',
        color: '#374151'
    },
    progressText: {
        fontSize: '12px',
        color: '#6B7280'
    },
    progressBar: {
        height: '6px',
        backgroundColor: '#E5E7EB',
        borderRadius: '3px',
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        borderRadius: '3px',
        transition: 'width 0.3s ease'
    },
    claimBadge: {
        display: 'inline-block',
        marginTop: '8px',
        padding: '4px 10px',
        backgroundColor: '#FEF3C7',
        color: '#D97706',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600'
    }
};

export default ChallengesWidget;
