import { useCallback, useEffect, useRef, useState } from 'react'
import { leaderboardService, LeaderboardServiceError } from '../services/leaderboardService'
import type { LeaderboardSnapshot } from '../types/leaderboard'
import { formatError } from '../utils/error-handler'
import { logger } from '../utils/logger'
import { today } from '../utils/date-utils'

interface UseLeaderboardParams {
    olympiadId: string | null
    referenceDate?: string
    limit?: number
}

export const useLeaderboard = ({ olympiadId, referenceDate, limit }: UseLeaderboardParams) => {
    const [data, setData] = useState<LeaderboardSnapshot | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const mountedRef = useRef(true)
    const refDate = referenceDate ?? today()

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
                    logger.error('Failed to fetch leaderboard', err, { olympiadId, refDate })
                }
            } finally {
                if (mountedRef.current) {
                    setLoading(false)
                }
            }
        },
        [olympiadId, refDate, limit]
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
