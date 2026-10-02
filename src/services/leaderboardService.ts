// src/services/leaderboardService.ts
import { supabase } from '../config/supabase'
import { queryDeduplicator } from '../utils/query-deduplicator'
import { today, getLeaderboardWindow } from '../utils/date-utils'
import type { LeaderboardWindowType } from '../utils/date-utils'
import type { LeaderboardSnapshot } from '../types/leaderboard'
import { logger } from '../utils/logger'

export class LeaderboardServiceError extends Error { }

const CLIENT_CACHE_TTL = 5 * 60_000 // 5 دقیقه

const cacheKey = (olympiadId: string, referenceDate: string, window: string, metric: string) =>
    `leaderboard|${olympiadId}|${referenceDate}|${window}|${metric}`

export const leaderboardService = {
    async getSnapshot(
        olympiadId: string,
        options?: {
            forceRefresh?: boolean
            referenceDate?: string
            limit?: number
            window?: LeaderboardWindowType
            metric?: string
        }
    ): Promise<LeaderboardSnapshot> {
        const referenceDate = options?.referenceDate ?? today()
        const window: LeaderboardWindowType = options?.window || 'month'
        const metric = options?.metric || 'smart' // composite score by default
        const key = cacheKey(olympiadId, referenceDate, window, metric)

        if (options?.forceRefresh) {
            queryDeduplicator.invalidate(key)
        }

        return queryDeduplicator.dedupedQuery<LeaderboardSnapshot>(
            key,
            async () => {
                const range = getLeaderboardWindow(window, referenceDate)
                const { data, error } = await supabase.rpc('get_olympiad_leaderboard', {
                    p_olympiad_id: olympiadId,
                    p_today: referenceDate,
                    p_limit: options?.limit ?? 50,
                    p_window_type: window,
                    p_metric: metric, // include metric to avoid ambiguity
                    p_window_start: range.start,
                    p_window_end: range.end,
                })

                if (error) {
                    logger.error('Leaderboard RPC error', error, { olympiadId, referenceDate, window, metric })
                    throw new LeaderboardServiceError(error.message)
                }
                if (!data) {
                    throw new LeaderboardServiceError('پاسخ نامعتبر از سرویس لیدربورد')
                }
                return data as LeaderboardSnapshot
            },
            options?.forceRefresh ? 0 : CLIENT_CACHE_TTL
        )
    },

    invalidate(olympiadId: string, referenceDate: string = today(), window: LeaderboardWindowType = 'month', metric: string = 'smart') {
        queryDeduplicator.invalidate(cacheKey(olympiadId, referenceDate, window, metric))
    },
}
