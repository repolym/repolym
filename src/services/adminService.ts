// src/services/adminService.ts
import { supabase } from '../config/supabase'
import type { User, ActivityLog, StudySession } from '../types/database'
import { formatError } from '../utils/error-handler'

export class AdminServiceError extends Error { }

export const adminService = {
    // ---------- Users ----------
    async getUsers(filters?: {
        search?: string
        status?: 'active' | 'suspended' | 'all'
        isAdmin?: boolean
        olympiadId?: string | null
        dateFrom?: string
        dateTo?: string
        page?: number
        limit?: number
        sortBy?: string
        sortOrder?: 'asc' | 'desc'
    }): Promise<{ users: User[]; total: number }> {
        const page = filters?.page || 1
        const limit = filters?.limit || 20
        const offset = (page - 1) * limit
        const sortBy = filters?.sortBy || 'created_at'
        const sortOrder = filters?.sortOrder || 'desc'

        let query = supabase
            .from('users')
            .select('*', { count: 'exact' })
            .order(sortBy, { ascending: sortOrder === 'asc' })
            .range(offset, offset + limit - 1)

        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
        }
        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status)
        }
        if (filters?.isAdmin !== undefined) {
            query = query.eq('is_admin', filters.isAdmin)
        }
        if (filters?.olympiadId) {
            query = query.eq('olympiad_id', filters.olympiadId)
        }
        if (filters?.dateFrom) {
            query = query.gte('created_at', filters.dateFrom)
        }
        if (filters?.dateTo) {
            query = query.lte('created_at', filters.dateTo)
        }

        const { data, error, count } = await query
        if (error) throw new AdminServiceError(formatError(error))
        return { users: data as User[], total: count || 0 }
    },

    async getUserById(userId: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single()
        if (error) {
            if (error.code === 'PGRST116') return null
            throw new AdminServiceError(formatError(error))
        }
        return data as User
    },

    async getUserStats(userId: string): Promise<{
        totalSessions: number
        totalMinutes: number
        totalTests: number
        avgTestScore: number
        currentStreak: number
        longestStreak: number
    }> {
        const [sessionsRes, testsRes, streakRes] = await Promise.all([
            supabase
                .from('study_sessions')
                .select('duration_minutes', { count: 'exact' })
                .eq('user_id', userId),
            supabase
                .from('tests')
                .select('score, max_score', { count: 'exact' })
                .eq('user_id', userId),
            supabase
                .from('streaks')
                .select('current_streak, longest_streak')
                .eq('user_id', userId)
                .single()
        ])

        if (sessionsRes.error) throw new AdminServiceError(formatError(sessionsRes.error))
        if (testsRes.error) throw new AdminServiceError(formatError(testsRes.error))

        const totalSessions = sessionsRes.count || 0
        const totalMinutes = (sessionsRes.data || []).reduce((sum, s) => sum + s.duration_minutes, 0)
        const totalTests = testsRes.count || 0
        const avgTestScore = totalTests > 0
            ? (testsRes.data || []).reduce((sum, t) => sum + (t.score / (t.max_score || 100)) * 100, 0) / totalTests
            : 0

        let currentStreak = 0
        let longestStreak = 0
        if (streakRes.data) {
            currentStreak = streakRes.data.current_streak || 0
            longestStreak = streakRes.data.longest_streak || 0
        }

        return { totalSessions, totalMinutes, totalTests, avgTestScore, currentStreak, longestStreak }
    },

    async getUserSessions(userId: string, limit = 50, offset = 0): Promise<StudySession[]> {
        const { data, error } = await supabase
            .from('study_sessions')
            .select('*, subjects(id, name, color)')
            .eq('user_id', userId)
            .order('date', { ascending: false })
            .range(offset, offset + limit - 1)
        if (error) throw new AdminServiceError(formatError(error))
        return data as StudySession[]
    },

    async getUserActivityLogs(userId: string, limit = 50): Promise<ActivityLog[]> {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(limit)
        if (error) throw new AdminServiceError(formatError(error))
        return data as ActivityLog[]
    },

    // ---------- Admin actions ----------
    async suspendUser(userId: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ status: 'suspended', updated_at: new Date().toISOString() })
            .eq('id', userId)
        if (error) throw new AdminServiceError(formatError(error))
    },

    async activateUser(userId: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('id', userId)
        if (error) throw new AdminServiceError(formatError(error))
    },

    async deleteUser(userId: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ deleted_at: new Date().toISOString(), status: 'suspended' })
            .eq('id', userId)
        if (error) throw new AdminServiceError(formatError(error))
    },

    async makeAdmin(userId: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ is_admin: true, updated_at: new Date().toISOString() })
            .eq('id', userId)
        if (error) throw new AdminServiceError(formatError(error))
    },

    async removeAdmin(userId: string): Promise<void> {
        const { error } = await supabase
            .from('users')
            .update({ is_admin: false, updated_at: new Date().toISOString() })
            .eq('id', userId)
        if (error) throw new AdminServiceError(formatError(error))
    },

    // ---------- Activity Logs ----------
    async getActivityLogs(limit = 100): Promise<ActivityLog[]> {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*, users(id, name, email)')
            .order('created_at', { ascending: false })
            .limit(limit)
        if (error) throw new AdminServiceError(formatError(error))
        return data as ActivityLog[]
    },

    async logActivity(userId: string, action: string, details?: Record<string, unknown>): Promise<void> {
        const { error } = await supabase
            .from('activity_logs')
            .insert([{ user_id: userId, action, details }])
        if (error) throw new AdminServiceError(formatError(error))
    },

    // ---------- Dashboard Stats ----------
    async getStats(): Promise<{
        totalUsers: number
        totalSessions: number
        totalTests: number
        activeToday: number
        newUsersToday: number
        newUsersWeek: number
        newUsersMonth: number
        totalOlympiads: number
        recentUsers: User[]
        recentActivity: ActivityLog[]
    }> {
        const todayStr = new Date().toISOString().split('T')[0]
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        const weekAgoStr = weekAgo.toISOString().split('T')[0]
        const monthAgo = new Date()
        monthAgo.setDate(monthAgo.getDate() - 30)
        const monthAgoStr = monthAgo.toISOString().split('T')[0]

        const [
            usersRes,
            sessionsRes,
            testsRes,
            activeRes,
            newTodayRes,
            newWeekRes,
            newMonthRes,
            olympiadsRes,
            recentUsersRes,
            recentLogsRes,
        ] = await Promise.all([
            supabase.from('users').select('id', { count: 'exact', head: true }),
            supabase.from('study_sessions').select('id', { count: 'exact', head: true }),
            supabase.from('tests').select('id', { count: 'exact', head: true }),
            supabase
                .from('study_sessions')
                .select('user_id', { count: 'exact', head: true })
                .eq('date', todayStr)
                .limit(1000),
            supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', todayStr),
            supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', weekAgoStr),
            supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .gte('created_at', monthAgoStr),
            // Supabase's JS client has no COUNT(DISTINCT col) — fetch the
            // olympiad_id column and dedupe client-side (same approach used
            // in OlympiadManagement.tsx). The previous head-count query
            // counted *students who have an olympiad set*, not the number
            // of distinct olympiads, which showed the wrong number under
            // "تعداد المپیادها".
            supabase
                .from('users')
                .select('olympiad_id')
                .not('olympiad_id', 'is', null),
            supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5),
            supabase
                .from('activity_logs')
                .select('*, users(id, name, email)')
                .order('created_at', { ascending: false })
                .limit(5),
        ])

        const firstError = [usersRes.error, sessionsRes.error, testsRes.error, activeRes.error,
        newTodayRes.error, newWeekRes.error, newMonthRes.error, olympiadsRes.error,
        recentUsersRes.error, recentLogsRes.error].find(e => e)
        if (firstError) throw new AdminServiceError(formatError(firstError))

        const distinctOlympiads = new Set(
            (olympiadsRes.data || [])
                .map((row: { olympiad_id: string | null }) => row.olympiad_id)
                .filter(Boolean)
        )

        return {
            totalUsers: usersRes.count ?? 0,
            totalSessions: sessionsRes.count ?? 0,
            totalTests: testsRes.count ?? 0,
            activeToday: activeRes.count ?? 0,
            newUsersToday: newTodayRes.count ?? 0,
            newUsersWeek: newWeekRes.count ?? 0,
            newUsersMonth: newMonthRes.count ?? 0,
            totalOlympiads: distinctOlympiads.size,
            recentUsers: (recentUsersRes.data as User[]) || [],
            recentActivity: (recentLogsRes.data as ActivityLog[]) || [],
        }
    },

    // ---------- Chart Data ----------
    async getRegistrationTrend(days = 30): Promise<{ date: string; count: number }[]> {
        const start = new Date()
        start.setDate(start.getDate() - days)
        const startStr = start.toISOString().split('T')[0]
        const { data, error } = await supabase
            .from('users')
            .select('created_at')
            .gte('created_at', startStr)
            .order('created_at', { ascending: true })
        if (error) throw new AdminServiceError(formatError(error))

        const map = new Map<string, number>()
        for (let i = 0; i < days; i++) {
            const d = new Date()
            d.setDate(d.getDate() - (days - 1 - i))
            const key = d.toISOString().split('T')[0]
            map.set(key, 0)
        }
        data?.forEach(u => {
            const d = u.created_at.split('T')[0]
            if (map.has(d)) map.set(d, (map.get(d) || 0) + 1)
        })
        return Array.from(map.entries()).map(([date, count]) => ({ date, count }))
    },

    async getActivityTrend(days = 30): Promise<{ date: string; activeUsers: number }[]> {
        const start = new Date()
        start.setDate(start.getDate() - days)
        const startStr = start.toISOString().split('T')[0]
        const { data, error } = await supabase
            .from('study_sessions')
            .select('date, user_id')
            .gte('date', startStr)
            .order('date', { ascending: true })
        if (error) throw new AdminServiceError(formatError(error))

        const map = new Map<string, Set<string>>()
        for (let i = 0; i < days; i++) {
            const d = new Date()
            d.setDate(d.getDate() - (days - 1 - i))
            const key = d.toISOString().split('T')[0]
            map.set(key, new Set())
        }
        data?.forEach(s => {
            if (map.has(s.date)) map.get(s.date)!.add(s.user_id)
        })
        return Array.from(map.entries()).map(([date, set]) => ({ date, activeUsers: set.size }))
    },

    async getOlympiadParticipation(): Promise<{ olympiad: string; count: number }[]> {
        const { data, error } = await supabase
            .from('users')
            .select('olympiad_id')
            .not('olympiad_id', 'is', null)
        if (error) throw new AdminServiceError(formatError(error))
        const map = new Map<string, number>()
        data?.forEach(u => {
            const o = u.olympiad_id || 'نامشخص'
            map.set(o, (map.get(o) || 0) + 1)
        })
        return Array.from(map.entries()).map(([olympiad, count]) => ({ olympiad, count }))
    },

    async getSubmissionTrend(days = 30): Promise<{ date: string; submissions: number }[]> {
        const start = new Date()
        start.setDate(start.getDate() - days)
        const startStr = start.toISOString().split('T')[0]
        const { data, error } = await supabase
            .from('study_sessions')
            .select('date')
            .gte('date', startStr)
            .order('date', { ascending: true })
        if (error) throw new AdminServiceError(formatError(error))

        const map = new Map<string, number>()
        for (let i = 0; i < days; i++) {
            const d = new Date()
            d.setDate(d.getDate() - (days - 1 - i))
            const key = d.toISOString().split('T')[0]
            map.set(key, 0)
        }
        data?.forEach(s => {
            if (map.has(s.date)) map.set(s.date, (map.get(s.date) || 0) + 1)
        })
        return Array.from(map.entries()).map(([date, submissions]) => ({ date, submissions }))
    },

    async getTopActiveUsers(limit = 10): Promise<{ user_id: string; name: string; total_minutes: number; sessions_count: number }[]> {
        const { data, error } = await supabase
            .from('study_sessions')
            .select('user_id, duration_minutes, users(name)')
            .limit(10000) // get enough
        if (error) throw new AdminServiceError(formatError(error))

        const map = new Map<string, { name: string; total_minutes: number; sessions_count: number }>()
        data?.forEach(s => {
            const uid = s.user_id
            if (!map.has(uid)) {
                map.set(uid, { name: (s.users as any)?.name || 'ناشناس', total_minutes: 0, sessions_count: 0 })
            }
            const entry = map.get(uid)!
            entry.total_minutes += s.duration_minutes
            entry.sessions_count += 1
        })
        return Array.from(map.entries())
            .map(([user_id, { name, total_minutes, sessions_count }]) => ({ user_id, name, total_minutes, sessions_count }))
            .sort((a, b) => b.total_minutes - a.total_minutes)
            .slice(0, limit)
    },
}
