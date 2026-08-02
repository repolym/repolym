import { useState, useEffect, useCallback, useRef } from 'react';
import { coachInsightsService, CoachInsight } from '../services/coachInsightsService';
import { formatError } from '../utils/error-handler';
import { logger } from '../utils/logger';

interface UseCoachInsightsParams {
    timeRange: 'today' | 'week' | 'month' | 'quarter';
    limit?: number;
}

export const useCoachInsights = ({ timeRange, limit = 5 }: UseCoachInsightsParams) => {
    const [data, setData] = useState<CoachInsight[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const mountedRef = useRef(true);

    const fetch = useCallback(async () => {
        if (!mountedRef.current) return;
        setLoading(true);
        setError(null);
        try {
            const result = await coachInsightsService.getInsights(timeRange, limit);
            if (mountedRef.current) {
                setData(result);
            }
        } catch (err) {
            if (mountedRef.current) {
                const msg = formatError(err);
                setError(msg);
                logger.error('Coach insights fetch failed', err, { timeRange });
            }
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
        }
    }, [timeRange, limit]);

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