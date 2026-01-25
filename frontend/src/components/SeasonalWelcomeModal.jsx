import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeasonalTheme } from '../contexts/SeasonalThemeContext.jsx';

/**
 * Seasonal Welcome Modal
 * Shows a beautiful popup when user visits homepage or logs in during a seasonal event
 */
function SeasonalWelcomeModal({ onClose, triggerSource = 'homepage' }) {
    const navigate = useNavigate();
    const { theme, isSeasonActive, setShowDecorations, showDecorations } = useSeasonalTheme();
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Check if should show modal
    useEffect(() => {
        if (!isSeasonActive) return;

        const storageKey = `seasonal_modal_dismissed_${theme.id}`;
        const dismissed = localStorage.getItem(storageKey);

        // Show modal if not dismissed in this session
        if (!dismissed) {
            setTimeout(() => setIsVisible(true), 500); // Delay for smooth entrance
        }
    }, [isSeasonActive, theme.id]);

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            setIsVisible(false);
            localStorage.setItem(`seasonal_modal_dismissed_${theme.id}`, 'true');
            onClose?.();
        }, 300);
    };

    const handleViewOffers = () => {
        handleClose();
        navigate('/S'); // Navigate to challenges page
    };

    const handleToggleDecorations = () => {
        setShowDecorations(!showDecorations);
    };

    if (!isSeasonActive || !isVisible) return null;

    return (
        <div
            style={{
                ...styles.overlay,
                opacity: isClosing ? 0 : 1
            }}
            onClick={handleClose}
        >
            <div
                style={{
                    ...styles.modal,
                    transform: isClosing ? 'scale(0.9) translateY(20px)' : 'scale(1) translateY(0)',
                    borderColor: theme.colors.primary
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Close button */}
                <button style={styles.closeBtn} onClick={handleClose}>
                    ✕
                </button>

                {/* Header decoration */}
                <div
                    style={{
                        ...styles.headerDecoration,
                        background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`
                    }}
                >
                    {theme.decorations.slice(0, 3).map((emoji, i) => (
                        <span key={i} style={{ fontSize: '32px', margin: '0 8px' }}>{emoji}</span>
                    ))}
                </div>

                {/* Content */}
                <div style={styles.content}>
                    <p style={styles.label}>SỰ KIỆN NỔI BẬT</p>

                    <h2
                        style={{
                            ...styles.title,
                            color: theme.colors.primary
                        }}
                    >
                        {theme.name} {new Date().getFullYear()}
                    </h2>

                    <p style={styles.description}>
                        {getSeasonDescription(theme.id)}
                    </p>

                    {/* Offer highlights */}
                    <div style={styles.highlights}>
                        {getSeasonHighlights(theme.id).map((highlight, i) => (
                            <div
                                key={i}
                                style={{
                                    ...styles.highlightItem,
                                    borderColor: theme.colors.border,
                                    backgroundColor: theme.colors.background.includes('gradient')
                                        ? '#FFFFFF'
                                        : theme.colors.background
                                }}
                            >
                                <span style={styles.highlightEmoji}>{highlight.emoji}</span>
                                <span style={styles.highlightText}>{highlight.text}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA Button */}
                    <button
                        style={{
                            ...styles.ctaButton,
                            background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`
                        }}
                        onClick={handleViewOffers}
                    >
                        Xem chi tiết ưu đãi →
                    </button>

                    {/* Toggle decorations */}
                    <button
                        style={styles.toggleBtn}
                        onClick={handleToggleDecorations}
                    >
                        {showDecorations ? '🎭 Tắt hiệu ứng' : '✨ Bật hiệu ứng'}
                    </button>

                    {/* Dismiss text */}
                    <p style={styles.dismissText} onClick={handleClose}>
                        Đóng cửa sổ này
                    </p>
                </div>
            </div>
        </div>
    );
}

// Helper functions for content
function getSeasonDescription(seasonId) {
    const descriptions = {
        TET: '🧧 Đầm - áo dài - vest gia đình, giảm đến 20%.\nChương trình áp dụng tự động tại Tailor Shop.',
        VALENTINE: '💕 Ưu đãi cho cặp đôi - Đặt may đồ couple giảm 25%.\nTặng kèm phụ kiện xinh xắn.',
        WOMEN_DAY: '🌸 Tặng quà yêu thương - Giảm 15% tất cả đầm nữ.\nMiễn phí gói quà tặng.',
        SUMMER: '☀️ Summer Sale - Vải linen, cotton giảm 30%.\nThoáng mát cho mùa hè năng động.',
        MID_AUTUMN: '🥮 Đoàn viên sum họp - Áo dài gia đình giảm 20%.\nTặng kèm bánh Trung Thu.',
        CHRISTMAS: '🎄 Giáng Sinh An Lành - Vest dự tiệc giảm 25%.\nMiễn phí thêu tên lên áo.'
    };
    return descriptions[seasonId] || 'Ưu đãi đặc biệt đang chờ bạn!';
}

