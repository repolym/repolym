
import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../config/supabase'
import type { StudySession, SessionFormData } from '../types/database'
import { formatError } from '../utils/error-handler'
import { queryDeduplicator } from '../utils/query-deduplicator'
import { logger } from '../utils/logger'
import { validateSessionForm } from '../utils/validation'

interface UseStudySessionsParams {
  userId: string | null
  dateFrom?: string
  dateTo?: string
}

const CACHE_TTL = 60_000

export const useStudySessions = ({ userId, dateFrom, dateTo }: UseStudySessionsParams) => {
  const [data, setData] = useState<StudySession[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mountedRef = useRef(true)

  const cacheKey = `study_sessions|${userId}|${dateFrom}|${dateTo}`

  const executeQuery = useCallback(
    async (userId: string, dateFrom?: string, dateTo?: string): Promise<StudySession[]> => {
      let query = supabase
        .from('study_sessions')
        .select('*, subjects(id, name, color)')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (dateFrom) query = query.gte('date', dateFrom)
      if (dateTo) query = query.lte('date', dateTo)

      const { data: rows, error: err } = await query

      if (err) throw err

      return (rows as StudySession[]) || []
    },
    []
  )

  const fetch = useCallback(
    async (forceRefresh = false) => {
      if (!userId || !mountedRef.current) return

      setLoading(true)
      setError(null)

      try {
        // Check for valid session before making request
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          if (mountedRef.current) {
            setData([])
            setError(null)
          }
          return
        }

        const result = await queryDeduplicator.dedupedQuery(
          cacheKey,
          () => executeQuery(userId, dateFrom, dateTo),
          forceRefresh ? 0 : CACHE_TTL
        )

        if (mountedRef.current) {
          setData(result)
          setError(null)
        }
      } catch (err) {
        if (mountedRef.current) {
          const message = formatError(err)
          setError(message)
          setData([])
          logger.error('Failed to fetch study sessions', err, { userId, dateFrom, dateTo })
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    },
    [userId, dateFrom, dateTo, cacheKey, executeQuery]
  )

  useEffect(() => {
    mountedRef.current = true
    fetch()

    return () => {
      mountedRef.current = false
    }
  }, [fetch])

  const createSession = useCallback(
    async (formData: SessionFormData): Promise<boolean> => {
      if (!userId) return false

      // Validate before sending to server
      const validation = validateSessionForm({
        date: formData.date,
        duration_minutes: formData.duration_minutes,
      })

      if (!validation.allValid) {
        setError('داده‌های ورودی نامعتبر است')
        return false
      }

      try {
        const { error: err } = await supabase.from('study_sessions').insert([
          { ...formData, user_id: userId },
        ])

        if (err) throw err

        queryDeduplicator.invalidate(cacheKey)
        await fetch(true)
        return true
      } catch (err) {
        const message = formatError(err)
        setError(message)
        logger.error('Failed to create study session', err, { userId, formData })
        return false
      }
    },
    [userId, cacheKey, fetch]
  )

  const updateSession = useCallback(
    async (id: string, formData: Partial<SessionFormData>): Promise<boolean> => {
      if (!userId) return false

      try {
        const { error: err } = await supabase
          .from('study_sessions')
          .update({ ...formData, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('user_id', userId)

        if (err) throw err

        queryDeduplicator.invalidate(cacheKey)
        await fetch(true)
        return true
      } catch (err) {
        const message = formatError(err)
        setError(message)
        logger.error('Failed to update study session', err, { userId, id, formData })
        return false
      }
    },
    [userId, cacheKey, fetch]
  )

  const deleteSession = useCallback(
    async (id: string): Promise<boolean> => {
      if (!userId) return false

      try {
        const { error: err } = await supabase
          .from('study_sessions')
          .delete()
          .eq('id', id)
          .eq('user_id', userId)

        if (err) throw err

        queryDeduplicator.invalidate(cacheKey)
        await fetch(true)
        return true
      } catch (err) {
        const message = formatError(err)
        setError(message)
        logger.error('Failed to delete study session', err, { userId, id })
        return false
      }
    },
    [userId, cacheKey, fetch]
  )

  return {
    data,
    loading,
    error,
    refetch: () => fetch(true),
    createSession,
    updateSession,
    deleteSession,
  }
}
