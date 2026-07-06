import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../config/supabase'
import type { User, BaselineSurveyAnswers } from '../types/database'
import { formatError } from '../utils/error-handler'
import { cleanupAuthParams } from '../utils/auth-cleanup'
import type { OlympiadSubject } from '../config/olympiads'

interface OnboardingData {
  olympiadId: string
  subjects: OlympiadSubject[]
}

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    name: string,
    password: string,
    onboarding?: OnboardingData
  ) => Promise<{ requiresEmailConfirmation: boolean }>
  completeOnboarding: (onboarding: OnboardingData) => Promise<void>
  completeBaselineSurvey: (answers: BaselineSurveyAnswers) => Promise<void>
  updateProfile: (updates: Partial<{ name: string; preferences: Record<string, unknown> }>) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const initialized = useRef(false)
  const loadingTimeoutRef = useRef<number | null>(null)

  // --- Helper functions ---
  const applyOnboarding = async (userId: string, onboarding: OnboardingData) => {
    if (onboarding.subjects.length > 0) {
      const rows = onboarding.subjects.map((s) => ({ user_id: userId, name: s.name, color: s.color }))
      const { error: upsertError } = await supabase
        .from('subjects')
        .upsert(rows, { onConflict: 'user_id,name', ignoreDuplicates: true })
      if (upsertError) throw new Error('خطا در ثبت دروس: ' + upsertError.message)
    }

    const { data: current } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single()

    const { error: updateError } = await supabase
      .from('users')
      .update({
        olympiad_id: onboarding.olympiadId,
        onboarding_completed: true,
        preferences: { ...(current?.preferences ?? {}), olympiad_id: onboarding.olympiadId },
      })
      .eq('id', userId)

    if (updateError) throw new Error('خطا در تکمیل ثبت‌نام: ' + updateError.message)
  }

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    console.log('🔍 Fetching profile for user:', userId)
    for (let i = 0; i < 5; i++) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (!error && data) {
          const pendingRaw = sessionStorage.getItem(`pending_onboarding_${userId}`)
          if (pendingRaw && !data.onboarding_completed) {
            try {
              const pending = JSON.parse(pendingRaw) as OnboardingData
              await applyOnboarding(userId, pending)
              sessionStorage.removeItem(`pending_onboarding_${userId}`)
              const { data: updated, error: refetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()
              if (!refetchError && updated) return updated as User
              return data as User
            } catch {
              return data as User
            }
          }
          console.log('✅ Profile fetched successfully')
          return data as User
        }
      } catch (err) {
        console.warn('⚠️ Profile fetch attempt', i + 1, 'failed:', err)
      }
      await new Promise(r => setTimeout(r, 600))
    }
    console.warn('❌ Failed to fetch profile after 5 attempts')
    return null
  }

  // --- INITIALIZATION (with timeout) ---
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    let isMounted = true

    // Safety timeout: force loading to stop after 4 seconds
    loadingTimeoutRef.current = window.setTimeout(() => {
      if (isMounted && isLoading) {
        console.warn('⚠️ Auth loading timeout – forcing isLoading=false')
        setIsLoading(false)
        setError('بارگذاری اطلاعات کاربر زمان‌بر بود. لطفاً دوباره تلاش کنید.')
      }
    }, 4000)

    const initialize = async () => {
      try {
        console.log('🔍 Initializing auth...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔍 Session:', session ? 'exists' : 'null')
        if (!isMounted) return
        setSession(session)
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id)
          if (isMounted) setUser(profile)
        }
      } catch (err) {
        console.error('❌ Auth initialization error:', err)
        if (isMounted) setError('خطا در بارگذاری اطلاعات کاربر')
      } finally {
        if (isMounted) {
          console.log('🔍 Auth initialization complete, setting isLoading=false')
          setIsLoading(false)
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current)
            loadingTimeoutRef.current = null
          }
        }
        cleanupAuthParams()
      }
    }

    initialize()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔍 Auth state changed:', event)
      if (!isMounted) return
      setSession(session)
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        if (isMounted) setUser(profile)
      } else {
        setUser(null)
      }
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        if (isMounted) setIsLoading(false)
      }
      cleanupAuthParams()
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }
  }, [])

  // --- Auth methods (signIn, signUp, etc.) ---
  const signIn = async (email: string, password: string) => {
    setError(null)
    setIsLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw new Error(formatError(error))
      setSession(data.session)
      if (data.user) {
        const profile = await fetchUserProfile(data.user.id)
        if (!profile) throw new Error('مشکل در بارگذاری اطلاعات حساب کاربری. لطفاً دوباره تلاش کنید.')
        setUser(profile)
      }
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const signUp = async (
    email: string,
    name: string,
    password: string,
    onboarding?: OnboardingData
  ): Promise<{ requiresEmailConfirmation: boolean }> => {
    setIsLoading(true)
    setError(null)
    try {
      const base = import.meta.env.BASE_URL
      const cleanBase = base.endsWith('/') ? base : `${base}/`
      const redirectUrl = `${window.location.origin}${cleanBase}`

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: redirectUrl,
        },
      })

      if (error) throw new Error(formatError(error))

      if (data.user && data.session) {
        setSession(data.session)
        const profile = await fetchUserProfile(data.user.id)
        if (profile && onboarding) {
          try {
            await applyOnboarding(data.user.id, onboarding)
            const updated = await fetchUserProfile(data.user.id)
            setUser(updated)
          } catch (err) {
            console.error('Onboarding failed:', err)
            setUser(profile)
          }
        } else {
          setUser(profile)
        }
        return { requiresEmailConfirmation: false }
      }

      if (onboarding && data.user) {
        try {
          sessionStorage.setItem(`pending_onboarding_${data.user.id}`, JSON.stringify(onboarding))
        } catch { }
      }
      return { requiresEmailConfirmation: true }
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const completeOnboarding = async (onboarding: OnboardingData) => {
    if (!session?.user) throw new Error('Not authenticated')
    setIsLoading(true)
    try {
      await applyOnboarding(session.user.id, onboarding)
      const updated = await fetchUserProfile(session.user.id)
      setUser(updated)
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const completeBaselineSurvey = async (answers: BaselineSurveyAnswers) => {
    if (!session?.user) throw new Error('Not authenticated')
    setIsLoading(true)
    try {
      const { error: insertError } = await supabase
        .from('baseline_surveys')
        .insert({
          user_id: session.user.id,
          answers: answers,
          survey_version: 'v1_baseline',
        })
      if (insertError) throw insertError

      const { error: updateError } = await supabase
        .from('users')
        .update({ has_completed_baseline_survey: true })
        .eq('id', session.user.id)
      if (updateError) throw updateError

      const updated = await fetchUserProfile(session.user.id)
      setUser(updated)
    } catch (err: any) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<{ name: string; preferences: Record<string, unknown> }>) => {
    if (!session?.user) throw new Error('Not authenticated')
    const { error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
    if (error) throw new Error(formatError(error))

    const updated = await fetchUserProfile(session.user.id)
    setUser(updated)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        error,
        signIn,
        signUp,
        completeOnboarding,
        completeBaselineSurvey,
        updateProfile,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
