import { supabase } from '../config/supabase';
import { queryDeduplicator } from '../utils/query-deduplicator';
import { today, daysAgo } from '../utils/date-utils';
import { logger } from '../utils/logger';

export interface Anomaly {
    id: string;
    student: string;
    studentId: string;
    description: string;
    date: string;
    type: 'drop' | 'increase' | 'inactivity' | 'sleep' | 'phone' | 'burnout' | 'irregular' | 'missing';
    severity: 'low' | 'medium' | 'high';
}

export interface Insight {
    id: string;
    title: string;
    description: string;
    recommendation: string;
    date: string;
    type: 'improvement' | 'risk' | 'achievement' | 'suggestion' | 'warning';
    studentId?: string;
    studentName?: string;
}

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
    dailyStudy: { date: string; minutes: number; average: number }[];
    subjectDistribution: { subject: string; minutes: number; color: string }[];
    riskDistribution: { riskLevel: string; count: number }[];
    anomalies: Anomaly[];
    insights: Insight[];
    recentActivity: { action: string; user: string; time: string }[];
}

const CACHE_TTL = 5 * 60_000; // 5 minutes

export const adminAnalyticsService = {
    async getDashboardAnalytics(olympiadId: string | null, dateRange: 'today' | 'week' | 'month' | 'quarter'): Promise<AdminAnalyticsData> {
        const key = `admin_analytics_${olympiadId || 'all'}_${dateRange}_${today()}`;
        return queryDeduplicator.dedupedQuery(
            key,
            async () => {
                const dateRangeObj = this.getDateRange(dateRange);
                const [users, sessions, tests, olympiads, riskData, dailyStudy, subjectDist, anomalies, insights, recentActivity] = await Promise.all([
                    this.getUserStats(dateRangeObj),
                    this.getSessionStats(dateRangeObj),
                    this.getTestStats(dateRangeObj),
                    this.getOlympiadStats(),
                    this.getRiskStats(olympiadId),
                    this.getDailyStudyTrend(dateRangeObj, olympiadId),
                    this.getSubjectDistribution(dateRangeObj, olympiadId),
                    this.getAnomalies(dateRangeObj, olympiadId, 10),
                    this.getInsights(dateRangeObj, olympiadId, 5),
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
                    anomalies,
                    insights,
                    recentActivity,
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

    async getDailyStudyTrend(dateRange: { from: string; to: string }, _olympiadId: string | null): Promise<{ date: string; minutes: number; average: number }[]> {
        const { from, to } = dateRange;
        let query = supabase
            .from('study_sessions')
            .select('date, duration_minutes')
            .gte('date', from)
            .lte('date', to)
            .order('date', { ascending: true });
        // TODO: filter by olympiadId using a join with users table
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        const map = new Map<string, { total: number; _count: number }>();
        let current = new Date(from);
        const end = new Date(to);
        while (current <= end) {
            const d = current.toISOString().split('T')[0];
            map.set(d, { total: 0, _count: 0 });
            current.setDate(current.getDate() + 1);
        }
        data?.forEach(s => {
            const entry = map.get(s.date);
            if (entry) {
                entry.total += s.duration_minutes;
                entry._count += 1;
            }
        });
        // For average, we compute the average across all users for each day
        // We need total users count
        const { count: totalUsers } = await supabase.from('users').select('id', { count: 'exact', head: true });
        const userCount = totalUsers || 1;
        return Array.from(map.entries()).map(([date, { total }]) => ({
            date,
            minutes: total,
            average: total / userCount,
        }));
    },

    async getSubjectDistribution(dateRange: { from: string; to: string }, _olympiadId: string | null): Promise<{ subject: string; minutes: number; color: string }[]> {
        const { from, to } = dateRange;
        let query = supabase
            .from('study_sessions')
            .select('subject_id, duration_minutes, subjects(name, color)')
            .gte('date', from)
            .lte('date', to);
        // TODO: filter by olympiadId using a join with users table
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

    async getAnomalies(dateRange: { from: string; to: string }, _olympiadId: string | null, limit: number): Promise<Anomaly[]> {
        // For now, we compute anomalies from study_sessions and daily_metrics
        // We'll implement a detection algorithm.
        const { from, to } = dateRange;
        // Fetch study data for all users
        let query = supabase
            .from('study_sessions')
            .select('user_id, date, duration_minutes')
            .gte('date', from)
            .lte('date', to)
            .order('date', { ascending: true });
        // TODO: filter by olympiadId
        const { data: sessions, error } = await query;
        if (error) throw new Error(error.message);

        // Get user names and olympiad if needed
        const userIds = [...new Set(sessions?.map(s => s.user_id) || [])];
        let usersQuery = supabase.from('users').select('id, name');
        // TODO: filter by olympiadId if needed
        const { data: users } = await usersQuery.in('id', userIds);
        const userMap = new Map(users?.map(u => [u.id, u.name]) || []);

        const anomalies: Anomaly[] = [];
        // Group sessions by user
        const userSessions = new Map<string, { date: string; minutes: number }[]>();
        sessions?.forEach(s => {
            if (!userSessions.has(s.user_id)) {
                userSessions.set(s.user_id, []);
            }
            userSessions.get(s.user_id)!.push({ date: s.date, minutes: s.duration_minutes });
        });

        for (const [userId, sessionList] of userSessions) {
            const name = userMap.get(userId) || 'کاربر ناشناس';
            sessionList.sort((a, b) => a.date.localeCompare(b.date));
            let lastDate: Date | null = null;
            for (const s of sessionList) {
                const current = new Date(s.date);
                if (lastDate) {
                    const diff = (current.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
                    if (diff > 2) {
                        anomalies.push({
                            id: `${userId}_gap_${lastDate.toISOString()}`,
                            student: name,
                            studentId: userId,
                            description: `عدم مطالعه به مدت ${Math.floor(diff)} روز (از ${lastDate.toISOString().split('T')[0]} تا ${current.toISOString().split('T')[0]})`,
                            date: current.toISOString().split('T')[0],
                            type: 'inactivity',
                            severity: diff > 5 ? 'high' : 'medium',
                        });
                    }
                }
                lastDate = current;
            }
            if (sessionList.length >= 14) {
                const recent = sessionList.slice(-7);
                const previous = sessionList.slice(-14, -7);
                const recentAvg = recent.reduce((sum, s) => sum + s.minutes, 0) / recent.length;
                const prevAvg = previous.reduce((sum, s) => sum + s.minutes, 0) / previous.length;
                if (prevAvg > 0 && recentAvg < prevAvg * 0.5) {
                    anomalies.push({
                        id: `${userId}_drop_${today()}`,
                        student: name,
                        studentId: userId,
                        description: `کاهش ناگهانی مطالعه: میانگین ${Math.round(recentAvg)} دقیقه در برابر ${Math.round(prevAvg)} دقیقه قبل`,
                        date: today(),
                        type: 'drop',
                        severity: 'high',
                    });
                }
            }
        }
        return anomalies.slice(0, limit);
    },

    async getInsights(dateRange: { from: string; to: string }, _olympiadId: string | null, limit: number): Promise<Insight[]> {
        // For now, we generate insights from the same data
        const insights: Insight[] = [];
        const { from, to } = dateRange;

        // Get top improvers
        const improvers = await this.getTopImprovers(from, to);
        if (improvers.length > 0) {
            const top = improvers[0];
            insights.push({
                id: `improver_${Date.now()}`,
                title: 'پیشرفت قابل توجه',
                description: `${top.name} با افزایش ${Math.round(top.increase)}% در مطالعه، در حال پیشرفت سریع است.`,
                recommendation: 'این دانش‌آموز را تشویق کنید و از او بخواهید تجربه‌های خود را با دیگران به اشتراک بگذارد.',
                date: today(),
                type: 'achievement',
                studentId: top.userId,
                studentName: top.name,
            });
        }

        // Students at risk
        const atRisk = await this.getStudentsAtRisk(from, to);
        atRisk.slice(0, 2).forEach(s => {
            insights.push({
                id: `risk_${s.userId}_${Date.now()}`,
                title: 'دانش‌آموز در معرض خطر',
                description: `${s.name} با ${Math.round(s.consistency)}% ثبات و ${Math.round(s.phoneMinutes)} دقیقه استفاده از گوشی، نیاز به توجه دارد.`,
                recommendation: 'یک جلسه مشاوره برای بررسی برنامه مطالعه و مدیریت زمان گوشی ترتیب دهید.',
                date: today(),
                type: 'warning',
                studentId: s.userId,
                studentName: s.name,
            });
        });

        // Top performer
        const topPerformer = await this.getTopPerformer(from, to);
        if (topPerformer) {
            insights.push({
                id: `top_${Date.now()}`,
                title: 'دانش‌آموز نمونه',
                description: `${topPerformer.name} با میانگین ${Math.round(topPerformer.avgMinutes)} دقیقه مطالعه روزانه و ${Math.round(topPerformer.consistency)}% ثبات، الگوی عالی است.`,
                recommendation: 'از او بخواهید روش‌های مطالعه خود را در یک جلسه اشتراک‌گذاری کند.',
                date: today(),
                type: 'improvement',
                studentId: topPerformer.userId,
                studentName: topPerformer.name,
            });
        }

        // Sleep suggestion
        const sleepIssues = await this.getSleepIssues(from, to);
        if (sleepIssues.length > 0) {
            const s = sleepIssues[0];
            insights.push({
                id: `sleep_${Date.now()}`,
                title: 'توصیه بهبود خواب',
                description: `${s.name} با میانگین ${s.avgSleep} ساعت خواب، کمتر از حد توصیه شده است.`,
                recommendation: 'پیشنهاد تنظیم برنامه خواب و کاهش استفاده از گوشی قبل از خواب.',
                date: today(),
                type: 'suggestion',
                studentId: s.userId,
                studentName: s.name,
            });
        }

        return insights.slice(0, limit);
    },

    async getTopImprovers(from: string, to: string): Promise<{ userId: string; name: string; increase: number }[]> {
        const mid = new Date((new Date(to).getTime() + new Date(from).getTime()) / 2).toISOString().split('T')[0];
        const recent = await this.getUserStudyStats(from, mid);
        const prev = await this.getUserStudyStats(mid, to);
        const result: { userId: string; name: string; increase: number }[] = [];
        for (const [userId, stats] of recent) {
            const prevStats = prev.get(userId);
            if (prevStats && prevStats.avg > 0) {
                const increase = ((stats.avg - prevStats.avg) / prevStats.avg) * 100;
                if (increase > 20) {
                    result.push({ userId, name: stats.name, increase });
                }
            }
        }
        result.sort((a, b) => b.increase - a.increase);
        return result;
    },

    async getUserStudyStats(from: string, to: string): Promise<Map<string, { avg: number; name: string }>> {
        let query = supabase
            .from('study_sessions')
            .select('user_id, duration_minutes, users(name)')
            .gte('date', from)
            .lte('date', to);
        const { data, error } = await query;
        if (error) throw new Error(error.message);
        const map = new Map<string, { total: number; count: number; name: string }>();
        data?.forEach((s: any) => {
            const uid = s.user_id;
            const name = s.users?.name || 'ناشناس';
            if (!map.has(uid)) {
                map.set(uid, { total: 0, count: 0, name });
            }
            const entry = map.get(uid)!;
            entry.total += s.duration_minutes;
            entry.count += 1;
        });
        const result = new Map<string, { avg: number; name: string }>();
        for (const [uid, entry] of map) {
            result.set(uid, { avg: entry.total / entry.count, name: entry.name });
        }
        return result;
    },

    async getStudentsAtRisk(from: string, to: string): Promise<{ userId: string; name: string; consistency: number; phoneMinutes: number }[]> {
        const { data: sessions } = await supabase
            .from('study_sessions')
            .select('user_id, date, duration_minutes, users(name)')
            .gte('date', from)
            .lte('date', to);
        if (!sessions) return [];
        const userMap = new Map<string, { dates: Set<string>; name: string }>();
        sessions.forEach((s: any) => {
            const uid = s.user_id;
            if (!userMap.has(uid)) {
                userMap.set(uid, { dates: new Set(), name: s.users?.name || 'ناشناس' });
            }
            userMap.get(uid)!.dates.add(s.date);
        });
        const days = (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24) + 1;
        const result: { userId: string; name: string; consistency: number; phoneMinutes: number }[] = [];
        for (const [uid, { dates, name }] of userMap) {
            const consistency = (dates.size / days) * 100;
            const { data: metrics } = await supabase
                .from('daily_metrics')
                .select('phone_usage_minutes')
                .eq('user_id', uid)
                .gte('date', from)
                .lte('date', to);
            const total = metrics?.reduce((sum, m) => sum + (m.phone_usage_minutes || 0), 0) || 0;
            const phoneAvg = metrics?.length ? total / metrics.length : 0;
            if (consistency < 50 || phoneAvg > 120) {
                result.push({ userId: uid, name, consistency, phoneMinutes: phoneAvg });
            }
        }
        return result;
    },

    async getTopPerformer(from: string, to: string): Promise<{ userId: string; name: string; avgMinutes: number; consistency: number } | null> {
        const { data: sessions } = await supabase
            .from('study_sessions')
            .select('user_id, date, duration_minutes, users(name)')
            .gte('date', from)
            .lte('date', to);
        if (!sessions || sessions.length === 0) return null;
        const userMap = new Map<string, { total: number; dates: Set<string>; name: string }>();
        sessions.forEach((s: any) => {
            const uid = s.user_id;
            if (!userMap.has(uid)) {
                userMap.set(uid, { total: 0, dates: new Set(), name: s.users?.name || 'ناشناس' });
            }
            const entry = userMap.get(uid)!;
            entry.total += s.duration_minutes;
            entry.dates.add(s.date);
        });
        const days = Math.max(1, (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24) + 1);
        let best: { userId: string; name: string; avgMinutes: number; consistency: number } | null = null;
        for (const [uid, { total, dates, name }] of userMap) {
            const avg = total / days;
            const consistency = (dates.size / days) * 100;
            if (!best || avg > best.avgMinutes) {
                best = { userId: uid, name, avgMinutes: avg, consistency };
            }
        }
        return best;
    },

    async getSleepIssues(from: string, to: string): Promise<{ userId: string; name: string; avgSleep: number }[]> {
        const { data: metrics } = await supabase
            .from('daily_metrics')
            .select('user_id, sleep_hours, users(name)')
            .gte('date', from)
            .lte('date', to);
        if (!metrics) return [];
        const map = new Map<string, { total: number; count: number; name: string }>();
        metrics.forEach((m: any) => {
            const uid = m.user_id;
            if (!map.has(uid)) {
                map.set(uid, { total: 0, count: 0, name: m.users?.name || 'ناشناس' });
            }
            const entry = map.get(uid)!;
            entry.total += m.sleep_hours || 0;
            entry.count += 1;
        });
        const result: { userId: string; name: string; avgSleep: number }[] = [];
        for (const [uid, { total, count, name }] of map) {
            const avg = count > 0 ? total / count : 0;
            if (avg > 0 && avg < 6) {
                result.push({ userId: uid, name, avgSleep: avg });
            }
        }
        return result;
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
};