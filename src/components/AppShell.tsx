import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../repolym.png'  // ✅ fixed path: two levels up to root

import {
  Clock,
  Target,
  ClipboardCheck,
  Menu,
  X,
  ChevronRight,
  Home,
  UserCog,
  CalendarDays,
  CheckSquare,
  Zap,
} from 'lucide-react'

// گروه‌بندی آیتم‌های ناوبری دانش‌آموز
const studentNavGroups = [
  {
    label: 'مدیریت جلسات',
    items: [
      { to: '/study', label: 'مطالعات من', icon: Clock },
    ],
  },
  {
    label: 'پیشرفت',
    items: [
      { to: '/goals', label: 'اهداف', icon: Target },
      { to: '/tests', label: 'آزمون‌ها', icon: ClipboardCheck },
    ],
  },
  {
    label: 'برنامه‌ریزی',
    items: [
      { to: '/planning', label: 'برنامه‌ریزی', icon: CalendarDays },
      { to: '/todos', label: 'وظایف', icon: CheckSquare },
      { to: '/focus', label: 'حالت تمرکز', icon: Zap },
    ],
  },
]

const adminNavGroups = [
  {
    label: 'مدیریت',
    items: [
      { to: '/admin', label: 'داشبورد ادمین', icon: Home },
    ],
  },
]

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()  // removed unused signOut
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)
    : '؟'

  const navGroups = user?.is_admin ? adminNavGroups : studentNavGroups

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden" dir="rtl">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ========== سایدبار ========== */}
      <aside
        className={`
          fixed lg:static inset-y-0 right-0 z-30 w-64 flex flex-col
          bg-white/80 backdrop-blur-2xl border-l border-gray-200/60
          shadow-xl shadow-gray-200/50 rounded-l-3xl lg:rounded-none
          transform transition-transform duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        {/* لوگو */}
        <div className="flex items-center px-5 py-6 border-b border-gray-100">
          <img src={logo} alt="لوگو" className="h-12 w-auto object-contain" />
        </div>

        {/* ناوبری گروه‌بندی‌شده */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navGroups.map((group, idx) => (
            <div key={idx} className="mb-6">
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 mb-2">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.to
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={`
                        group flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                        ${isActive
                          ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                        relative
                      `}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                      <span>{item.label}</span>
                      {isActive && (
                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-full" />
                      )}
                      {isActive && <ChevronRight className="w-4 h-4 mr-auto text-indigo-400" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* ========== پروفایل کاربر ========== */}
        <Link
          to="/profile"
          className="mx-3 mb-4 p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors block group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate group-hover:text-indigo-700 transition-colors">
                {user?.name}
              </p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <UserCog className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 transition-colors" />
          </div>
        </Link>
      </aside>

      {/* ========== محتوای اصلی ========== */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* هدر (همیشه قابل مشاهده) */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-white/80 backdrop-blur-xl border-b border-gray-100">
          {/* عنوان (فقط موبایل) */}
          <div className="flex items-center gap-2 lg:hidden">
            <img src={logo} alt="لوگو" className="h-8 w-auto" />
          </div>

          {/* دکمه داشبورد (همیشه) */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/25 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">داشبورد</span>
          </Link>

          {/* دکمه منو (موبایل) */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}