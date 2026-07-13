// ============================================================
// FILE: src/utils/auth-cleanup.ts (COMPLETE)
// ============================================================

const AUTH_PARAM_MARKERS = [
    'access_token',
    'refresh_token',
    'type=recovery',
    'code=',
    'error=',
    'error_description=',
]

/**
 * Detects whether the current URL still carries Supabase auth-redirect
 * params (magic link / OAuth / password recovery). Pure/side-effect-free —
 * safe to call at any time, including from inside React render/effects.
 */
export const hasAuthRedirectParams = (): boolean => {
    try {
        return AUTH_PARAM_MARKERS.some((marker) => window.location.href.includes(marker))
    } catch {
        return false
    }
}

/**
 * Strips auth-redirect params from the URL bar.
 *
 * Only safe to call BEFORE the router has mounted (e.g. the top of
 * main.tsx): it rewrites `window.location` directly via the raw History
 * API, which React Router cannot observe. Calling this after the app has
 * mounted would desync the router's internal location from the visible
 * address bar — the exact bug that made some pages look logged-out until
 * a manual refresh. For any post-mount cleanup, use `hasAuthRedirectParams`
 * together with React Router's `navigate(..., { replace: true })` instead,
 * as AuthContext does.
 */
export const stripAuthParamsBeforeMount = (): void => {
    try {
        if (!hasAuthRedirectParams()) return
        const cleanUrl = `${window.location.origin}${window.location.pathname}#/dashboard`
        window.history.replaceState({ fromAuthRedirect: true }, document.title, cleanUrl)
    } catch {
        try {
            if (window.location.hash.includes('access_token')) {
                window.location.hash = '#/dashboard'
            }
        } catch {
            // ignore – worst case the raw hash is visible briefly
        }
    }
}