import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Mail, Lock, UserPlus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { AuthLayout } from '../auth/AuthLayout'
import { formatError } from '../../utils/error-handler'

export const RegisterPage: React.FC = () => {
  const { signUp, user, isLoading } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  // اگر کاربر از قبل وارد شده، صفحه ثبت‌نام را نشان نده — مستقیم به داشبورد برو
  useEffect(() => {
    if (!isLoading && user && !confirmationSent) {
      navigate('/dashboard', { replace: true })
    }
  }, [isLoading, user, navigate, confirmationSent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email || !password) return
    if (password.length < 8) { setError('رمز عبور باید حداقل ۸ کاراکتر باشد'); return }
    setLoading(true)
    setError(null)
    try {
      const { requiresEmailConfirmation } = await signUp(email.trim(), name.trim(), password)
      if (requiresEmailConfirmation) {
        setConfirmationSent(true)
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      const msg = formatError(err)
      if (msg.includes('already registered')) setError('این ایمیل قبلاً ثبت‌نام کرده است')
      else setError(msg)
    } finally { setLoading(false) }
  }

  if (confirmationSent) {
    return (
      <AuthLayout>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">ثبت‌نام تقریباً تمام شد ✉️</h2>
          <p className="text-sm text-gray-500 mb-8">
            یک ایمیل تأیید برای {email} ارسال کردیم. برای فعال‌سازی حساب، روی لینک داخل ایمیل کلیک کنید.
          </p>
          <Link
            to="/login"
            className="inline-block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3.5 rounded-2xl transition-all"
          >
            بازگشت به صفحه ورود
          </Link>
        </motion.div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-1">ایجاد حساب</h2>
        <p className="text-sm text-gray-500 mb-8">همین امروز پیشرفتت را شروع کن</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* نام */}
          <div className="relative">
            <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="نام و نام‌خانوادگی"
              required
              autoFocus
              className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* ایمیل */}
          <div className="relative">
            <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ایمیل خود را وارد کنید"
              required
              autoComplete="email"
              className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* رمز عبور */}
          <div className="relative">
            <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="حداقل ۸ کاراکتر"
              required
              autoComplete="new-password"
              className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
            <p className="text-xs text-gray-400 mt-1 mr-1">حداقل ۸ کاراکتر</p>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-70"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                ثبت‌نام
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          حساب دارید؟{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors">
            وارد شوید
          </Link>
        </p>
      </motion.div>
    </AuthLayout>
  )
}