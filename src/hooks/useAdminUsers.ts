// src/hooks/useAdminUsers.ts
import { useState, useEffect, useCallback } from 'react'
import { adminService } from '../services/adminService'
import type { User } from '../types/database'

export const useAdminUsers = (filters?: { search?: string; status?: 'active' | 'suspended' | 'all'; isAdmin?: boolean }) => {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await adminService.getUsers(filters)
            setUsers(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا در دریافت کاربران')
        } finally {
            setLoading(false)
        }
    }, [filters])

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

    return { users, loading, error, refetch, suspendUser, activateUser, deleteUser }
}