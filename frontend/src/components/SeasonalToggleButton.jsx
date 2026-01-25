import { memo } from 'react';
import { useSeasonalTheme } from '../contexts/SeasonalThemeContext.jsx';

/**
 * Floating Toggle Button
 * Allows users to toggle seasonal decorations on/off
 * Fixed position at bottom-right of screen
 */
function SeasonalToggleButton() {
    const { theme, showDecorations, setShowDecorations, isSeasonActive } = useSeasonalTheme();

    if (!isSeasonActive) return null;

    return (
        <button
            onClick={() => setShowDecorations(!showDecorations)}
            style={{
                ...styles.button,
                backgroundColor: showDecorations ? theme.colors.primary : '#6B7280',
                boxShadow: showDecorations
                    ? `0 4px 20px ${theme.colors.primary}40`
                    : '0 4px 20px rgba(0,0,0,0.2)'
            }}
            title={showDecorations ? 'Tắt hiệu ứng mùa' : 'Bật hiệu ứng mùa'}
            aria-label={showDecorations ? 'Tắt hiệu ứng' : 'Bật hiệu ứng'}
        >
            <span style={styles.emoji}>
                {showDecorations ? theme.emoji : '🌙'}
            </span>
            <span style={styles.statusDot(showDecorations)} />
        </button>
    );
}

const styles = {
    button: {
        position: 'fixed',
        top: '80px',
        right: '20px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'all 0.3s ease',
        transform: 'scale(1)'
    },
    emoji: {
        fontSize: '24px',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
    },
    statusDot: (isOn) => ({
        position: 'absolute',
        top: '8px',
        right: '8px',
        width: '10px',
        height: '10px',
        borderRadius: '50%',
        backgroundColor: isOn ? '#22C55E' : '#EF4444',
        border: '2px solid white'
    })
};

export default memo(SeasonalToggleButton);
