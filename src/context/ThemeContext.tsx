import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from './AuthContext';

type ThemeMode = 'light' | 'dark' | 'sepia' | 'system';
const THEME_STORAGE_KEY = 'repolym-theme';

interface ThemeContextType {
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const applyTheme = (theme: ThemeMode) => {
    const resolved = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;

    const root = document.documentElement;
    root.classList.remove('dark', 'theme-sepia');
    if (resolved === 'dark') root.classList.add('dark');
    else if (resolved === 'sepia') root.classList.add('theme-sepia');
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [theme, setThemeState] = useState<ThemeMode>(() => {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored && ['light', 'dark', 'sepia', 'system'].includes(stored)) {
            return stored as ThemeMode;
        }
        return 'system';
    });

    // Apply theme on mount and when theme changes
    useEffect(() => {
        applyTheme(theme);
        localStorage.setItem(THEME_STORAGE_KEY, theme);

        // Optionally save to database if user is logged in
        if (user?.id) {
            const currentPrefs = user.preferences || {};
            if (currentPrefs.theme !== theme) {
                supabase
                    .from('users')
                    .update({ preferences: { ...currentPrefs, theme } })
                    .eq('id', user.id)
                    .then(({ error }) => {
                        if (error) console.warn('Failed to save theme preference:', error);
                    });
            }
        }
    }, [theme, user]);

    // Listen to system preference changes if theme is 'system'
    useEffect(() => {
        if (theme !== 'system') return;
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => applyTheme('system');
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, [theme]);

    const setTheme = useCallback((newTheme: ThemeMode) => {
        setThemeState(newTheme);
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = (): ThemeContextType => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
    return ctx;
};