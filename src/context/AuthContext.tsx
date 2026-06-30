import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../config/supabase'
import type { User } from '../types/database'
import { formatError } from '../utils/error-handler'

interface AuthContextType {
  user: User | null
  session: Session | null
  isLoading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, name: string, password: string) => Promise<{ requiresEmailConfirmation: boolean }>
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

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        setUser(profile)
      }
      setIsLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id)
        setUser(profile)
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

  const signUp = async (email: string, name: string, password: string) => {
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
      setUser(profile)
      return { requiresEmailConfirmation: false }
    }
    // session وجود ندارد یعنی Supabase منتظر تأیید ایمیل است؛ کاربر نباید به
    // مسیر محافظت‌شده هدایت شود، بلکه باید پیام تأیید ایمیل را ببیند.
    return { requiresEmailConfirmation: true }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider value={{ user, session, isLoading, error, signIn, signUp, signOut, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
