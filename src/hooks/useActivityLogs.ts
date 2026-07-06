// src/hooks/useActivityLogs.ts
import { useState, useEffect, useCallback } from 'react'
import { adminService } from '../services/adminService'
import type { ActivityLog } from '../types/database'

export const useActivityLogs = (limit = 100) => {
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await adminService.getActivityLogs(limit)
            setLogs(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'خطا در دریافت لاگ‌ها')
        } finally {
            setLoading(false)
        }
    }, [limit])

    useEffect(() => {
        fetchLogs()
    }, [fetchLogs])

    const refetch = fetchLogs

    return { logs, loading, error, refetch }
}
