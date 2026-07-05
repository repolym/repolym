export interface DailyMetric {
    id: string
    user_id: string
    date: string
    sleep_hours: number | null
    bedtime: string | null   // جدید
    wake_time: string | null // جدید
    phone_usage_minutes: number | null
    created_at: string
    updated_at: string
}

export interface DailyMetricFormData {
    date: string
    sleep_hours?: number | null
    phone_usage_minutes?: number | null
    bedtime?: string | null   // جدید
    wake_time?: string | null // جدید
}

export interface AnalyticsSnapshot {
    productivity_score: {
        productivity_score: number
        components: {
            consistency: number
            goal_completion: number
            test_performance: number
            effective_study_time: number
        }
    }
    recovery_score: {
        recovery_score: number
        components: {
            sleep_consistency: number
            gap_recovery: number
            phone_usage_impact: number
        }
    }
    study_streak: {
        current_streak: number
        longest_streak: number
        last_study_date: string | null
    }
    study_consistency: {
        consistency_score: number
        active_days: number
        total_days: number
        target_active_days: number
    }
    study_trend: {
        direction: 'increasing' | 'decreasing' | 'stable' | 'insufficient_data'
        slope: number
        average_change_per_day: number
        period_days: number
    }
    moving_average: Array<{
        date: string
        minutes: number
        moving_avg_7d: number
    }>
    best_worst_day: {
        best_date: string | null
        best_date_minutes: number | null
        worst_date: string | null
        worst_date_minutes: number | null
        best_weekday_iso: number | null
        weekday_averages: Record<string, number> | null
    }
    subject_distribution: Array<{
        subject_id: string
        subject_name: string
        color: string
        minutes: number
        percent: number
    }>
    sleep_statistics: {
        avg_sleep_hours: number | null
        min_sleep_hours: number | null
        max_sleep_hours: number | null
        logged_days: number
    }
    phone_usage_statistics: {
        avg_phone_minutes: number | null
        min_phone_minutes: number | null
        max_phone_minutes: number | null
        logged_days: number
    }
    personal_baseline: {
        baseline_avg_minutes: number
        baseline_avg_minutes_active_days: number
        baseline_days: number
    }
    progress_trend: {
        direction: 'improving' | 'declining' | 'stable' | 'insufficient_data'
        percent_change_vs_baseline: number | null
        current_avg_minutes: number | null
    }
    date_range: {
        start_date: string
        end_date: string
        range_days: number
    }
    generated_at: string

    // ===== Performance (solved tests) — merged from the former "Performance" tab =====
    test_stats: {
        total_tests: number
        accuracy_percent: number
        correct_percent: number
        wrong_percent: number
        skipped_percent: number
        avg_time_seconds: number | null
        trend: 'up' | 'down' | 'stable' | 'insufficient_data'
    }
    subject_test_stats: Array<{
        subject_id: string | null
        subject_name: string
        color: string
        tests_count: number
        avg_accuracy_percent: number
    }>
    difficulty_distribution: Array<{
        difficulty: string
        sessions_count: number
        minutes: number
        percent: number
    }>
    weekly_trend: Array<{
        week_start: string
        minutes: number
        tests_count: number
        avg_accuracy_percent: number
    }>
    monthly_trend: Array<{
        month: string
        minutes: number
        tests_count: number
        avg_accuracy_percent: number
    }>
}

// Persian weekday labels
export const WEEKDAY_LABELS_FA: Record<number, string> = {
    1: 'شنبه',
    2: 'یکشنبه',
    3: 'دوشنبه',
    4: 'سه‌شنبه',
    5: 'چهارشنبه',
    6: 'پنج‌شنبه',
    7: 'جمعه',
}