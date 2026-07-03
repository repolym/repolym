import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../config/supabase'
import type { DailyMetric, DailyMetricFormData } from '../types/analytics'
import { formatError } from '../utils/error-handler'
import { queryDeduplicator } from '../utils/query-deduplicator'
import { logger } from '../utils/logger'
import { analyticsService } from '../services/analyticsService'
import { today } from '../utils/date-utils'

interface UseDailyMetricsParams {
    userId: string | null
    dateFrom?: string
    dateTo?: string
}

const CACHE_TTL = 60_000

export const useDailyMetrics = ({ userId, dateFrom, dateTo }: UseDailyMetricsParams) => {
    const [data, setData] = useState<DailyMetric[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const mountedRef = useRef(true)

    const cacheKey = `daily_metrics|${userId}|${dateFrom}|${dateTo}`

    const executeQuery = useCallback(async (userId: string, dateFrom?: string, dateTo?: string): Promise<DailyMetric[]> => {
        let query = supabase
            .from('daily_metrics')
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false })

        if (dateFrom) query = query.gte('date', dateFrom)
        if (dateTo) query = query.lte('date', dateTo)

        const { data: rows, error: err } = await query
        if (err) throw err
        return (rows as DailyMetric[]) || []
    }, [])

    const fetch = useCallback(
        async (forceRefresh = false) => {
            if (!userId || !mountedRef.current) return

            setLoading(true)
            setError(null)

            try {
                const result = await queryDeduplicator.dedupedQuery(
                    cacheKey,
                    () => executeQuery(userId, dateFrom, dateTo),
                    forceRefresh ? 0 : CACHE_TTL
                )

                if (mountedRef.current) {
                    setData(result)
                    setError(null)
                }
            } catch (err) {
                if (mountedRef.current) {
                    const message = formatError(err)
                    setError(message)
                    logger.error('Failed to fetch daily metrics', err, { userId, dateFrom, dateTo })
                }
            } finally {
                if (mountedRef.current) setLoading(false)
            }
        },
        [userId, dateFrom, dateTo, cacheKey, executeQuery]
    )

    useEffect(() => {
        mountedRef.current = true
        fetch()
        return () => {
            mountedRef.current = false
        }
    }, [fetch])

    const logDailyMetric = useCallback(
        async (formData: DailyMetricFormData): Promise<boolean> => {
            if (!userId) return false

            try {
                const { error: err } = await supabase
                    .from('daily_metrics')
                    .upsert(
                        [{ ...formData, user_id: userId, updated_at: new Date().toISOString() }],
                        { onConflict: 'user_id,date' }
                    )

                if (err) throw err

                queryDeduplicator.invalidate(cacheKey)
                analyticsService.invalidate(userId, formData.date === today() ? formData.date : undefined)
                await fetch(true)
                return true
            } catch (err) {
                const message = formatError(err)
                setError(message)
                logger.error('Failed to log daily metric', err, { userId, formData })
                return false
            }
        },
        [userId, cacheKey, fetch]
    )

    const deleteDailyMetric = useCallback(
        async (id: string): Promise<boolean> => {
            if (!userId) return false

            try {
                const { error: err } = await supabase
                    .from('daily_metrics')
                    .delete()
                    .eq('id', id)
                    .eq('user_id', userId)

                if (err) throw err

                queryDeduplicator.invalidate(cacheKey)
                analyticsService.invalidate(userId)
                await fetch(true)
                return true
            } catch (err) {
                const message = formatError(err)
                setError(message)
                logger.error('Failed to delete daily metric', err, { userId, id })
                return false
            }
        },
        [userId, cacheKey, fetch]
    )

    return {
        data,
        loading,
        error,
        refetch: () => fetch(true),
        logDailyMetric,
        deleteDailyMetric,
    }
}