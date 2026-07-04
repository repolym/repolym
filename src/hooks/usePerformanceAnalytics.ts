import { useAnalytics } from './useAnalytics'

/**
 * usePerformanceAnalytics
 *
 * Single data source for the merged Performance + Analytics dashboard page.
 * It intentionally reuses `useAnalytics` (same request, same client-side
 * cache/dedup via `queryDeduplicator`) instead of issuing a second query —
 * the underlying `get_analytics` RPC already returns everything the merged
 * page needs: study analytics, solved-test KPIs, subject/difficulty
 * breakdowns and trend series.
 */
export const usePerformanceAnalytics = useAnalytics
