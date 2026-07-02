import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { getOlympiad } from '../config/olympiads'
import { OLYMPIAD_ICON_MAP } from '../config/olympiad-icons'
import { OlympiadAmbient } from './common/OlympiadAmbient'
import logo from '../repolym.png' // اطمینان از وجود لوگو در src

// آیکون‌های Lucide جایگزین svg های قدیمی
import {
  LayoutDashboard,
  Clock,
  Target,
  ClipboardCheck,
  BookOpen,
  Users,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { to: '/sessions', label: 'جلسات مطالعه', icon: Clock },
  { to: '/goals', label: 'اهداف', icon: Target },
  { to: '/tests', label: 'آزمون‌ها', icon: ClipboardCheck },
  { to: '/subjects', label: 'دروس', icon: BookOpen },
]

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const initials = user?.name
    ? user.name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
    : '؟'

  const allNavItems = user?.is_admin
    ? [...navItems, { to: '/admin', label: 'مدیریت کاربران', icon: Users }]
    : navItems

  // هویت بصری المپیاد انتخابی کاربر — رنگ لهجه (accent) در کل سایدبار جاری
  // می‌شود؛ برای کاربران قدیمی بدون المپیاد، همان رنگ نیلی پیش‌فرض برند حفظ می‌شود.
  // نکته فنی: نمی‌توان از سینتکس شفافیت تیل‌ویند (مثل bg-[var(--accent)]/10) روی
  // یک متغیر CSS حاوی رنگ hex استفاده کرد — خروجی CSS نامعتبر تولید می‌شود.
  // به‌جایش سایه‌های شفاف را از قبل با پسوند آلفای هگز (۲ رقم) محاسبه می‌کنیم.
  const olympiadTheme = user?.olympiad_id ? getOlympiad(user.olympiad_id) : null
  const OlympiadIcon = olympiadTheme ? OLYMPIAD_ICON_MAP[olympiadTheme.icon] : null
  const accentHex = olympiadTheme?.accent ?? '#4F46E5'
  const accentVar = {
    '--accent': accentHex,
    '--accent-08': `${accentHex}14`,
    '--accent-10': `${accentHex}1A`,
    '--accent-15': `${accentHex}26`,
    '--accent-60': `${accentHex}99`,
  } as React.CSSProperties

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" dir="rtl" style={accentVar}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ========== سایدبار مدرن ========== */}
      <aside
        className={`
          fixed lg:static inset-y-0 right-0 z-30 w-64 flex flex-col relative overflow-hidden
          bg-white/80 backdrop-blur-2xl border-l border-gray-200/60
          shadow-xl shadow-gray-200/50 rounded-l-3xl lg:rounded-none
          transform transition-transform duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        {/* جلوهٔ پویای بسیار ظریف مخصوص المپیاد کاربر — فقط یک واترمارک کم‌رنگ
            در پس‌زمینه، بدون مزاحمت برای خوانایی ناوبری */}
        {olympiadTheme && (
          <OlympiadAmbient effect={olympiadTheme.effect} color={olympiadTheme.accent} className="opacity-[0.06]" />
        )}

        <div className="relative z-10 flex flex-col h-full">
          {/* لوگو در سایدبار */}
          <div className="flex items-center gap-3 px-5 py-6 border-b border-gray-100">
            <img src={logo} alt="Repolym" className="h-10 w-auto object-contain" />
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">Repolym</h1>
              <p className="text-xs text-gray-400">سامانه المپیاد</p>
            </div>
          </div>

          {/* نشان المپیاد انتخابی کاربر */}
          {olympiadTheme && (
            <Link
              to="/subjects"
              onClick={() => setMobileOpen(false)}
              className="mx-3 mt-4 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-[var(--accent-08)] border border-[var(--accent-15)] hover:bg-[var(--accent-10)] transition-colors group"
              title="تغییر المپیاد"
            >
              {OlympiadIcon && (
                <div className="w-7 h-7 rounded-lg bg-[var(--accent-15)] flex items-center justify-center flex-shrink-0">
                  <OlympiadIcon className="w-4 h-4 text-[var(--accent)]" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[var(--accent)] truncate">{olympiadTheme.label}</p>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--accent-60)] group-hover:translate-x-[-2px] transition-transform rotate-180" />
            </Link>
          )}

          {/* ناوبری */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {allNavItems.map((item) => {
              const isActive = location.pathname === item.to
              const Icon = item.icon
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                    ? 'bg-[var(--accent-10)] text-[var(--accent)] shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[var(--accent)]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 mr-auto text-[var(--accent-60)]" />}
                </Link>
              )
            })}
          </nav>

          {/* پروفایل کاربر */}
          <div className="mx-3 mb-4 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white text-sm font-bold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50"
                title="خروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ========== محتوای اصلی ========== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* هدر موبایل */}
        <header className="lg:hidden flex items-center justify-between px-5 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Repolym" className="h-8 w-auto" />
            <span className="text-base font-bold text-gray-800">Repolym</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-gray-600 hover:text-gray-900 p-2 rounded-xl hover:bg-gray-100"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}