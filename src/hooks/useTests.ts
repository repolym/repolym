import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../config/supabase'
import type { Test, TestFormData } from '../types/database'
import { formatError } from '../utils/error-handler'

interface UseTestsParams {
  userId: string | null
  dateFrom?: string
  dateTo?: string
}

const cache = new Map<string, { data: Test[]; timestamp: number }>()
const CACHE_TTL = 60_000

export const useTests = ({ userId, dateFrom, dateTo }: UseTestsParams) => {
  const [data, setData] = useState<Test[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)
  const cacheKey = `${userId}|${dateFrom}|${dateTo}`

  const fetch = useCallback(async (forceRefresh = false) => {
    if (!userId) return
    if (fetchingRef.current) return

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
        .from('tests')
        .select('*, subjects(id, name, color)')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (dateFrom) query = query.gte('date', dateFrom)
      if (dateTo) query = query.lte('date', dateTo)

      const { data: rows, error: err } = await query
      if (err) throw err

      const tests = rows as Test[]
      cache.set(cacheKey, { data: tests, timestamp: Date.now() })
      setData(tests)
    } catch (err) {
      setError(formatError(err))
    } finally {
      fetchingRef.current = false
      setLoading(false)
    }
  }, [userId, dateFrom, dateTo, cacheKey])

  useEffect(() => {
    fetch()
  }, [fetch])

  const createTest = async (formData: TestFormData): Promise<boolean> => {
    if (!userId) return false
    const { error } = await supabase.from('tests').insert([
      { ...formData, user_id: userId, subject_id: formData.subject_id || null },
    ])
    if (error) throw new Error(formatError(error))
    cache.delete(cacheKey)
    await fetch(true)
    return true
  }

  const updateTest = async (id: string, formData: Partial<TestFormData>): Promise<boolean> => {
    if (!userId) return false
    const { error } = await supabase
      .from('tests')
      .update({ ...formData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw new Error(formatError(error))
    cache.delete(cacheKey)
    await fetch(true)
    return true
  }

  const deleteTest = async (id: string): Promise<boolean> => {
    if (!userId) return false
    const { error } = await supabase.from('tests').delete().eq('id', id).eq('user_id', userId)
    if (error) throw new Error(formatError(error))
    cache.delete(cacheKey)
    await fetch(true)
    return true
  }

  return { data, loading, error, refetch: () => fetch(true), createTest, updateTest, deleteTest }
}
