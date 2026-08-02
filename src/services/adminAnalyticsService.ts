import { supabase } from '../config/supabase';
import { queryDeduplicator } from '../utils/query-deduplicator';
import { today, daysAgo } from '../utils/date-utils';
import { logger } from '../utils/logger';

export interface AdminAnalyticsData {
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    totalTests: number;
    avgStudyMinutes: number;
    consistencyScore: number;
    recoveryScore: number;
    riskScore: number;
    studentsAtRisk: number;
    topOlympiads: { olympiad: string; count: number }[];
    dailyStudy: { date: string; minutes: number }[];
    subjectDistribution: { subject: string; minutes: number; color: string }[];
    riskDistribution: { riskLevel: string; count: number }[];
    recentActivity: { action: string; user: string; time: string }[];
}

const CACHE_TTL = 5 * 60_000; // 5 minutes

export const adminAnalyticsService = {
    async getDashboardAnalytics(timeRange: 'today' | 'week' | 'month' | 'quarter'): Promise<AdminAnalyticsData> {
        const key = `admin_analytics_${timeRange}_${today()}`;
        return queryDeduplicator.dedupedQuery(
            key,
            async () => {
                const dateRange = this.getDateRange(timeRange);
                const [users, sessions, tests, olympiads, riskData, dailyStudy, subjectDist, recentActivity] = await Promise.all([
                    this.getUserStats(dateRange),
                    this.getSessionStats(dateRange),
                    this.getTestStats(dateRange),
                    this.getOlympiadStats(),
                    this.getRiskStats(),
                    this.getDailyStudyTrend(dateRange),
                    this.getSubjectDistribution(dateRange),
                    this.getRecentActivity(10),
                ]);

                const activeUsers = users.active;
                const totalUsers = users.total;
                const totalSessions = sessions.total;
                const totalTests = tests.total;
                const avgStudyMinutes = sessions.avgDaily || 0;
                const consistencyScore = sessions.consistency || 0;
                const recoveryScore = riskData.recoveryScore || 0;
                const riskScore = riskData.averageRisk || 0;
                const studentsAtRisk = riskData.atRiskCount || 0;
                const topOlympiads = olympiads.slice(0, 5);
                const riskDistribution = this.computeRiskDistribution(riskData.distribution || []);

                return {
                    totalUsers,
                    activeUsers,
                    totalSessions,
                    totalTests,
                    avgStudyMinutes,
                    consistencyScore,
                    recoveryScore,
                    riskScore,
                    studentsAtRisk,
                    topOlympiads,
                    dailyStudy,
                    subjectDistribution: subjectDist,
                    riskDistribution,
                    recentActivity,
                };
            },
            CACHE_TTL
        );
    },

    getDateRange(timeRange: 'today' | 'week' | 'month' | 'quarter'): { from: string; to: string } {
        const to = today();
        let from = to;
        if (timeRange === 'today') {
            from = to;
        } else if (timeRange === 'week') {
            from = daysAgo(7);
        } else if (timeRange === 'month') {
            from = daysAgo(30);
        } else if (timeRange === 'quarter') {
            from = daysAgo(90);
        }
        return { from, to };
    },

    async getUserStats(dateRange: { from: string; to: string }): Promise<{ total: number; active: number }> {
        const { from, to } = dateRange;
        const [totalRes, activeRes] = await Promise.all([
            supabase.from('users').select('id', { count: 'exact', head: true }),
            supabase
                .from('study_sessions')
                .select('user_id', { count: 'exact', head: true })
                .gte('date', from)
                .lte('date', to),
        ]);
        const total = totalRes.count || 0;
        const active = activeRes.count || 0;
        return { total, active };
    },

    async getSessionStats(dateRange: { from: string; to: string }): Promise<{ total: number; avgDaily: number; consistency: number }> {
        const { from, to } = dateRange;
        const { data, error } = await supabase
            .from('study_sessions')
            .select('duration_minutes, date')
            .gte('date', from)
            .lte('date', to);
        if (error) throw new Error(error.message);
        const total = data?.length || 0;
        const totalMinutes = data?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;
        const days = Math.max(1, (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24) + 1);
        const avgDaily = totalMinutes / days;
        const activeDays = new Set(data?.map(s => s.date) || []).size;
        const consistency = (activeDays / days) * 100;
        return { total, avgDaily, consistency };
    },

    async getTestStats(dateRange: { from: string; to: string }): Promise<{ total: number }> {
        const { from, to } = dateRange;
        const { count, error } = await supabase
            .from('tests')
            .select('id', { count: 'exact', head: true })
            .gte('date', from)
            .lte('date', to);
        if (error) throw new Error(error.message);
        return { total: count || 0 };
    },

    async getOlympiadStats(): Promise<{ olympiad: string; count: number }[]> {
        const { data, error } = await supabase
            .from('users')
            .select('olympiad_id')
            .not('olympiad_id', 'is', null);
        if (error) throw new Error(error.message);
        const map = new Map<string, number>();
        data?.forEach(u => {
            const key = u.olympiad_id || 'نامشخص';
            map.set(key, (map.get(key) || 0) + 1);
        });
        return Array.from(map.entries()).map(([olympiad, count]) => ({ olympiad, count }));
    },

    async getRiskStats(): Promise<{ averageRisk: number; atRiskCount: number; recoveryScore: number; distribution: { riskLevel: string; count: number }[] }> {
        const { data, error } = await supabase.rpc('get_risk_distribution');
        if (error) {
            logger.warn('Risk distribution RPC not available, using defaults', { error: error.message });
            return {
                averageRisk: 0,
                atRiskCount: 0,
                recoveryScore: 0,
                distribution: [],
            };
        }
        return data;
    },

    async getDailyStudyTrend(dateRange: { from: string; to: string }): Promise<{ date: string; minutes: number }[]> {
        const { from, to } = dateRange;
        const { data, error } = await supabase
            .from('study_sessions')
            .select('date, duration_minutes')
            .gte('date', from)
            .lte('date', to)
            .order('date', { ascending: true });
        if (error) throw new Error(error.message);
        const map = new Map<string, number>();
        let current = new Date(from);
        const end = new Date(to);
        while (current <= end) {
            const d = current.toISOString().split('T')[0];
            map.set(d, 0);
            current.setDate(current.getDate() + 1);
        }
        data?.forEach(s => {
            map.set(s.date, (map.get(s.date) || 0) + s.duration_minutes);
        });
        return Array.from(map.entries()).map(([date, minutes]) => ({ date, minutes }));
    },

    async getSubjectDistribution(dateRange: { from: string; to: string }): Promise<{ subject: string; minutes: number; color: string }[]> {
        const { from, to } = dateRange;
        const { data, error } = await supabase
            .from('study_sessions')
            .select('subject_id, duration_minutes, subjects(name, color)')
            .gte('date', from)
            .lte('date', to);
        if (error) throw new Error(error.message);
        const map = new Map<string, { minutes: number; color: string }>();
        data?.forEach((s: any) => {
            const subjectObj = s.subjects;
            const name = subjectObj?.name || 'بدون درس';
            const color = subjectObj?.color || '#94a3b8';
            if (!map.has(name)) {
                map.set(name, { minutes: 0, color });
            }
            map.get(name)!.minutes += s.duration_minutes;
        });
        return Array.from(map.entries()).map(([subject, { minutes, color }]) => ({ subject, minutes, color }));
    },

    async getRecentActivity(limit: number): Promise<{ action: string; user: string; time: string }[]> {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('action, created_at, users(name)')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (error) throw new Error(error.message);
        return (data || []).map((item: any) => ({
            action: item.action,
            user: item.users?.name || 'ناشناس',
            time: item.created_at,
        }));
    },

    computeRiskDistribution(distribution: { riskLevel: string; count: number }[]): { riskLevel: string; count: number }[] {
        const levels = ['low', 'medium', 'high', 'critical'];
        const map = new Map<string, number>();
        distribution.forEach(d => map.set(d.riskLevel, d.count));
        return levels.map(level => ({
            riskLevel: level,
            count: map.get(level) || 0,
        }));
    },

    async getRiskScoresBulk(userIds: string[]): Promise<{ userId: string; score: number }[]> {
        const { data, error } = await supabase
            .rpc('get_risk_scores_bulk', { p_user_ids: userIds });
        if (error) throw new Error(error.message);
        return data || [];
    }
};