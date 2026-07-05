// src/services/adminService.ts
import { supabase } from '../config/supabase'
import type { User, ActivityLog } from '../types/database'
import { formatError } from '../utils/error-handler'

export class AdminServiceError extends Error { }

export const adminService = {
    // ---------- Users ----------
    async getUsers(filters?: {
        search?: string
        status?: 'active' | 'suspended' | 'all'
        isAdmin?: boolean
    }): Promise<User[]> {
        let query = supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })

        if (filters?.search) {
            query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
        }
        if (filters?.status && filters.status !== 'all') {
            query = query.eq('status', filters.status)
        }
        if (filters?.isAdmin !== undefined) {
            query = query.eq('is_admin', filters.isAdmin)
        }

        const { data, error } = await query
        if (error) throw new AdminServiceError(formatError(error))
        return data as User[]
    },

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

    // ---------- Admins ----------
    async getAdmins(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('is_admin', true)
            .order('created_at', { ascending: false })
        if (error) throw new AdminServiceError(formatError(error))
        return data as User[]
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

    // ---------- Dashboard Stats ----------
    async getStats(): Promise<{
        totalUsers: number
        totalSessions: number
        totalTests: number
        activeToday: number
        recentUsers: User[]
        recentActivity: ActivityLog[]
    }> {
        const todayStr = new Date().toISOString().split('T')[0]

        const [usersRes, sessionsRes, testsRes, activeRes, recentUsersRes, recentLogsRes] = await Promise.all([
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
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5),
            supabase
                .from('activity_logs')
                .select('*, users(id, name, email)')
                .order('created_at', { ascending: false })
                .limit(5),
        ])

        const errors = [usersRes.error, sessionsRes.error, testsRes.error, activeRes.error, recentUsersRes.error, recentLogsRes.error]
        const firstError = errors.find(e => e)
        if (firstError) throw new AdminServiceError(formatError(firstError))

        return {
            totalUsers: usersRes.count ?? 0,
            totalSessions: sessionsRes.count ?? 0,
            totalTests: testsRes.count ?? 0,
            activeToday: activeRes.count ?? 0,
            recentUsers: (recentUsersRes.data as User[]) || [],
            recentActivity: (recentLogsRes.data as ActivityLog[]) || [],
        }
    },
}