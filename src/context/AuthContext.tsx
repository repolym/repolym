import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../config/supabase'
import type { User } from '../types/database'
import { formatError } from '../utils/error-handler'
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
    // Retry up to 5 times with delay — trigger may not have run yet
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

    // اگر انتخاب المپیاد/دروس پیش از تأیید ایمیل ذخیره شده باشد (کاربری که
    // لینک تأیید را در دستگاه/تب دیگری باز کرده)، پس از اولین بارگذاری پروفایل
    // آن را اعمال می‌کنیم تا هیچ داده‌ای گم نشود.
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
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(formatError(error))
    // مهم: قبل از بازگشت از این تابع، پروفایل کاربر را در state قرار می‌دهیم.
    // در غیر این صورت، اگر صفحه بلافاصله بعد از signIn به مسیر محافظت‌شده
    // ناوبری کند، ProtectedRoute هنوز user را null می‌بیند (چون onAuthStateChange
    // به‌صورت async و با تأخیر اجرا می‌شود) و کاربر دوباره به /login برمی‌گردد.
    setSession(data.session)
    if (data.user) {
      const profile = await fetchUserProfile(data.user.id)
      if (!profile) {
        throw new Error('مشکل در بارگذاری اطلاعات حساب کاربری. لطفاً دوباره تلاش کنید.')
      }
      setUser(profile)
    }
  }

  // اعمال انتخاب المپیاد و دروس روی پروفایل کاربر — بدون بازنویسی داده‌های
  // جدیدتری که ممکن است هم‌زمان (مثلاً در تب دیگر) روی preferences نوشته
  // شده باشند: preferences با merge سمت سرور به‌جای overwrite کامل به‌روز می‌شود.
  const applyOnboarding = async (userId: string, onboarding: OnboardingData) => {
    if (onboarding.subjects.length > 0) {
      const rows = onboarding.subjects.map((s) => ({ user_id: userId, name: s.name, color: s.color }))
      // ON CONFLICT روی (user_id, name) از تکرار درس در صورت تلاش دوباره جلوگیری می‌کند
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
    // Pass name in metadata so the DB trigger can use it
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) throw new Error(formatError(error))
    // Profile is created automatically by the DB trigger — no manual insert needed
    setSession(data.session)
    if (data.user && data.session) {
      // اگر تأیید ایمیل غیرفعال باشد، session بلافاصله موجود است و باید پروفایل
      // را بارگذاری کنیم تا ناوبری بعدی به داشبورد با شکست مواجه نشود.
      const profile = await fetchUserProfile(data.user.id)
      if (profile && onboarding) {
        try {
          await applyOnboarding(data.user.id, onboarding)
          const updated = await fetchUserProfile(data.user.id)
          setUser(updated)
        } catch {
          // انتخاب المپیاد/دروس نباید مانع تکمیل ثبت‌نام شود — کاربر بعداً
          // می‌تواند آن را از صفحه تنظیمات کامل کند.
          setUser(profile)
        }
      } else {
        setUser(profile)
      }
      return { requiresEmailConfirmation: false }
    }
    // session وجود ندارد یعنی Supabase منتظر تأیید ایمیل است؛ کاربر نباید به
    // مسیر محافظت‌شده هدایت شود، بلکه باید پیام تأیید ایمیل را ببیند. انتخاب
    // المپیاد/دروس را برای پس از تأیید ایمیل و اولین ورود ذخیره می‌کنیم.
    if (onboarding && data.user) {
      try {
        sessionStorage.setItem(`pending_onboarding_${data.user.id}`, JSON.stringify(onboarding))
      } catch {}
    }
    return { requiresEmailConfirmation: true }
  }

  const completeOnboarding = async (onboarding: OnboardingData) => {
    if (!session?.user) return
    await applyOnboarding(session.user.id, onboarding)
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
    <AuthContext.Provider value={{ user, session, isLoading, error, signIn, signUp, completeOnboarding, signOut, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
