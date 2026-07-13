import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session, AuthChangeEvent } from '@supabase/supabase-js'
import { supabase } from '../config/supabase'
import type { User, BaselineSurveyAnswers } from '../types/database'
import { formatError } from '../utils/error-handler'
import { hasAuthRedirectParams } from '../utils/auth-cleanup'
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
  const navigate = useNavigate()

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
          return data as User
        }
      } catch (err) {
        console.warn('Profile fetch attempt', i + 1, 'failed:', err)
      }
      await new Promise((r) => setTimeout(r, 600))
    }
    console.warn('Failed to fetch profile after 5 attempts')
    return null
  }

  // --- INITIALIZATION ---
  // `onAuthStateChange` is the single source of truth: Supabase fires an
  // `INITIAL_SESSION` event as soon as we subscribe (even when there is no
  // session), so we don't need a second, separate `getSession()` call
  // racing against it. Just as importantly, this effect is allowed to run
  // its full mount → cleanup → mount cycle with no "have we already run"
  // ref guard — that guard used to survive React 18 StrictMode's dev-only
  // double-invoke while the `isMounted` flag it protected did not, which
  // left `isLoading` stuck forever. Letting the effect re-run normally,
  // with each run owning its own `isMounted`/subscription/cleanup, is what
  // makes it correct under StrictMode as well as in production.
  useEffect(() => {
    let isMounted = true
    let latestRequestId = 0

    const timeoutId = window.setTimeout(() => {
      if (isMounted) {
        setIsLoading((prev) => {
          if (prev) setError('بارگذاری اطلاعات کاربر زمان‌بر بود. لطفاً دوباره تلاش کنید.')
          return false
        })
      }
    }, 8000)

    const handleAuthChange = async (event: AuthChangeEvent, newSession: Session | null) => {
      if (!isMounted) return
      setSession(newSession)

      if (!newSession?.user) {
        setUser(null)
        setIsLoading(false)
        return
      }

      // A refreshed token doesn't mean the profile changed. Skipping the
      // refetch here means a transient network hiccup during a background
      // token refresh can no longer silently clear `user` and bounce an
      // already-signed-in person back to the login page.
      if (event === 'TOKEN_REFRESHED') {
        setIsLoading(false)
        return
      }

      const requestId = ++latestRequestId
      const profile = await fetchUserProfile(newSession.user.id)
      if (!isMounted || requestId !== latestRequestId) return // a newer auth event has already superseded this one
      setUser(profile)
      setIsLoading(false)

      // If we landed here from a magic link / OAuth / recovery redirect,
      // the tokens are still sitting in the URL. Clean them up through the
      // router (not a raw history mutation) so the address bar and React
      // Router's internal location never disagree.
      if (hasAuthRedirectParams()) {
        navigate('/dashboard', { replace: true })
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange)

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [navigate])

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
