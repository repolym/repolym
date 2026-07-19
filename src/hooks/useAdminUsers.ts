// src/hooks/useAdminUsers.ts
import { useState, useEffect, useCallback, useMemo } from 'react'
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

    // Params are often passed as an inline object literal by callers (a new
    // reference on every render). Depending on the object reference directly
    // in useCallback/useEffect would recreate fetchUsers and retrigger the
    // effect on every render, causing an infinite fetch loop. Instead we
    // derive a stable, content-based key and only recreate fetchUsers when
    // the *contents* of params actually change.
    const paramsKey = JSON.stringify(params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const stableParams = useMemo(() => params, [paramsKey])

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const result = await adminService.getUsers(stableParams)
            setUsers(result.users)
            setTotal(result.total)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا در دریافت کاربران')
        } finally {
            setLoading(false)
        }
    }, [stableParams])

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