function getSeasonHighlights(seasonId) {
    const highlights = {
        TET: [
            { emoji: '👔', text: 'Áo dài' },
            { emoji: '👗', text: 'Đầm dự tiệc' },
            { emoji: '🧥', text: 'Vest gia đình' },
            { emoji: '🎁', text: 'Quà tặng' }
        ],
        VALENTINE: [
            { emoji: '💑', text: 'Couple set' },
            { emoji: '👗', text: 'Đầm đôi' },
            { emoji: '🎀', text: 'Phụ kiện' },
            { emoji: '💝', text: 'Gói quà' }
        ],
        WOMEN_DAY: [
            { emoji: '👗', text: 'Đầm công sở' },
            { emoji: '👚', text: 'Áo kiểu' },
            { emoji: '🌸', text: 'Họa tiết hoa' },
            { emoji: '🎁', text: 'Gói quà' }
        ],
        SUMMER: [
            { emoji: '👕', text: 'Áo linen' },
            { emoji: '👖', text: 'Quần short' },
            { emoji: '👗', text: 'Đầm maxi' },
            { emoji: '🩱', text: 'Đồ biển' }
        ],
        MID_AUTUMN: [
            { emoji: '👔', text: 'Áo dài trẻ em' },
            { emoji: '👗', text: 'Áo dài gia đình' },
            { emoji: '🥮', text: 'Quà tặng' },
            { emoji: '🏮', text: 'Phụ kiện' }
        ],
        CHRISTMAS: [
            { emoji: '🧥', text: 'Vest dự tiệc' },
            { emoji: '👗', text: 'Đầm đỏ' },
            { emoji: '🎅', text: 'Họa tiết Noel' },
            { emoji: '🎁', text: 'Gói quà' }
        ]
    };
    return highlights[seasonId] || [
        { emoji: '✨', text: 'Ưu đãi' },
        { emoji: '🎁', text: 'Quà tặng' }
    ];
}

// Styles
const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
        transition: 'opacity 0.3s ease',
        backdropFilter: 'blur(4px)'
    },
    modal: {
        position: 'relative',
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        width: '90%',
        maxWidth: '420px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        transition: 'transform 0.3s ease',
        border: '3px solid'
    },
    closeBtn: {
        position: 'absolute',
        top: '12px',
        right: '12px',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        border: 'none',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        color: '#6B7280',
        fontSize: '16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    headerDecoration: {
        padding: '24px',
        textAlign: 'center',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    content: {
        padding: '24px',
        textAlign: 'center'
    },
    label: {
        fontSize: '11px',
        fontWeight: '600',
        letterSpacing: '2px',
        color: '#9CA3AF',
        marginBottom: '8px'
    },
    title: {
        fontSize: '28px',
        fontWeight: 'bold',
        marginBottom: '12px',
        lineHeight: '1.2'
    },
    description: {
        fontSize: '14px',
        color: '#6B7280',
        marginBottom: '20px',
        lineHeight: '1.6',
        whiteSpace: 'pre-line'
    },
    highlights: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        marginBottom: '24px'
    },
    highlightItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '12px 8px',
        borderRadius: '12px',
        border: '1px solid',
        gap: '4px'
    },
    highlightEmoji: {
        fontSize: '24px'
    },
    highlightText: {
        fontSize: '10px',
        color: '#6B7280',
        fontWeight: '500'
    },
    ctaButton: {
        width: '100%',
        padding: '14px 24px',
        border: 'none',
        borderRadius: '12px',
        color: '#FFFFFF',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        marginBottom: '12px',
        transition: 'transform 0.2s, box-shadow 0.2s'
    },
    toggleBtn: {
        background: 'none',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '13px',
        color: '#6B7280',
        cursor: 'pointer',
        marginBottom: '12px'
    },
    dismissText: {
        fontSize: '13px',
        color: '#9CA3AF',
        cursor: 'pointer',
        textDecoration: 'underline'
    }
};

export default SeasonalWelcomeModal;
