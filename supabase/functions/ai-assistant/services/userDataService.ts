import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.ts';

const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
);

export interface UserStudySummary {
    userId: string;
    totalSessions: number;
    totalMinutes: number;
    averageDailyMinutes: number;
    daysActive: number;
    currentStreak: number;
    longestStreak: number;
    topSubjects: Array<{ name: string; minutes: number }>;
    recentTestScores: Array<{ name: string; score: number; maxScore: number }>;
    averageTestScore: number;
    goalProgress: Array<{ title: string; progress: number }>;
}

export async function fetchUserStudyData(userId: string): Promise<UserStudySummary> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: sessions, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('date, duration_minutes, subject_id, subjects(name)')
        .eq('user_id', userId)
        .gte('date', startDate);

    if (sessionsError) throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);

    const { data: tests, error: testsError } = await supabase
        .from('tests')
        .select('name, score, max_score')
        .eq('user_id', userId)
        .gte('date', startDate);

    if (testsError) throw new Error(`Failed to fetch tests: ${testsError.message}`);

    const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('title, target_minutes, status')
        .eq('user_id', userId)
        .in('status', ['active', 'completed']); // FIX: Included 'completed' so downstream logic works

    if (goalsError) throw new Error(`Failed to fetch goals: ${goalsError.message}`);

    const { data: streak, error: streakError } = await supabase
        .from('streaks')
        .select('current_streak, longest_streak')
        .eq('user_id', userId)
        .single();

    if (streakError && streakError.code !== 'PGRST116') {
        throw new Error(`Failed to fetch streaks: ${streakError.message}`);
    }

    const sessionsList = sessions || [];
    const testsList = tests || [];
    const goalsList = goals || [];

    const totalMinutes = sessionsList.reduce((acc, s) => acc + s.duration_minutes, 0);
    const totalSessions = sessionsList.length;
    const uniqueDays = new Set(sessionsList.map(s => s.date));
    const daysActive = uniqueDays.size;
    const averageDailyMinutes = daysActive > 0 ? Math.round(totalMinutes / daysActive) : 0;

    const subjectMinutes: Record<string, number> = {};
    for (const s of sessionsList) {
        if (s.subjects?.name) {
            subjectMinutes[s.subjects.name] = (subjectMinutes[s.subjects.name] || 0) + s.duration_minutes;
        }
    }
    const topSubjects = Object.entries(subjectMinutes)
        .map(([name, minutes]) => ({ name, minutes }))
        .sort((a, b) => b.minutes - a.minutes)
        .slice(0, 5);

    const testScores = testsList.map(t => ({
        name: t.name || 'Test',
        score: t.score,
        maxScore: t.max_score || 100,
    }));
    const averageTestScore = testScores.length > 0
        ? Math.round(testScores.reduce((acc, t) => acc + (t.score / t.maxScore) * 100, 0) / testScores.length)
        : 0;

    const goalProgress = goalsList.map(g => ({
        title: g.title,
        progress: g.status === 'completed' ? 100 : 50,
    }));

    return {
        userId,
        totalSessions,
        totalMinutes,
        averageDailyMinutes,
        daysActive,
        currentStreak: streak?.current_streak || 0,
        longestStreak: streak?.longest_streak || 0,
        topSubjects,
        recentTestScores: testScores.slice(0, 10),
        averageTestScore,
        goalProgress,
    };
}