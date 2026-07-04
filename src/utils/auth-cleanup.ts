
// src/utils/auth-cleanup.ts
export const cleanupAuthParams = () => {
    const hash = window.location.hash
    if (!hash) return

    // Split into path and query string
    const [path, queryString] = hash.split('?')
    if (!queryString) return

    // Remove Supabase auth params
    const params = new URLSearchParams(queryString)
    const authParams = ['access_token', 'refresh_token', 'expires_in', 'token_type', 'type']
    let changed = false
    authParams.forEach(p => {
        if (params.has(p)) {
            params.delete(p)
            changed = true
        }
    })

    if (!changed) return

    const newQuery = params.toString()
    window.location.hash = newQuery ? `${path}?${newQuery}` : path
}
