import { supabase } from '../config/supabase'
import { queryDeduplicator } from '../utils/query-deduplicator'
import { today } from '../utils/date-utils'
import type { AnalyticsSnapshot } from '../types/analytics'
import { logger } from '../utils/logger'

export class AnalyticsServiceError extends Error { }

const CLIENT_CACHE_TTL = 5 * 60_000 // 5 minutes

const cacheKey = (userId: string, referenceDate: string) => `analytics|${userId}|${referenceDate}`

export const analyticsService = {
    async getSnapshot(userId: string, options?: { forceRefresh?: boolean; referenceDate?: string }): Promise<AnalyticsSnapshot> {
        const referenceDate = options?.referenceDate ?? today()
        const key = cacheKey(userId, referenceDate)

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
        queryDeduplicator.invalidate(cacheKey(userId, referenceDate))
    },
}