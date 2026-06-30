import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../config/supabase'
import type { StudySession, SessionFormData } from '../types/database'
import { formatError } from '../utils/error-handler'

interface UseStudySessionsParams {
  userId: string | null
  dateFrom?: string
  dateTo?: string
}

const CACHE_TTL = 60_000

// نکته: قبلاً اینجا یک شیء واحد (نه Map) برای کش استفاده می‌شد که بین همهٔ
// نمونه‌های این هوک در سراسر برنامه مشترک بود. وقتی دو کامپوننت هم‌زمان با
// پارامترهای متفاوت این هوک را صدا می‌زدند (مثلاً در DashboardPage که هم
// sessions و هم allSessions را می‌خواند)، هر بار کش با cacheKey جدید بازنویسی
// می‌شد و کش قبلی را باطل می‌کرد — یعنی کشینگ عملاً کار نمی‌کرد و درخواست‌های
// تکراری غیرضروری به سرور ارسال می‌شد. حالا مثل useGoals/useTests از Map
// با کلید مجزا برای هر ترکیب پارامتر استفاده می‌کنیم.
const cache = new Map<string, { data: StudySession[]; timestamp: number }>()

export const useStudySessions = ({ userId, dateFrom, dateTo }: UseStudySessionsParams) => {
  const [data, setData] = useState<StudySession[]>([])
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
        .from('study_sessions')
        .select('*, subjects(id, name, color)')
        .eq('user_id', userId)
        .order('date', { ascending: false })

      if (dateFrom) query = query.gte('date', dateFrom)
      if (dateTo) query = query.lte('date', dateTo)

      const { data: rows, error: err } = await query

      if (err) throw err

      const sessions = rows as StudySession[]
      cache.set(cacheKey, { data: sessions, timestamp: Date.now() })
      setData(sessions)
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

  const createSession = async (formData: SessionFormData): Promise<boolean> => {
    if (!userId) return false
    const { error } = await supabase.from('study_sessions').insert([
      { ...formData, user_id: userId },
    ])
    if (error) throw new Error(formatError(error))
    cache.clear()
    await fetch(true)
    return true
  }

  const updateSession = async (id: string, formData: Partial<SessionFormData>): Promise<boolean> => {
    if (!userId) return false
    const { error } = await supabase
      .from('study_sessions')
      .update({ ...formData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw new Error(formatError(error))
    cache.clear()
    await fetch(true)
    return true
  }

  const deleteSession = async (id: string): Promise<boolean> => {
    if (!userId) return false
    const { error } = await supabase
      .from('study_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw new Error(formatError(error))
    cache.clear()
    await fetch(true)
    return true
  }

  return { data, loading, error, refetch: () => fetch(true), createSession, updateSession, deleteSession }
}
