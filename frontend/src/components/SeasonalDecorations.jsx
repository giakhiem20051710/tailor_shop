import { useEffect, useState, useMemo, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeasonalTheme } from '../contexts/SeasonalThemeContext.jsx';

/**
 * Seasonal Decorations Component
 * Floating decorations that appear on all pages during seasonal events
 */
function SeasonalDecorations() {
    const { theme, showDecorations, isSeasonActive } = useSeasonalTheme();
    const [particles, setParticles] = useState([]);

    // Generate particles
    useEffect(() => {
        if (!showDecorations || !isSeasonActive || theme.decorations.length === 0) {
            setParticles([]);
            return;
        }

        const newParticles = Array.from({ length: 12 }, (_, i) => ({
            id: i,
            emoji: theme.decorations[i % theme.decorations.length],
            left: Math.random() * 100,
            animationDuration: 8 + Math.random() * 12,
            animationDelay: Math.random() * 5,
            size: 16 + Math.random() * 16,
            opacity: 0.3 + Math.random() * 0.4
        }));

        setParticles(newParticles);
    }, [theme, showDecorations, isSeasonActive]);

    if (!showDecorations || !isSeasonActive || particles.length === 0) {
        return null;
    }

    return (
        <div style={styles.container} aria-hidden="true">
            {particles.map(particle => (
                <div
                    key={particle.id}
                    style={{
                        ...styles.particle,
                        left: `${particle.left}%`,
                        fontSize: `${particle.size}px`,
                        opacity: particle.opacity,
                        animationDuration: `${particle.animationDuration}s`,
                        animationDelay: `${particle.animationDelay}s`
                    }}
                >
                    {particle.emoji}
                </div>
            ))}
            <style>{keyframes}</style>
        </div>
    );
}

/**
 * Seasonal Banner Component
 * Top banner announcing current season - clickable with CTA
 */
export function SeasonalBanner() {
    const navigate = useNavigate();
    const { theme, showBanner, dismissBanner, isSeasonActive } = useSeasonalTheme();

    if (!showBanner || !isSeasonActive || !theme.banner) {
        return null;
    }

    const handleBannerClick = () => {
        navigate('/S');
    };

    return (
        <div
            style={{
                ...styles.banner,
                background: `linear-gradient(90deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 50%, ${theme.colors.primary} 100%)`
            }}
        >
            <div style={styles.bannerContent}>
                <span style={styles.bannerText}>{theme.banner}</span>
                <button
                    onClick={handleBannerClick}
                    style={styles.bannerCTA}
                >
                    Xem thử thách →
                </button>
            </div>
            <button
                onClick={dismissBanner}
                style={styles.bannerClose}
                aria-label="Đóng banner"
            >
                ✕
            </button>
        </div>
    );
}

/**
 * Season Indicator Component
 * Small badge showing current season
 */
export function SeasonIndicator({ compact = false }) {
    const { theme, isSeasonActive } = useSeasonalTheme();

    if (!isSeasonActive) {
        return null;
    }

    if (compact) {
        return (
            <span
                style={{
                    ...styles.indicatorCompact,
                    backgroundColor: theme.colors.secondary,
                    color: theme.colors.text
                }}
                title={theme.name}
            >
                {theme.emoji}
            </span>
        );
    }

    return (
        <div
            style={{
                ...styles.indicator,
                backgroundColor: theme.colors.secondary,
                borderColor: theme.colors.primary,
                color: theme.colors.text
            }}
        >
            <span style={styles.indicatorEmoji}>{theme.emoji}</span>
            <span style={styles.indicatorText}>{theme.name}</span>
        </div>
    );
}

/**
 * Seasonal Greeting Component
 * Shows greeting message for the season
 */
export function SeasonalGreeting() {
    const { theme, isSeasonActive } = useSeasonalTheme();

    if (!isSeasonActive || !theme.greeting) {
        return null;
    }

    return (
        <div
            style={{
                ...styles.greeting,
                color: theme.colors.primary
            }}
        >
            {theme.greeting}
        </div>
    );
}

// Styles
const styles = {
    container: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 9998
    },
    particle: {
        position: 'absolute',
        top: '-30px',
        animation: 'seasonalFall linear infinite',
        willChange: 'transform'
    },
    banner: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        padding: '10px 50px 10px 20px',
        textAlign: 'center',
        zIndex: 10000,
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
    },
    bannerText: {
        color: '#FFFFFF',
        fontSize: '14px',
        fontWeight: '600',
        letterSpacing: '0.5px'
    },
    bannerContent: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        flexWrap: 'wrap'
    },
    bannerCTA: {
        background: 'rgba(255,255,255,0.95)',
        border: 'none',
        borderRadius: '20px',
        padding: '6px 16px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#C41E3A',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        whiteSpace: 'nowrap'
    },
    bannerClose: {
        position: 'absolute',
        right: '16px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'rgba(255,255,255,0.2)',
        border: 'none',
        color: '#FFFFFF',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        cursor: 'pointer',
        fontSize: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    },
    indicator: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        borderRadius: '20px',
        border: '2px solid',
        fontSize: '13px',
        fontWeight: '600'
    },
    indicatorCompact: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        fontSize: '14px'
    },
    indicatorEmoji: {
        fontSize: '16px'
    },
    indicatorText: {
        fontSize: '13px'
    },
    greeting: {
        fontSize: '18px',
        fontWeight: '600',
        textAlign: 'center',
        padding: '16px',
        animation: 'pulse 2s ease-in-out infinite'
    }
};

// Keyframes animation
const keyframes = `
  @keyframes seasonalFall {
    0% {
      transform: translateY(0) rotate(0deg);
    }
    100% {
      transform: translateY(105vh) rotate(360deg);
    }
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.8;
      transform: scale(1.02);
    }
  }
`;

export default memo(SeasonalDecorations);
