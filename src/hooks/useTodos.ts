import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../config/supabase'
import type { Todo, TodoFormData } from '../types/database'
import { formatError } from '../utils/error-handler'

interface UseTodosParams {
    userId: string | null
    status?: Todo['status'] | 'all'
    subjectId?: string | null
    search?: string
    dateFrom?: string
    dateTo?: string
}

const cache = new Map<string, { data: Todo[]; timestamp: number }>()
const CACHE_TTL = 60_000

export const useTodos = ({ userId, status, subjectId, search, dateFrom, dateTo }: UseTodosParams) => {
    const [data, setData] = useState<Todo[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fetchingRef = useRef(false)

    const cacheKey = `${userId}|${status || 'all'}|${subjectId || 'all'}|${search || ''}|${dateFrom || ''}|${dateTo || ''}`

    const fetch = useCallback(async (forceRefresh = false) => {
        if (!userId) return
        if (fetchingRef.current) return

        // ✅ Check for valid session before making request
        // The fetch function already has this at the top:
        if (!userId) {
            setData([])
            setError(null)
            setLoading(false)
            return
        }
        // Delete the session check entirely – no need to call getSession()

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
                .from('todos')
                .select('*, subjects(id, name, color), study_session(*), plan(*)')
                .eq('user_id', userId)
                .order('deadline', { ascending: true, nullsFirst: false })

            if (status && status !== 'all') query = query.eq('status', status)
            if (subjectId) query = query.eq('subject_id', subjectId)
            if (dateFrom) query = query.gte('deadline', dateFrom)
            if (dateTo) query = query.lte('deadline', dateTo)

            if (search) {
                query = query.ilike('title', `%${search}%`)
            }

            const { data: rows, error: err } = await query
            if (err) throw err

            const todos = rows as Todo[]
            cache.set(cacheKey, { data: todos, timestamp: Date.now() })
            setData(todos)
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
    }, [userId, status, subjectId, search, dateFrom, dateTo, cacheKey])

    useEffect(() => {
        fetch()
    }, [fetch])

    const createTodo = async (formData: TodoFormData): Promise<boolean> => {
        if (!userId) return false
        const { error } = await supabase.from('todos').insert([
            { ...formData, user_id: userId, status: formData.status || 'pending' },
        ])
        if (error) throw new Error(formatError(error))
        cache.clear()
        await fetch(true)
        return true
    }

    const updateTodo = async (id: string, updates: Partial<TodoFormData>): Promise<boolean> => {
        if (!userId) return false
        const { error } = await supabase
            .from('todos')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .eq('user_id', userId)
        if (error) throw new Error(formatError(error))
        cache.clear()
        await fetch(true)
        return true
    }

    const deleteTodo = async (id: string): Promise<boolean> => {
        if (!userId) return false
        const { error } = await supabase.from('todos').delete().eq('id', id).eq('user_id', userId)
        if (error) throw new Error(formatError(error))
        cache.clear()
        await fetch(true)
        return true
    }

    return { data, loading, error, refetch: () => fetch(true), createTodo, updateTodo, deleteTodo }
}
