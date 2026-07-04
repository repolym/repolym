
// =============================================
// انواع داده برای لیدربورد المپیاد
// =============================================

export interface LeaderboardEntry {
    rank: number
    user_id: string
    name: string
    total_minutes_30: number
    active_days_30: number
    best_streak: number
    avg_test_score: number
    composite_score: number
}

export interface LeaderboardSnapshot {
    olympiad_id: string
    generated_at: string
    total_users: number
    entries: LeaderboardEntry[]
}
