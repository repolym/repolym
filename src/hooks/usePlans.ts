import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../config/supabase'
import type { Plan, PlanFormData } from '../types/database'
import { formatError } from '../utils/error-handler'

interface UsePlansParams {
    userId: string | null
    type?: Plan['type']
    status?: Plan['status']
    dateFrom?: string
    dateTo?: string
}

const cache = new Map<string, { data: Plan[]; timestamp: number }>()
const CACHE_TTL = 60_000

export const usePlans = ({ userId, type, status, dateFrom, dateTo }: UsePlansParams) => {
    const [data, setData] = useState<Plan[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fetchingRef = useRef(false)

    const cacheKey = `${userId}|${type || 'all'}|${status || 'all'}|${dateFrom || ''}|${dateTo || ''}`

    const fetch = useCallback(async (forceRefresh = false) => {
        if (!userId) return
        if (fetchingRef.current) return

        // ✅ Check for valid session before making request
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            setData([])
            setError(null)
            return
        }

        const cached = cache.get(cacheKey)
        if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
            setData(cached.data)
            return
        }

        fetchingRef.current = true
        setLoading(true)
        setError(null)

        try {
            let query = supabase
                .from('plans')
                .select('*')
                .eq('user_id', userId)
                .order('start_date', { ascending: true })

            if (type) query = query.eq('type', type)
            if (status) query = query.eq('status', status)
            if (dateFrom) query = query.gte('start_date', dateFrom)
            if (dateTo) query = query.lte('start_date', dateTo)

            const { data: rows, error: err } = await query
            if (err) throw err

            const plans = rows as Plan[]
            cache.set(cacheKey, { data: plans, timestamp: Date.now() })
            setData(plans)
        } catch (err) {
            const msg = formatError(err)
            if (!msg.includes('نشست') && !msg.includes('JWT') && !msg.includes('session')) {
                setError(msg)
            } else {
                setData([])
                setError(null)
            }
        } finally {
            fetchingRef.current = false
            setLoading(false)
        }
    }, [userId, type, status, dateFrom, dateTo, cacheKey])

    useEffect(() => {
        fetch()
    }, [fetch])

    const createPlan = async (formData: PlanFormData): Promise<boolean> => {
        if (!userId) return false
        const { error } = await supabase.from('plans').insert([
            { ...formData, user_id: userId, status: formData.status || 'pending', progress: formData.progress || 0 },
        ])
        if (error) throw new Error(formatError(error))
        cache.clear()
        await fetch(true)
        return true
    }

    const updatePlan = async (id: string, updates: Partial<PlanFormData>): Promise<boolean> => {
        if (!userId) return false
        const { error } = await supabase
            .from('plans')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId)
        if (error) throw new Error(formatError(error))
        cache.clear()
        await fetch(true)
        return true
    }

    const deletePlan = async (id: string): Promise<boolean> => {
        if (!userId) return false
        const { error } = await supabase.from('plans').delete().eq('id', id).eq('user_id', userId)
        if (error) throw new Error(formatError(error))
        cache.clear()
        await fetch(true)
        return true
    }

    return { data, loading, error, refetch: () => fetch(true), createPlan, updatePlan, deletePlan }
}