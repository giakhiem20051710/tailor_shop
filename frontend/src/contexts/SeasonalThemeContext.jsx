import { createContext, useContext, useState, useEffect, useMemo } from 'react';

/**
 * Seasonal Theme Context
 * Provides theme data across the entire app based on current season
 */

// Season configurations with full theme data
const SEASON_THEMES = {
    TET: {
        id: 'TET',
        name: 'Tết Nguyên Đán',
        emoji: '🧧',
        decorations: ['🏮', '🎊', '💐', '🌸', '🧧'],
        colors: {
            primary: '#C41E3A',
            secondary: '#FFD700',
            accent: '#FF6B6B',
            background: 'linear-gradient(135deg, #FDF2F2 0%, #FEE2E2 100%)',
            text: '#7F1D1D',
            border: '#FECACA'
        },
        greeting: 'Chúc Mừng Năm Mới! 🎊',
        banner: '🧧 Tết Nguyên Đán - Lì xì may mắn cho bạn! 🧧',
        cssClass: 'theme-tet'
    },
    VALENTINE: {
        id: 'VALENTINE',
        name: 'Valentine',
        emoji: '💝',
        decorations: ['💕', '💖', '💗', '🌹', '❤️'],
        colors: {
            primary: '#EC4899',
            secondary: '#F9A8D4',
            accent: '#DB2777',
            background: 'linear-gradient(135deg, #FDF2F8 0%, #FCE7F3 100%)',
            text: '#831843',
            border: '#FBCFE8'
        },
        greeting: 'Happy Valentine\'s Day! 💕',
        banner: '💝 Tháng của tình yêu - Ưu đãi đặc biệt cho cặp đôi! 💝',
        cssClass: 'theme-valentine'
    },
    WOMEN_DAY: {
        id: 'WOMEN_DAY',
        name: 'Ngày Phụ Nữ',
        emoji: '🌸',
        decorations: ['🌸', '🌷', '💐', '🌺', '✨'],
        colors: {
            primary: '#F472B6',
            secondary: '#FBCFE8',
            accent: '#EC4899',
            background: 'linear-gradient(135deg, #FDF2F8 0%, #FECDD3 100%)',
            text: '#9D174D',
            border: '#F9A8D4'
        },
        greeting: 'Chúc mừng ngày 8/3! 🌸',
        banner: '🌸 Ngày Phụ Nữ - Tặng yêu thương cho phái đẹp! 🌸',
        cssClass: 'theme-women-day'
    },
    SUMMER: {
        id: 'SUMMER',
        name: 'Mùa Hè',
        emoji: '☀️',
        decorations: ['☀️', '🌴', '🏖️', '🌊', '🍉'],
        colors: {
            primary: '#F59E0B',
            secondary: '#FCD34D',
            accent: '#D97706',
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            text: '#92400E',
            border: '#FDE68A'
        },
        greeting: 'Chào Mùa Hè! ☀️',
        banner: '☀️ Summer Sale - Giảm giá hot nhất mùa hè! ☀️',
        cssClass: 'theme-summer'
    },
    MID_AUTUMN: {
        id: 'MID_AUTUMN',
        name: 'Trung Thu',
        emoji: '🥮',
        decorations: ['🥮', '🏮', '🌕', '🐰', '⭐'],
        colors: {
            primary: '#EA580C',
            secondary: '#FDBA74',
            accent: '#C2410C',
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
            text: '#7C2D12',
            border: '#FED7AA'
        },
        greeting: 'Chúc Trung Thu vui vẻ! 🥮',
        banner: '🏮 Tết Trung Thu - Đoàn viên sum họp! 🏮',
        cssClass: 'theme-mid-autumn'
    },
    CHRISTMAS: {
        id: 'CHRISTMAS',
        name: 'Giáng Sinh',
        emoji: '🎄',
        decorations: ['🎄', '🎅', '❄️', '⭐', '🎁'],
        colors: {
            primary: '#16A34A',
            secondary: '#DC2626',
            accent: '#15803D',
            background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
            text: '#166534',
            border: '#BBF7D0'
        },
        greeting: 'Merry Christmas! 🎄',
        banner: '🎄 Giáng Sinh An Lành - Quà tặng yêu thương! 🎄',
        cssClass: 'theme-christmas'
    },
    DEFAULT: {
        id: 'DEFAULT',
        name: 'Bình thường',
        emoji: '✨',
        decorations: [],
        colors: {
            primary: '#8B5CF6',
            secondary: '#A78BFA',
            accent: '#7C3AED',
            background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
            text: '#5B21B6',
            border: '#DDD6FE'
        },
        greeting: '',
        banner: '',
        cssClass: 'theme-default'
    }
};

