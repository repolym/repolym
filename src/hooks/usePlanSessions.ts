
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../config/supabase'
import type { StudySession } from '../types/database'
import { formatError } from '../utils/error-handler'

export const usePlanSessions = (planId: string | null) => {
    const [data, setData] = useState<StudySession[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const fetchingRef = useRef(false)

    const fetch = useCallback(async (_forceRefresh = false) => {
        if (!planId) { setData([]); return }
        if (fetchingRef.current) return

        fetchingRef.current = true
        setLoading(true)
        setError(null)

        try {
            const { data: rows, error: err } = await supabase
                .from('study_sessions')
                .select('*, subjects(id, name, color)')
                .eq('plan_id', planId)
                .order('date', { ascending: false })

            if (err) throw err
            setData(rows as StudySession[])
        } catch (err) {
            setError(formatError(err))
        } finally {
            fetchingRef.current = false
            setLoading(false)
        }
    }, [planId])

    useEffect(() => {
        fetch()
    }, [fetch])

    const linkSession = useCallback(async (sessionId: string) => {
        if (!planId) return false
        const { error } = await supabase
            .from('study_sessions')
            .update({ plan_id: planId })
            .eq('id', sessionId)
        if (error) throw new Error(formatError(error))
        await fetch(true)
        return true
    }, [planId, fetch])

    const unlinkSession = useCallback(async (sessionId: string) => {
        if (!planId) return false
        const { error } = await supabase
            .from('study_sessions')
            .update({ plan_id: null })
            .eq('id', sessionId)
        if (error) throw new Error(formatError(error))
        await fetch(true)
        return true
    }, [planId, fetch])

    return { data, loading, error, refetch: () => fetch(true), linkSession, unlinkSession }
}
