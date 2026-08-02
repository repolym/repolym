import { useState, useEffect, useCallback, useRef } from 'react';
import { adminAnalyticsService } from '../services/adminAnalyticsService';
import { AdminAnalyticsData } from '../types/admin';
import { logger } from '../utils/logger';
import { formatError } from '../utils/error-handler';

interface UseAdminAnalyticsParams {
    olympiadId: string | null;
    dateRange: 'today' | 'week' | 'month' | 'quarter';
    forceRefresh?: boolean;
}

export const useAdminAnalytics = ({ olympiadId, dateRange, forceRefresh = false }: UseAdminAnalyticsParams) => {
    const [data, setData] = useState<AdminAnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    const fetch = useCallback(async () => {
        if (!mountedRef.current) return;
        setLoading(true);
        setError(null);
        try {
            const result = await adminAnalyticsService.getDashboardAnalytics(olympiadId, dateRange);
            if (mountedRef.current) {
                setData(result);
            }
        } catch (err) {
            if (mountedRef.current) {
                const msg = formatError(err);
                setError(msg);
                logger.error('Admin analytics fetch failed', err, { olympiadId, dateRange });
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [olympiadId, dateRange]);

    useEffect(() => {
        mountedRef.current = true;
        fetch();
        return () => {
            mountedRef.current = false;
        };
    }, [fetch]);

    const refetch = useCallback(() => {
        fetch();
    }, [fetch]);

    return { data, loading, error, refetch };
};