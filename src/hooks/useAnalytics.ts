import { useCallback, useEffect, useRef, useState } from 'react'
import { analyticsService, AnalyticsServiceError } from '../services/analyticsService'
import type { AnalyticsSnapshot } from '../types/analytics'
import { formatError } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { today } from '../utils/date-utils'

interface UseAnalyticsParams {
    userId: string | null
    referenceDate?: string
}

export const useAnalytics = ({ userId, referenceDate }: UseAnalyticsParams) => {
    const [data, setData] = useState<AnalyticsSnapshot | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const mountedRef = useRef(true)
    const refDate = referenceDate ?? today()

    const fetch = useCallback(
        async (forceRefresh = false) => {
            if (!userId) return

            setLoading(true)
            setError(null)

            try {
                const snapshot = await analyticsService.getSnapshot(userId, { forceRefresh, referenceDate: refDate })
                if (mountedRef.current) {
                    setData(snapshot)
                    setError(null)
                }
            } catch (err) {
                if (mountedRef.current) {
                    const message = err instanceof AnalyticsServiceError ? err.message : formatError(err)
                    setError(message)
                    logger.error('Failed to fetch analytics snapshot', err, { userId, refDate })
                }
            } finally {
                if (mountedRef.current) {
                    setLoading(false)
                }
            }
        },
        [userId, refDate]
    )

    useEffect(() => {
        mountedRef.current = true
        fetch()
        return () => {
            mountedRef.current = false
        }
    }, [fetch])

    return {
        data,
        loading,
        error,
        refetch: () => fetch(true),
    }
}
