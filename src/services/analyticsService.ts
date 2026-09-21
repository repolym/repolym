import { supabase } from '../config/supabase'
import { queryDeduplicator } from '../utils/query-deduplicator'
import { today, getCurrentJalaliMonthRange, getPreviousJalaliMonthRange } from '../utils/date-utils'
import type { AnalyticsSnapshot } from '../types/analytics'
import { logger } from '../utils/logger'

export class AnalyticsServiceError extends Error { }

const CLIENT_CACHE_TTL = 5 * 60_000 // 5 minutes

const cacheKey = (userId: string, referenceDate: string) => `analytics|${userId}|${referenceDate}`

export const analyticsService = {
    async getSnapshot(userId: string, options?: { forceRefresh?: boolean; referenceDate?: string }): Promise<AnalyticsSnapshot> {
        const referenceDate = options?.referenceDate ?? today()
        const reference = new Date(referenceDate + 'T00:00:00')
        const currentMonth = getCurrentJalaliMonthRange(reference)
        const previousMonth = getPreviousJalaliMonthRange(reference)
        const periodDays = Math.max(1, Math.round((Date.parse(referenceDate) - Date.parse(currentMonth.from)) / 86400000) + 1)
        const key = cacheKey(userId, `${referenceDate}|${currentMonth.from}`)

        if (options?.forceRefresh) {
            queryDeduplicator.invalidate(key)
        }

        return queryDeduplicator.dedupedQuery<AnalyticsSnapshot>(
            key,
            async () => {
                const { data, error } = await supabase.rpc('get_analytics', {
                    p_user_id: userId,
                    p_today: referenceDate,
                    p_force_refresh: options?.forceRefresh ?? false,
                    p_period_start: currentMonth.from,
                    p_period_days: periodDays,
                    p_previous_period_start: previousMonth.from,
                    p_previous_period_end: previousMonth.to,
                })

                if (error) {
                    logger.error('Analytics RPC error', error, { userId, referenceDate })
                    throw new AnalyticsServiceError(error.message)
                }
                if (!data) {
                    throw new AnalyticsServiceError('پاسخ نامعتبر از سرویس تحلیل داده')
                }
                return data as AnalyticsSnapshot
            },
            options?.forceRefresh ? 0 : CLIENT_CACHE_TTL
        )
    },

    invalidate(userId: string, referenceDate: string = today()) {
        const reference = new Date(referenceDate + 'T00:00:00')
        const currentMonth = getCurrentJalaliMonthRange(reference)
        queryDeduplicator.invalidate(cacheKey(userId, `${referenceDate}|${currentMonth.from}`))
    },
}
