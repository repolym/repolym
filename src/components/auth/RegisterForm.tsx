import React, { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  User, Mail, Lock, UserPlus, ArrowRight, ArrowLeft, Check, X, Plus, Eye, EyeOff, Sparkles,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { AuthLayout } from '../auth/AuthLayout'
import { formatError } from '../../utils/error-handler'
import { OLYMPIADS, type OlympiadId, type OlympiadSubject } from '../../config/olympiads'
import { OLYMPIAD_ICON_MAP } from '../../config/olympiad-icons'

type Step = 'name' | 'email' | 'password' | 'olympiad' | 'subjects'
const STEPS: Step[] = ['name', 'email', 'password', 'olympiad', 'subjects']

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const RegisterPage: React.FC = () => {
  const { signUp, user, isLoading } = useAuth()
  const navigate = useNavigate()

  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const step = STEPS[stepIndex]

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [olympiadId, setOlympiadId] = useState<OlympiadId | null>(null)
  const [subjects, setSubjects] = useState<OlympiadSubject[]>([])
  const [newSubject, setNewSubject] = useState('')

  const [fieldError, setFieldError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)

  // اگر کاربر از قبل وارد شده، صفحه ثبت‌نام را نشان نده — مستقیم به داشبورد برو
  useEffect(() => {
    if (!isLoading && user && !confirmationSent) {
      navigate('/dashboard', { replace: true })
    }
  }, [isLoading, user, navigate, confirmationSent])

  // با انتخاب المپیاد، دروس پیش‌فرض همان المپیاد بارگذاری می‌شود؛ کاربر می‌تواند
  // در مرحلهٔ بعد آن‌ها را شخصی‌سازی کند
  const selectedOlympiad = useMemo(
    () => OLYMPIADS.find((o) => o.id === olympiadId) ?? null,
    [olympiadId]
  )

  const chooseOlympiad = (id: OlympiadId) => {
    setOlympiadId(id)
    const preset = OLYMPIADS.find((o) => o.id === id)
    setSubjects(preset ? [...preset.defaultSubjects] : [])
  }

  const removeSubject = (name: string) => {
    setSubjects((prev) => prev.filter((s) => s.name !== name))
  }

  const addSubject = () => {
    const trimmed = newSubject.trim()
    if (!trimmed) return
    if (subjects.some((s) => s.name === trimmed)) {
      setNewSubject('')
      return
    }
    const palette = ['#4F46E5', '#0891B2', '#059669', '#D97706', '#DB2777', '#7C3AED']
    setSubjects((prev) => [...prev, { name: trimmed, color: palette[prev.length % palette.length] }])
    setNewSubject('')
  }

  const goNext = () => {
    setFieldError(null)
    if (step === 'name' && !name.trim()) { setFieldError('نام خود را وارد کنید'); return }
    if (step === 'email' && !EMAIL_RE.test(email.trim())) { setFieldError('ایمیل معتبر وارد کنید'); return }
    if (step === 'password' && password.length < 8) { setFieldError('رمز عبور باید حداقل ۸ کاراکتر باشد'); return }
    if (step === 'olympiad' && !olympiadId) { setFieldError('یک المپیاد را انتخاب کنید'); return }

    if (stepIndex === STEPS.length - 1) {
      handleSubmit()
      return
    }
    setDirection(1)
    setStepIndex((i) => i + 1)
  }

  const goBack = () => {
    setFieldError(null)
    setDirection(-1)
    setStepIndex((i) => Math.max(0, i - 1))
  }

  const handleSubmit = async () => {
    if (!olympiadId) return
    setLoading(true)
    setSubmitError(null)
    try {
      const { requiresEmailConfirmation } = await signUp(email.trim(), name.trim(), password, {
        olympiadId,
        subjects,
      })
      if (requiresEmailConfirmation) {
        setConfirmationSent(true)
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err) {
      setSubmitError(formatError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step !== 'subjects') {
      e.preventDefault()
      goNext()
    }
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

  const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 24 : -24 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -24 : 24 }),
  }

  // مراحل المپیاد/دروس به فضای افقی بیشتری نیاز دارند تا گرید ۱۴ گزینه‌ای
  // فشرده به نظر نرسد — بقیهٔ مراحل (نام/ایمیل/رمز) با عرض جمع‌وجورتر بهتر است
  const isWideStep = step === 'olympiad' || step === 'subjects'

  return (
    <AuthLayout olympiadTheme={selectedOlympiad} wide={isWideStep}>
      <div>
        {/* نشانگر پیشرفت — هر مرحله فقط یک سؤال */}
        <div className="flex items-center gap-1.5 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i <= stepIndex ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22, ease: 'easeOut' }}
            onKeyDown={handleKeyDown}
          >
            {step === 'name' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">اسمت چیه؟</h2>
                <p className="text-sm text-gray-500 mb-8">بذار بدونیم چطور صدات کنیم</p>
                <div className="relative">
                  <User className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="نام و نام‌خانوادگی"
                    autoFocus
                    className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {step === 'email' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">ایمیلت چیه؟</h2>
                <p className="text-sm text-gray-500 mb-8">برای ورود و بازیابی حساب استفاده می‌شود</p>
                <div className="relative">
                  <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ایمیل خود را وارد کنید"
                    autoFocus
                    autoComplete="email"
                    className="w-full pr-12 pl-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            )}

            {step === 'password' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">یک رمز عبور بساز</h2>
                <p className="text-sm text-gray-500 mb-8">حداقل ۸ کاراکتر، هرچه قوی‌تر بهتر</p>
                <div className="relative">
                  <Lock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="حداقل ۸ کاراکتر"
                    autoFocus
                    autoComplete="new-password"
                    className="w-full pr-12 pl-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {step === 'olympiad' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">کدوم المپیاد؟</h2>
                <p className="text-sm text-gray-500 mb-6">دروس پیش‌فرض همون رو براش آماده می‌کنیم</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[440px] overflow-y-auto pr-0.5">
                  {OLYMPIADS.map((o) => {
                    const Icon = OLYMPIAD_ICON_MAP[o.icon] ?? Sparkles
                    const active = olympiadId === o.id
                    return (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => chooseOlympiad(o.id)}
                        className={`relative text-right p-4 rounded-2xl border-2 transition-all overflow-hidden ${
                          active ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`absolute inset-0 bg-gradient-to-br ${o.gradient} opacity-[0.08]`} />
                        <div className="relative">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                            style={{ backgroundColor: `${o.accent}1A`, color: o.accent }}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <p className="text-sm font-semibold text-gray-900">{o.shortLabel}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{o.tagline}</p>
                        </div>
                        {active && (
                          <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {step === 'subjects' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">دروس رو تنظیم کن</h2>
                <p className="text-sm text-gray-500 mb-6">
                  می‌تونی دروس پیشنهادی {selectedOlympiad?.shortLabel} رو نگه داری، حذف کنی یا دروس دلخواه اضافه کنی — این مرحله اختیاری است
                </p>
                <div className="flex flex-wrap gap-2 mb-4 min-h-[2rem]">
                  {subjects.map((s) => (
                    <span
                      key={s.name}
                      className="inline-flex items-center gap-1.5 pr-3 pl-2 py-1.5 rounded-full text-xs font-medium border"
                      style={{ backgroundColor: `${s.color}14`, borderColor: `${s.color}33`, color: s.color }}
                    >
                      {s.name}
                      <button type="button" onClick={() => removeSubject(s.name)} className="hover:opacity-70">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  {subjects.length === 0 && (
                    <p className="text-xs text-gray-400">هنوز درسی اضافه نشده — می‌تونی از پایین اضافه کنی</p>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); addSubject() }
                    }}
                    placeholder="نام درس دلخواه…"
                    className="w-full pr-4 pl-11 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={addSubject}
                    className="absolute left-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {(fieldError || submitError) && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-5"
          >
            {fieldError || submitError}
          </motion.p>
        )}

        <div className="flex items-center gap-3 mt-8">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="flex items-center justify-center w-12 h-12 shrink-0 rounded-2xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              aria-label="مرحله قبل"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-70"
          >
            {loading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : stepIndex === STEPS.length - 1 ? (
              <>
                <UserPlus className="w-5 h-5" />
                تکمیل ثبت‌نام
              </>
            ) : (
              <>
                ادامه
                <ArrowLeft className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {stepIndex === 0 && (
          <p className="mt-6 text-center text-sm text-gray-500">
            حساب دارید؟{' '}
            <Link to="/login" className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors">
              وارد شوید
            </Link>
          </p>
        )}
      </div>
    </AuthLayout>
  )
}