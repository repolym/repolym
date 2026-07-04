import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../config/supabase'
import type { Subject, SubjectFormData } from '../types/database'
import { formatError } from '../utils/error-handler'

const cache = new Map<string, { data: Subject[]; timestamp: number }>()
const CACHE_TTL = 300_000 // 5 min

export const useSubjects = (userId: string | null) => {
  const [data, setData] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)

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

    const cached = cache.get(userId)
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setData(cached.data)
      return
    }

    fetchingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const { data: rows, error: err } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })

      if (err) throw err

      const subjects = rows as Subject[]
      cache.set(userId, { data: subjects, timestamp: Date.now() })
      setData(subjects)
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
  }, [userId])

  useEffect(() => {
    fetch()
  }, [fetch])

  const createSubject = async (formData: SubjectFormData): Promise<boolean> => {
    if (!userId) return false
    const { error } = await supabase.from('subjects').insert([{ ...formData, user_id: userId }])
    if (error) throw new Error(formatError(error))
    cache.delete(userId)
    await fetch(true)
    return true
  }

  const updateSubject = async (id: string, formData: Partial<SubjectFormData>): Promise<boolean> => {
    if (!userId) return false
    const { error } = await supabase
      .from('subjects')
      .update(formData)
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw new Error(formatError(error))
    cache.delete(userId)
    await fetch(true)
    return true
  }

  const deleteSubject = async (id: string): Promise<boolean> => {
    if (!userId) return false
    const { error } = await supabase.from('subjects').delete().eq('id', id).eq('user_id', userId)
    if (error) throw new Error(formatError(error))
    cache.delete(userId)
    await fetch(true)
    return true
  }

  return { data, loading, error, refetch: () => fetch(true), createSubject, updateSubject, deleteSubject }
}