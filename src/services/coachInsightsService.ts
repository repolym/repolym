import { supabase } from '../config/supabase';
import { today, daysAgo } from '../utils/date-utils';

export interface CoachInsight {
    id: string;
    title: string;
    description: string;
    recommendation: string;
    date: string;
    type: 'improvement' | 'risk' | 'achievement' | 'suggestion' | 'warning';
    studentId?: string;
    studentName?: string;
}

export const coachInsightsService = {
    async getInsights(timeRange: 'today' | 'week' | 'month' | 'quarter', limit: number = 5): Promise<CoachInsight[]> {
        const { from, to } = this.getDateRange(timeRange);
        const insights: CoachInsight[] = [];

        // 1. Students with highest improvement
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

        // 2. Students at risk
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

        // 3. Top performer
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

        // 4. Sleep improvement suggestion
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

        // 5. Weekly summary
        const weeklySummary = await this.getWeeklySummary(from, to);
        insights.push({
            id: `weekly_${Date.now()}`,
            title: 'خلاصه هفتگی',
            description: `این هفته ${weeklySummary.activeStudents} دانش‌آموز فعال بودند. میانگین مطالعه ${Math.round(weeklySummary.avgMinutes)} دقیقه در روز.`,
            recommendation: `تعداد دانش‌آموزان غیرفعال: ${weeklySummary.inactiveStudents}. برنامه‌ای برای فعال‌سازی آن‌ها تدوین کنید.`,
            date: today(),
            type: 'suggestion',
        });

        return insights.slice(0, limit);
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
        const { data, error } = await supabase
            .from('study_sessions')
            .select('user_id, duration_minutes, users(name)')
            .gte('date', from)
            .lte('date', to);
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

    async getWeeklySummary(from: string, to: string): Promise<{ activeStudents: number; inactiveStudents: number; avgMinutes: number }> {
        const { data: sessions } = await supabase
            .from('study_sessions')
            .select('user_id, duration_minutes')
            .gte('date', from)
            .lte('date', to);
        const active = new Set(sessions?.map(s => s.user_id) || []).size;
        const { count: totalUsers } = await supabase.from('users').select('id', { count: 'exact', head: true });
        const inactive = (totalUsers || 0) - active;
        const totalMinutes = sessions?.reduce((sum, s) => sum + s.duration_minutes, 0) || 0;
        const days = Math.max(1, (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24) + 1);
        const avgMinutes = totalMinutes / days;
        return { activeStudents: active, inactiveStudents: inactive || 0, avgMinutes };
    }
};