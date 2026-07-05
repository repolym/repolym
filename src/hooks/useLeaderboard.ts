// src/hooks/useLeaderboard.ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { leaderboardService, LeaderboardServiceError } from '../services/leaderboardService'
import type { LeaderboardSnapshot } from '../types/leaderboard'
import { formatError } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { today } from '../utils/date-utils'

interface UseLeaderboardParams {
    olympiadId: string | null
    window?: 'today' | 'week' | 'month' | 'all'
    limit?: number
    metric?: string // 'study' | 'consistency' | 'sleep' | 'phone' | 'smart'
}

export const useLeaderboard = ({ olympiadId, window = 'month', limit, metric = 'smart' }: UseLeaderboardParams) => {
    const [data, setData] = useState<LeaderboardSnapshot | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const mountedRef = useRef(true)
    const refDate = today()

    const fetch = useCallback(
        async (forceRefresh = false) => {
            if (!olympiadId) return

            setLoading(true)
            setError(null)

            try {
                const snapshot = await leaderboardService.getSnapshot(olympiadId, {
                    forceRefresh,
                    referenceDate: refDate,
                    limit,
                    window,
                    metric,
                })
                if (mountedRef.current) {
                    setData(snapshot)
                    setError(null)
                }
            } catch (err) {
                if (mountedRef.current) {
                    const message =
                        err instanceof LeaderboardServiceError
                            ? err.message
                            : formatError(err)
                    setError(message)
                    logger.error('Failed to fetch leaderboard', err, { olympiadId, refDate, window, metric })
                }
            } finally {
                if (mountedRef.current) {
                    setLoading(false)
                }
            }
        },
        [olympiadId, refDate, limit, window, metric]
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