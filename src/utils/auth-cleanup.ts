// ============================================================
// FILE: src/utils/auth-cleanup.ts (COMPLETE)
// ============================================================
export const cleanupAuthParams = (): void => {
    try {
        const href = window.location.href
        const hash = window.location.hash

        const hasAuthParams =
            href.includes('access_token') ||
            href.includes('refresh_token') ||
            href.includes('type=recovery') ||
            href.includes('code=') ||
            href.includes('error=') ||
            href.includes('error_description=')

        if (!hasAuthParams) {
            if (hash === '' || hash === '#/' || hash === '#/profile') {
                return
            }
            return
        }

        const basePath = window.location.pathname
        const cleanHash = '#/dashboard'
        const cleanUrl = window.location.origin + basePath + cleanHash

        window.history.replaceState(
            { fromAuthRedirect: true },
            document.title,
            cleanUrl
        )

        if (import.meta.env.MODE === 'development') {
            console.log('[cleanupAuthParams] Removed auth params from URL')
        }
    } catch (error) {
        try {
            if (window.location.hash.includes('access_token')) {
                window.location.hash = '#/dashboard'
            }
        } catch {
            // ignore
        }
    }
}