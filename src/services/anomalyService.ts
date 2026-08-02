import { supabase } from '../config/supabase';
import { today, daysAgo } from '../utils/date-utils';

export interface Anomaly {
    id: string;
    student: string;
    studentId: string;
    description: string;
    date: string;
    type: 'drop' | 'increase' | 'inactivity' | 'sleep' | 'phone' | 'burnout' | 'irregular' | 'missing';
    severity: 'low' | 'medium' | 'high';
}

export const anomalyService = {
    async getRecentAnomalies(timeRange: 'today' | 'week' | 'month' | 'quarter', limit: number = 10): Promise<Anomaly[]> {
        // For now, we compute anomalies from study_sessions and daily_metrics
        // We'll implement a detection algorithm.
        const { from, to } = this.getDateRange(timeRange);
        // Fetch study data for all users
        const { data: sessions, error } = await supabase
            .from('study_sessions')
            .select('user_id, date, duration_minutes')
            .gte('date', from)
            .lte('date', to)
            .order('date', { ascending: true });
        if (error) throw new Error(error.message);

        // Get user names
        const userIds = [...new Set(sessions?.map(s => s.user_id) || [])];
        const { data: users } = await supabase
            .from('users')
            .select('id, name')
            .in('id', userIds);

        const userMap = new Map(users?.map(u => [u.id, u.name]) || []);

        // Detect anomalies: sudden drop in study time, inactivity, etc.
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
            // Sort by date
            sessionList.sort((a, b) => a.date.localeCompare(b.date));
            // Check for days without study (gap > 2 days)
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
            // Check for sudden drop: compare last 7 days vs previous 7 days
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

        // Limit
        return anomalies.slice(0, limit);
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
};