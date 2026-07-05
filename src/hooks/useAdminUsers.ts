// src/hooks/useAdminUsers.ts
import { useState, useEffect, useCallback } from 'react'
import { adminService } from '../services/adminService'
import type { User } from '../types/database'

interface UseAdminUsersParams {
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
}

export const useAdminUsers = (params: UseAdminUsersParams = {}) => {
    const [users, setUsers] = useState<User[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const result = await adminService.getUsers(params)
            setUsers(result.users)
            setTotal(result.total)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا در دریافت کاربران')
        } finally {
            setLoading(false)
        }
    }, [params])

    useEffect(() => {
        fetchUsers()
    }, [fetchUsers])

    const suspendUser = async (userId: string) => {
        await adminService.suspendUser(userId)
        await fetchUsers()
    }

    const activateUser = async (userId: string) => {
        await adminService.activateUser(userId)
        await fetchUsers()
    }

    const deleteUser = async (userId: string) => {
        await adminService.deleteUser(userId)
        await fetchUsers()
    }

    const refetch = fetchUsers

    return { users, total, loading, error, refetch, suspendUser, activateUser, deleteUser }
}