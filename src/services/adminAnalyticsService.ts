import { supabase } from '../config/supabase';
import { queryDeduplicator } from '../utils/query-deduplicator';
import { today, daysAgo } from '../utils/date-utils';
import { logger } from '../utils/logger';
import { AdminAnalyticsData, Anomaly, Insight } from '../types/admin';

const CACHE_TTL = 5 * 60_000; // 5 minutes

export const adminAnalyticsService = {
    async getDashboardAnalytics(olympiadId: string | null, dateRange: 'today' | 'week' | 'month' | 'quarter'): Promise<AdminAnalyticsData> {
        const key = `admin_analytics_${olympiadId || 'all'}_${dateRange}_${today()}`;
        return queryDeduplicator.dedupedQuery(
            key,
            async () => {
                const dateRangeObj = this.getDateRange(dateRange);
                const [users, sessions, tests, olympiads, riskData, dailyStudy, subjectDist, recentActivity, anomalies, insights] = await Promise.all([
                    this.getUserStats(dateRangeObj, olympiadId),
                    this.getSessionStats(dateRangeObj, olympiadId),
                    this.getTestStats(dateRangeObj, olympiadId),
                    this.getOlympiadStats(olympiadId),
                    this.getRiskStats(olympiadId),
                    this.getDailyStudyTrend(dateRangeObj, olympiadId),
                    this.getSubjectDistribution(dateRangeObj, olympiadId),
                    this.getRecentActivity(10, olympiadId),
                    this.getAnomalies(dateRangeObj, olympiadId, 5),
                    this.getInsights(dateRangeObj, olympiadId, 5),
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
                    anomalies,
                    insights,
                };
            },
            CACHE_TTL
        );
    },

    getDateRange(dateRange: 'today' | 'week' | 'month' | 'quarter'): { from: string; to: string } {
        const to = today();
        let from = to;
        if (dateRange === 'today') {
            from = to;
        } else if (dateRange === 'week') {
            from = daysAgo(7);
        } else if (dateRange === 'month') {
            from = daysAgo(30);
        } else if (dateRange === 'quarter') {
            from = daysAgo(90);
        }
        return { from, to };
    },

    async getUserStats(dateRange: { from: string; to: string }, olympiadId: string | null): Promise<{ total: number; active: number }> {
        let query = supabase.from('users').select('id', { count: 'exact', head: true });
        if (olympiadId) {
            query = query.eq('olympiad_id', olympiadId);
        }
        const totalRes = await query;

        let activeQuery = supabase
            .from('study_sessions')
            .select('user_id', { count: 'exact', head: true })
            .gte('date', dateRange.from)
            .lte('date', dateRange.to);
        if (olympiadId) {
            activeQuery = activeQuery.eq('users.olympiad_id', olympiadId);
        }
        const activeRes = await activeQuery;

        return {
            total: totalRes.count || 0,
            active: activeRes.count || 0,
        };
    },

    async getSessionStats(dateRange: { from: string; to: string }, olympiadId: string | null): Promise<{ total: number; avgDaily: number; consistency: number }> {
        let query = supabase
            .from('study_sessions')
            .select('duration_minutes, date, users(olympiad_id)')
            .gte('date', dateRange.from)
            .lte('date', dateRange.to);
        if (olympiadId) {
            query = query.eq('users.olympiad_id', olympiadId);
        }
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        const total = data?.length || 0;
        const totalMinutes = data?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;
        const days = Math.max(1, (new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 60 * 60 * 24) + 1);
        const avgDaily = totalMinutes / days;
        const activeDays = new Set(data?.map(s => s.date) || []).size;
        const consistency = (activeDays / days) * 100;
        return { total, avgDaily, consistency };
    },

    async getTestStats(dateRange: { from: string; to: string }, olympiadId: string | null): Promise<{ total: number }> {
        let query = supabase
            .from('tests')
            .select('id', { count: 'exact', head: true })
            .gte('date', dateRange.from)
            .lte('date', dateRange.to);
        if (olympiadId) {
            query = query.eq('users.olympiad_id', olympiadId);
        }
        const { count, error } = await query;
        if (error) throw new Error(error.message);
        return { total: count || 0 };
    },

    async getOlympiadStats(olympiadId: string | null): Promise<{ olympiad: string; count: number }[]> {
        let query = supabase
            .from('users')
            .select('olympiad_id')
            .not('olympiad_id', 'is', null);
        if (olympiadId) {
            query = query.eq('olympiad_id', olympiadId);
        }
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        const map = new Map<string, number>();
        data?.forEach(u => {
            const key = u.olympiad_id || 'نامشخص';
            map.set(key, (map.get(key) || 0) + 1);
        });
        return Array.from(map.entries()).map(([olympiad, count]) => ({ olympiad, count }));
    },

    async getRiskStats(olympiadId: string | null): Promise<{ averageRisk: number; atRiskCount: number; recoveryScore: number; distribution: { riskLevel: string; count: number }[] }> {
        const { data, error } = await supabase.rpc('get_risk_distribution', { p_olympiad_id: olympiadId });
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

    async getDailyStudyTrend(dateRange: { from: string; to: string }, olympiadId: string | null): Promise<{ date: string; minutes: number; average: number }[]> {
        let query = supabase
            .from('study_sessions')
            .select('date, duration_minutes, users(olympiad_id)')
            .gte('date', dateRange.from)
            .lte('date', dateRange.to)
            .order('date', { ascending: true });
        if (olympiadId) {
            query = query.eq('users.olympiad_id', olympiadId);
        }
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        const map = new Map<string, { total: number; count: number }>();
        let current = new Date(dateRange.from);
        const end = new Date(dateRange.to);
        while (current <= end) {
            const d = current.toISOString().split('T')[0];
            map.set(d, { total: 0, count: 0 });
            current.setDate(current.getDate() + 1);
        }
        data?.forEach(s => {
            const entry = map.get(s.date);
            if (entry) {
                entry.total += s.duration_minutes;
                entry.count += 1;
            }
        });
        const result = Array.from(map.entries()).map(([date, { total, count }]) => ({
            date,
            minutes: total,
            average: count > 0 ? total / count : 0,
        }));
        return result;
    },

    async getSubjectDistribution(dateRange: { from: string; to: string }, olympiadId: string | null): Promise<{ subject: string; minutes: number; color: string }[]> {
        let query = supabase
            .from('study_sessions')
            .select('subject_id, duration_minutes, subjects(name, color), users(olympiad_id)')
            .gte('date', dateRange.from)
            .lte('date', dateRange.to);
        if (olympiadId) {
            query = query.eq('users.olympiad_id', olympiadId);
        }
        const { data, error } = await query;
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

    async getRecentActivity(limit: number, olympiadId: string | null): Promise<{ action: string; user: string; time: string }[]> {
        let query = supabase
            .from('activity_logs')
            .select('action, created_at, users(name, olympiad_id)')
            .order('created_at', { ascending: false })
            .limit(limit);
        if (olympiadId) {
            query = query.eq('users.olympiad_id', olympiadId);
        }
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        return (data || []).map((item: any) => ({
            action: item.action,
            user: item.users?.name || 'ناشناس',
            time: item.created_at,
        }));
    },

    async getAnomalies(dateRange: { from: string; to: string }, olympiadId: string | null, limit: number): Promise<Anomaly[]> {
        // For now, generate anomalies from study sessions and daily metrics
        // This is a simplified version; in production, you'd have a dedicated anomalies table or view.
        const { data: sessions } = await supabase
            .from('study_sessions')
            .select('user_id, date, duration_minutes, users(name, olympiad_id)')
            .gte('date', dateRange.from)
            .lte('date', dateRange.to);
        if (!sessions) return [];

        const userMap = new Map<string, { name: string; olympiad: string; dates: Set<string>; minutes: number[] }>();
        sessions.forEach((s: any) => {
            const uid = s.user_id;
            if (!userMap.has(uid)) {
                userMap.set(uid, {
                    name: s.users?.name || 'ناشناس',
                    olympiad: s.users?.olympiad_id || 'نامشخص',
                    dates: new Set(),
                    minutes: [],
                });
            }
            const entry = userMap.get(uid)!;
            entry.dates.add(s.date);
            entry.minutes.push(s.duration_minutes);
        });

        const anomalies: Anomaly[] = [];
        for (const [uid, data] of userMap) {
            // Check for gaps > 2 days
            const sortedDates = Array.from(data.dates).sort();
            for (let i = 1; i < sortedDates.length; i++) {
                const prev = new Date(sortedDates[i - 1]);
                const curr = new Date(sortedDates[i]);
                const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
                if (diff > 2) {
                    anomalies.push({
                        id: `${uid}_gap_${Date.now()}`,
                        student: data.name,
                        studentId: uid,
                        olympiad: data.olympiad,
                        description: `عدم مطالعه به مدت ${Math.floor(diff)} روز`,
                        date: sortedDates[i],
                        type: 'inactivity',
                        severity: diff > 5 ? 'high' : 'medium',
                        recommendation: 'برنامه مطالعه منظم تنظیم کنید و جلسات پیگیری روزانه ترتیب دهید.',
                    });
                }
            }
            // Check for sudden drop
            if (data.minutes.length >= 14) {
                const recent = data.minutes.slice(-7);
                const previous = data.minutes.slice(-14, -7);
                const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
                const prevAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
                if (prevAvg > 0 && recentAvg < prevAvg * 0.5) {
                    anomalies.push({
                        id: `${uid}_drop_${Date.now()}`,
                        student: data.name,
                        studentId: uid,
                        olympiad: data.olympiad,
                        description: `کاهش ناگهانی مطالعه: ${Math.round(recentAvg)} دقیقه در برابر ${Math.round(prevAvg)} دقیقه`,
                        date: today(),
                        type: 'drop',
                        severity: 'high',
                        recommendation: 'بررسی علت کاهش مطالعه و ارائه مشاوره فوری.',
                    });
                }
            }
        }
        anomalies.sort((a, b) => b.date.localeCompare(a.date));
        return anomalies.slice(0, limit);
    },

    async getInsights(dateRange: { from: string; to: string }, olympiadId: string | null, limit: number): Promise<Insight[]> {
        // Simplified insights generation
        const insights: Insight[] = [];
        // Top improver
        const { data: improvers } = await supabase
            .from('study_sessions')
            .select('user_id, duration_minutes, date, users(name, olympiad_id)')
            .gte('date', dateRange.from)
            .lte('date', dateRange.to);
        if (!improvers) return insights;

        const userMap = new Map<string, { name: string; olympiad: string; minutes: number[] }>();
        improvers.forEach((s: any) => {
            const uid = s.user_id;
            if (!userMap.has(uid)) {
                userMap.set(uid, {
                    name: s.users?.name || 'ناشناس',
                    olympiad: s.users?.olympiad_id || 'نامشخص',
                    minutes: [],
                });
            }
            userMap.get(uid)!.minutes.push(s.duration_minutes);
        });

        // Find top improver
        let bestImprover: { userId: string; name: string; olympiad: string; improvement: number } | null = null;
        for (const [uid, data] of userMap) {
            if (data.minutes.length >= 14) {
                const recent = data.minutes.slice(-7);
                const previous = data.minutes.slice(-14, -7);
                const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
                const prevAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
                if (prevAvg > 0) {
                    const improvement = ((recentAvg - prevAvg) / prevAvg) * 100;
                    if (improvement > 20 && (!bestImprover || improvement > bestImprover.improvement)) {
                        bestImprover = { userId: uid, name: data.name, olympiad: data.olympiad, improvement };
                    }
                }
            }
        }
        if (bestImprover) {
            insights.push({
                id: `improver_${Date.now()}`,
                title: 'پیشرفت قابل توجه',
                description: `${bestImprover.name} با افزایش ${Math.round(bestImprover.improvement)}% در مطالعه، در حال پیشرفت سریع است.`,
                recommendation: 'این دانش‌آموز را تشویق کنید و از او بخواهید تجربه‌های خود را با دیگران به اشتراک بگذارد.',
                date: today(),
                type: 'achievement',
                studentId: bestImprover.userId,
                studentName: bestImprover.name,
                olympiad: bestImprover.olympiad,
            });
        }

        // Students with low consistency
        const lowConsistency: { userId: string; name: string; olympiad: string; consistency: number }[] = [];
        for (const [uid, data] of userMap) {
            if (data.minutes.length > 0) {
                const days = (new Date(dateRange.to).getTime() - new Date(dateRange.from).getTime()) / (1000 * 60 * 60 * 24) + 1;
                const activeDays = new Set(improvers.filter((s: any) => s.user_id === uid).map((s: any) => s.date)).size;
                const consistency = (activeDays / days) * 100;
                if (consistency < 30) {
                    lowConsistency.push({ userId: uid, name: data.name, olympiad: data.olympiad, consistency });
                }
            }
        }
        lowConsistency.sort((a, b) => a.consistency - b.consistency);
        lowConsistency.slice(0, 2).forEach(s => {
            insights.push({
                id: `consistency_${s.userId}_${Date.now()}`,
                title: 'ثبات پایین مطالعه',
                description: `${s.name} با ${Math.round(s.consistency)}% ثبات، نیاز به برنامه‌ریزی منظم دارد.`,
                recommendation: 'برنامه مطالعه روزانه با اهداف کوچک تنظیم کنید و جلسات پیگیری هفتگی ترتیب دهید.',
                date: today(),
                type: 'warning',
                studentId: s.userId,
                studentName: s.name,
                olympiad: s.olympiad,
            });
        });

        return insights.slice(0, limit);
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