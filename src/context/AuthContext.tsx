
import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../config/supabase'
import type { User } from '../types/database'
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
  updateProfile: (updates: Partial<{ name: string }>) => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const initDone = useRef(false)

  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    for (let i = 0; i < 5; i++) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) return data as User
      await new Promise(r => setTimeout(r, 600))
    }
    return null
  }

  useEffect(() => {
    if (initDone.current) return
    initDone.current = true

    const applyPendingOnboardingIfAny = async (userId: string, profile: User | null) => {
      if (!profile || profile.onboarding_completed) return profile
      try {
        const raw = sessionStorage.getItem(`pending_onboarding_${userId}`)
        if (!raw) return profile
        const onboarding = JSON.parse(raw) as OnboardingData
        await applyOnboarding(userId, onboarding)
        sessionStorage.removeItem(`pending_onboarding_${userId}`)
        return await fetchUserProfile(userId)
      } catch {
        return profile
      }
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        setUser(await applyPendingOnboardingIfAny(session.user.id, profile))
      }
      setIsLoading(false)
      cleanupAuthParams()
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        setUser(await applyPendingOnboardingIfAny(session.user.id, profile))
      } else {
        setUser(null)
      }
      if (event === 'SIGNED_IN') setIsLoading(false)
      if (event === 'SIGNED_OUT') setIsLoading(false)
      cleanupAuthParams()
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(formatError(error))
    setSession(data.session)
    if (data.user) {
      const profile = await fetchUserProfile(data.user.id)
      if (!profile) {
        throw new Error('مشکل در بارگذاری اطلاعات حساب کاربری. لطفاً دوباره تلاش کنید.')
      }
      setUser(profile)
    }
  }

  const applyOnboarding = async (userId: string, onboarding: OnboardingData) => {
    if (onboarding.subjects.length > 0) {
      const rows = onboarding.subjects.map((s) => ({ user_id: userId, name: s.name, color: s.color }))
      await supabase.from('subjects').upsert(rows, { onConflict: 'user_id,name', ignoreDuplicates: true })
    }
    const { data: current } = await supabase
      .from('users')
      .select('preferences')
      .eq('id', userId)
      .single()

    await supabase
      .from('users')
      .update({
        olympiad_id: onboarding.olympiadId,
        onboarding_completed: true,
        preferences: { ...(current?.preferences ?? {}), olympiad_id: onboarding.olympiadId },
      })
      .eq('id', userId)
  }

  const signUp = async (
    email: string,
    name: string,
    password: string,
    onboarding?: OnboardingData
  ) => {
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw new Error(formatError(error))
    setSession(data.session)
    if (data.user && data.session) {
      const profile = await fetchUserProfile(data.user.id)
      if (profile && onboarding) {
        try {
          await applyOnboarding(data.user.id, onboarding)
          const updated = await fetchUserProfile(data.user.id)
          setUser(updated)
        } catch {
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
  }

  const completeOnboarding = async (onboarding: OnboardingData) => {
    if (!session?.user) return
    await applyOnboarding(session.user.id, onboarding)
    const updated = await fetchUserProfile(session.user.id)
    setUser(updated)
  }

  const updateProfile = async (updates: Partial<{ name: string }>) => {
    if (!session?.user) throw new Error('Not authenticated')
    const { error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', session.user.id)
    if (error) throw new Error(formatError(error))
    // Refresh the user profile
    const updated = await fetchUserProfile(session.user.id)
    setUser(updated)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  // ========== NEW: Auto-handle session expiry ==========
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      // If session is null but user is still in state → session expired
      if (!currentSession && user) {
        await signOut()
        window.location.hash = '#/login'
      }
    }, 60000) // check every 60 seconds

    return () => clearInterval(interval)
  }, [user]) // re-run when user changes

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider value={{ user, session, isLoading, error, signIn, signUp, completeOnboarding, updateProfile, signOut, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