// Determine current season based on date
function getCurrentSeason() {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    // Tết: Jan 20 - Feb 10
    if ((month === 1 && day >= 20) || (month === 2 && day <= 10)) {
        return 'TET';
    }
    // Valentine: Feb 10 - Feb 20
    if (month === 2 && day >= 10 && day <= 20) {
        return 'VALENTINE';
    }
    // Women's Day: Mar 1 - Mar 15
    if (month === 3 && day >= 1 && day <= 15) {
        return 'WOMEN_DAY';
    }
    // Summer: Jun 1 - Aug 31
    if (month >= 6 && month <= 8) {
        return 'SUMMER';
    }
    // Mid Autumn: Sep 1 - Sep 30
    if (month === 9) {
        return 'MID_AUTUMN';
    }
    // Christmas: Dec 15 - Dec 31
    if (month === 12 && day >= 15) {
        return 'CHRISTMAS';
    }

    return 'DEFAULT';
}

// Create context
const SeasonalThemeContext = createContext(null);

// Provider component
export function SeasonalThemeProvider({ children }) {
    const [currentSeason, setCurrentSeason] = useState(() => getCurrentSeason());
    const [showDecorations, setShowDecorations] = useState(true);
    const [showBanner, setShowBanner] = useState(true);

    // Get theme data
    const theme = useMemo(() => {
        return SEASON_THEMES[currentSeason] || SEASON_THEMES.DEFAULT;
    }, [currentSeason]);

    // Check season periodically (every hour)
    useEffect(() => {
        const interval = setInterval(() => {
            const newSeason = getCurrentSeason();
            if (newSeason !== currentSeason) {
                setCurrentSeason(newSeason);
            }
        }, 60 * 60 * 1000);

        return () => clearInterval(interval);
    }, [currentSeason]);

    // Apply CSS class to body
    useEffect(() => {
        document.body.classList.remove(
            'theme-tet', 'theme-valentine', 'theme-women-day',
            'theme-summer', 'theme-mid-autumn', 'theme-christmas', 'theme-default'
        );
        document.body.classList.add(theme.cssClass);

        // Set CSS variables
        document.documentElement.style.setProperty('--seasonal-primary', theme.colors.primary);
        document.documentElement.style.setProperty('--seasonal-secondary', theme.colors.secondary);
        document.documentElement.style.setProperty('--seasonal-accent', theme.colors.accent);
        document.documentElement.style.setProperty('--seasonal-text', theme.colors.text);
        document.documentElement.style.setProperty('--seasonal-border', theme.colors.border);

        return () => {
            document.body.classList.remove(theme.cssClass);
        };
    }, [theme]);

    const value = {
        currentSeason,
        theme,
        showDecorations,
        setShowDecorations,
        showBanner,
        setShowBanner,
        dismissBanner: () => setShowBanner(false),
        isSeasonActive: currentSeason !== 'DEFAULT',
        SEASON_THEMES
    };

    return (
        <SeasonalThemeContext.Provider value={value}>
            {children}
        </SeasonalThemeContext.Provider>
    );
}

// Hook to use theme
export function useSeasonalTheme() {
    const context = useContext(SeasonalThemeContext);
    if (!context) {
        throw new Error('useSeasonalTheme must be used within SeasonalThemeProvider');
    }
    return context;
}

export default SeasonalThemeContext;
