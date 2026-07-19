// src/components/AppShell.tsx (updated for admin menu)
import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Avatar, getAvatarUrl } from './common/Avatar'

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
  Users,
  Shield,
  FileText,
  Trophy,
  Sparkles, // <-- اضافه شد
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

// گروه‌بندی آیتم‌های ناوبری ادمین
const adminNavGroups = [
  {
    label: 'مدیریت',
    items: [
      { to: '/admin', label: 'هوش مصنوعی', icon: Sparkles }, // <-- تغییر نام و آیکون
      { to: '/admin/users', label: 'کاربران', icon: Users },
      { to: '/admin/admins', label: 'ادمین‌ها', icon: Shield },
      { to: '/admin/logs', label: 'لاگ فعالیت‌ها', icon: FileText },
      { to: '/admin/olympiads', label: 'المپیادها', icon: Trophy },
      { to: '/admin/profile', label: 'پروفایل ادمین', icon: UserCog },
    ],
  },
]

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const navGroups = user?.is_admin ? adminNavGroups : studentNavGroups

  return (
    <div className="flex h-screen bg-surface-2 overflow-hidden" dir="rtl">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 right-0 z-30 w-64 flex flex-col
          bg-surface-1/80 backdrop-blur-2xl border-l border-border/60
          shadow-xl shadow-gray-200/50 rounded-l-3xl lg:rounded-none
          transform transition-transform duration-300 ease-out
          ${mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex items-center px-5 py-6 border-b border-border-subtle">
          <img src={import.meta.env.BASE_URL + 'logo.png'} alt="لوگو" className="h-12 w-auto object-contain" />
        </div>

        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          {navGroups.map((group, idx) => (
            <div key={idx} className="mb-6">
              <p className="text-xs font-medium text-text-tertiary uppercase tracking-wider px-3 mb-2">
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
                          ? 'bg-accent-muted text-accent-hover shadow-sm'
                          : 'text-text-secondary hover:bg-surface-3 hover:text-text-primary'
                        }
                        relative
                      `}
                    >
                      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-accent' : 'text-text-tertiary group-hover:text-text-secondary'}`} />
                      <span>{item.label}</span>
                      {isActive && (
                        <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-full" />
                      )}
                      {isActive && <ChevronRight className="w-4 h-4 mr-auto text-accent" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <Link
          to="/profile"
          className="mx-3 mb-4 p-3 rounded-2xl bg-surface-2 border border-border-subtle hover:bg-surface-3 transition-colors block group"
        >
          <div className="flex items-center gap-3">
            <Avatar
              name={user?.name}
              avatarUrl={getAvatarUrl(user?.preferences)}
              initialsCount={2}
              className="w-9 h-9 rounded-xl bg-accent text-white text-sm font-bold flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate group-hover:text-accent-hover transition-colors">
                {user?.name}
              </p>
              <p className="text-xs text-text-tertiary truncate">{user?.email}</p>
            </div>
            <UserCog className="w-4 h-4 text-text-tertiary group-hover:text-accent transition-colors" />
          </div>
        </Link>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-10 flex items-center justify-between px-5 py-3 bg-surface-1/80 backdrop-blur-xl border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <img src={import.meta.env.BASE_URL + 'logo.png'} alt="لوگو" className="h-8 w-auto" />
            <span className="text-sm font-bold text-text-secondary hidden sm:inline">علامه حلی 10</span>
          </div>

          <div className="flex-1 flex justify-center"></div>

          <div className="flex items-center gap-2">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-xl shadow-lg shadow-indigo-500/25 transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">داشبورد</span>
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden text-text-secondary hover:text-text-primary p-2 rounded-xl hover:bg-surface-3 transition-colors"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}