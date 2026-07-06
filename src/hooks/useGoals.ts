import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../config/supabase'
import type { Goal, GoalFormData } from '../types/database'
import { formatError } from '../utils/error-handler'

interface UseGoalsParams {
  userId: string | null
  status?: 'active' | 'completed' | 'archived' | 'all'
}

const cache = new Map<string, { data: Goal[]; timestamp: number }>()
const CACHE_TTL = 60_000

export const useGoals = ({ userId, status = 'active' }: UseGoalsParams) => {
  const [data, setData] = useState<Goal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)
  const cacheKey = `${userId}|${status}`

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
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (status !== 'all') query = query.eq('status', status)

      const { data: rows, error: err } = await query
      if (err) throw err

      const goals = rows as Goal[]
      cache.set(cacheKey, { data: goals, timestamp: Date.now() })
      setData(goals)
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
  }, [userId, status, cacheKey])

  useEffect(() => {
    fetch()
  }, [fetch])

  const createGoal = async (formData: GoalFormData): Promise<boolean> => {
    if (!userId) return false
    const { error } = await supabase.from('goals').insert([
      { ...formData, user_id: userId, status: 'active', end_date: formData.end_date || null },
    ])
    if (error) throw new Error(formatError(error))
    cache.delete(cacheKey)
    await fetch(true)
    return true
  }

  const updateGoal = async (id: string, updates: Partial<GoalFormData & { status: Goal['status'] }>): Promise<boolean> => {
    if (!userId) return false
    const { error } = await supabase
      .from('goals')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw new Error(formatError(error))
    cache.delete(cacheKey)
    await fetch(true)
    return true
  }

  const deleteGoal = async (id: string): Promise<boolean> => {
    if (!userId) return false
    const { error } = await supabase.from('goals').delete().eq('id', id).eq('user_id', userId)
    if (error) throw new Error(formatError(error))
    cache.delete(cacheKey)
    await fetch(true)
    return true
  }

  return { data, loading, error, refetch: () => fetch(true), createGoal, updateGoal, deleteGoal }
}
