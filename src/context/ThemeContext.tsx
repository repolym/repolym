import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';

type ThemeMode = 'light' | 'dark' | 'sepia' | 'system';
type ResolvedTheme = 'light' | 'dark' | 'sepia';

const THEME_STORAGE_KEY = 'repolym-theme';
// Read by the inline script in index.html so consultants never see a dark flash.
const FORCE_LIGHT_KEY = 'repolym-force-light';

interface ThemeContextType {
    /** The user's own saved choice (students/admins). */
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    /** What is actually on screen. Always 'light' for consultants. */
    effectiveTheme: ResolvedTheme;
    /** True when the theme is locked (consultants). */
    isThemeLocked: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const systemPrefersDark = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

const applyResolvedTheme = (resolved: ResolvedTheme) => {
    const root = document.documentElement;
    root.classList.remove('dark', 'theme-sepia');
    if (resolved === 'dark') root.classList.add('dark');
    else if (resolved === 'sepia') root.classList.add('theme-sepia');
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const isConsultant = user?.role === 'ai_olympiad_consultant';

    const [theme, setThemeState] = useState<ThemeMode>(() => {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored && ['light', 'dark', 'sepia', 'system'].includes(stored)) {
            return stored as ThemeMode;
        }
        return 'system';
    });
    const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

    // Track the OS preference
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const resolvedChoice: ResolvedTheme =
        theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

    // Consultants are always light, whatever is stored.
    const effectiveTheme: ResolvedTheme = isConsultant ? 'light' : resolvedChoice;

    useEffect(() => {
        applyResolvedTheme(effectiveTheme);
    }, [effectiveTheme]);

    // Save the person's own choice, but never because of the consultant lock.
    useEffect(() => {
        if (!isConsultant) {
            try { localStorage.setItem(THEME_STORAGE_KEY, theme); } catch { /* ignore */ }
        }
    }, [theme, isConsultant]);

    // Remember "this browser belongs to a consultant" so the next page load starts light.
    const wasConsultantRef = useRef(false);
    useEffect(() => {
        try {
            if (user) {
                if (isConsultant) localStorage.setItem(FORCE_LIGHT_KEY, '1');
                else localStorage.removeItem(FORCE_LIGHT_KEY);
            } else if (wasConsultantRef.current) {
                localStorage.removeItem(FORCE_LIGHT_KEY); // consultant signed out
            }
        } catch { /* ignore */ }
        wasConsultantRef.current = isConsultant;
    }, [user, isConsultant]);

    const setTheme = useCallback((newTheme: ThemeMode) => {
        setThemeState(newTheme);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, effectiveTheme, isThemeLocked: isConsultant }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
};
