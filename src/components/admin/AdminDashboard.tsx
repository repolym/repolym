// src/components/admin/AdminDashboard.tsx
import React, { useEffect, useState } from 'react'
import { supabase } from '../../config/supabase'
import { formatMinutes, formatDate } from '../../utils/date-utils'
import { toJalaliLong, toGregorian, toPersianDigits } from '../../utils/jalali'
import { getWeekStart, getMonthStart, today } from '../../utils/date-utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'
import { adminService } from '../../services/adminService'
import { getOlympiad } from '../../config/olympiads'
import { useToast } from '../../context/ToastContext'
import { Users, BookOpen, ClipboardList, Activity, UserPlus, Clock, ChevronLeft, TrendingUp, Calendar, Award } from 'lucide-react'
import { Link } from 'react-router-dom'

// ---------- Types ----------
interface SessionDetail {
  id: string
  user_name: string
  user_email: string
  date: string
  duration_minutes: number
  subject_name: string | null
  activities: string
  wake_time: string
  sleep_time: string
  phone_hours: string
}

// ---------- Helpers ----------
const parseNotes = (notes: string | null) => {
  if (!notes) return { activities: '', wake: '', sleep: '', phone: '' }
  try {
    const parsed = JSON.parse(notes)
    return {
      activities: parsed.activities || '',
      wake: parsed.wake || '',
      sleep: parsed.sleep || '',
      phone: parsed.phone || '',
    }
  } catch {
    return { activities: notes, wake: '', sleep: '', phone: '' }
  }
}

// ---------- OverviewTab ----------
const OverviewTab: React.FC = () => {
  const [stats, setStats] = useState<{
    totalUsers: number
    totalSessions: number
    totalTests: number
    activeToday: number
    newUsersToday: number
    newUsersWeek: number
    newUsersMonth: number
    totalOlympiads: number
    recentUsers: any[]
    recentActivity: any[]
  } | null>(null)
  const [registrationData, setRegistrationData] = useState<{ date: string; count: number }[]>([])
  const [activityData, setActivityData] = useState<{ date: string; activeUsers: number }[]>([])
  const [olympiadData, setOlympiadData] = useState<{ olympiad: string; count: number }[]>([])
  const [submissionData, setSubmissionData] = useState<{ date: string; submissions: number }[]>([])
  const [topUsers, setTopUsers] = useState<{ user_id: string; name: string; total_minutes: number; sessions_count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const { showToast } = useToast()

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        const [statsData, regTrend, actTrend, olympiadPart, subTrend, topUsers] = await Promise.all([
          adminService.getStats(),
          adminService.getRegistrationTrend(30),
          adminService.getActivityTrend(30),
          adminService.getOlympiadParticipation(),
          adminService.getSubmissionTrend(30),
          adminService.getTopActiveUsers(10),
        ])
        if (!isMounted) return
        // Map raw olympiad_id values (e.g. "math", "ai") to their
        // human-readable Persian labels using the shared olympiads config,
        // instead of showing the raw id in the pie chart.
        const readableOlympiadPart = olympiadPart.map((item) => ({
          ...item,
          olympiad: getOlympiad(item.olympiad)?.shortLabel || item.olympiad,
        }))
        setStats(statsData)
        setRegistrationData(regTrend)
        setActivityData(actTrend)
        setOlympiadData(readableOlympiadPart)
        setSubmissionData(subTrend)
        setTopUsers(topUsers)
      } catch (err) {
        if (isMounted) {
          showToast(err instanceof Error ? err.message : 'خطا در دریافت آمار', 'error')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchData()
    return () => {
      isMounted = false
    }
  }, [showToast])

  if (loading) {
    return <div className="text-center py-8 text-text-tertiary">در حال بارگذاری...</div>
  }

  if (!stats) return null

  const statCards = [
    { label: 'کل کاربران', value: stats.totalUsers, icon: Users, color: 'bg-accent' },
    { label: 'کاربران فعال امروز', value: stats.activeToday, icon: Activity, color: 'bg-emerald-500' },
    { label: 'کاربران جدید امروز', value: stats.newUsersToday, icon: UserPlus, color: 'bg-amber-500' },
    { label: 'جدید این هفته', value: stats.newUsersWeek, icon: Calendar, color: 'bg-purple-500' },
    { label: 'جدید این ماه', value: stats.newUsersMonth, icon: TrendingUp, color: 'bg-rose-500' },
    { label: 'تعداد المپیادها', value: stats.totalOlympiads, icon: Award, color: 'bg-sky-500' },
    { label: 'کل جلسات مطالعه', value: stats.totalSessions, icon: BookOpen, color: 'bg-blue-500' },
    { label: 'کل آزمون‌ها', value: stats.totalTests, icon: ClipboardList, color: 'bg-violet-500' },
  ]

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#14b8a6', '#3b82f6', '#f97316', '#06b6d4']

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-1 border border-border rounded-xl p-3 shadow-lg text-right text-sm">
          <p className="font-medium text-text-secondary mb-1">{toJalaliLong(label)}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} className="text-text-secondary">
              {p.name === 'count' ? 'تعداد' :
                p.name === 'activeUsers' ? 'کاربران فعال' :
                  p.name === 'submissions' ? 'جلسات' :
                    p.name === 'value' ? 'تعداد' :
                      p.name}
              : <span className="font-bold">{toPersianDigits(p.value)}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-secondary">{card.label}</p>
                <p className="text-2xl font-bold text-text-primary">{toPersianDigits(card.value)}</p>
              </div>
              <div className={`w-10 h-10 rounded-xl ${card.color} bg-opacity-10 flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color.replace('bg-', 'text-')}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-5">
          <h3 className="text-sm font-semibold text-text-secondary mb-4">ثبت‌نام کاربران (۳۰ روز اخیر)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={registrationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                interval={4}
                stroke="#9CA3AF"
                tickFormatter={(date) => toJalaliLong(date).split(' - ')[1].slice(0, 5)}
              />
              <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" tickFormatter={(v) => toPersianDigits(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2} dot={false} name="تعداد" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-5">
          <h3 className="text-sm font-semibold text-text-secondary mb-4">فعالیت روزانه کاربران (۳۰ روز اخیر)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                interval={4}
                stroke="#9CA3AF"
                tickFormatter={(date) => toJalaliLong(date).split(' - ')[1].slice(0, 5)}
              />
              <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" tickFormatter={(v) => toPersianDigits(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="activeUsers" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="کاربران فعال" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-5">
          <h3 className="text-sm font-semibold text-text-secondary mb-4">توزیع المپیادها</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={olympiadData}
                dataKey="count"
                nameKey="olympiad"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name }) => name}
              >
                {olympiadData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => value != null ? toPersianDigits(value) : ''} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-5">
          <h3 className="text-sm font-semibold text-text-secondary mb-4">تعداد جلسات مطالعه (۳۰ روز اخیر)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={submissionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                interval={4}
                stroke="#9CA3AF"
                tickFormatter={(date) => toJalaliLong(date).split(' - ')[1].slice(0, 5)}
              />
              <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" tickFormatter={(v) => toPersianDigits(v)} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="submissions" stroke="#EC4899" strokeWidth={2} dot={false} name="جلسات" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Active Users */}
      <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-5">
        <h3 className="text-sm font-semibold text-text-secondary mb-4">پرکاربردترین کاربران</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary bg-surface-2/50">
                <th className="text-right py-2 px-3 font-medium">کاربر</th>
                <th className="text-right py-2 px-3 font-medium">جلسات</th>
                <th className="text-right py-2 px-3 font-medium">مدت کل</th>
              </tr>
            </thead>
            <tbody>
              {topUsers.map((u) => (
                <tr key={u.user_id} className="border-b border-border-subtle hover:bg-surface-2/50 transition-colors">
                  <td className="py-2 px-3 font-medium text-text-primary">{u.name}</td>
                  <td className="py-2 px-3">{toPersianDigits(u.sessions_count)}</td>
                  <td className="py-2 px-3 font-mono">{formatMinutes(u.total_minutes)}</td>
                </tr>
              ))}
              {topUsers.length === 0 && (
                <tr><td colSpan={3} className="py-4 text-center text-text-tertiary">داده‌ای موجود نیست</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Users & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-accent" />
              کاربران جدید
            </h3>
            <Link to="/admin/users" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1">
              مشاهده همه
              <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {stats.recentUsers.length === 0 ? (
              <p className="text-sm text-text-tertiary">هیچ کاربر جدیدی ثبت نشده</p>
            ) : (
              stats.recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 hover:bg-surface-2 rounded-lg transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{user.name}</p>
                    <p className="text-xs text-text-tertiary truncate">{user.email}</p>
                  </div>
                  <span className="text-xs text-text-tertiary whitespace-nowrap mr-2">{formatDate(user.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" />
              آخرین فعالیت‌ها
            </h3>
            <Link to="/admin/logs" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1">
              مشاهده همه
              <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-text-tertiary">هیچ فعالیتی ثبت نشده</p>
            ) : (
              stats.recentActivity.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 hover:bg-surface-2 rounded-lg transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">{log.users?.name || 'ناشناس'}</p>
                    <p className="text-xs text-text-tertiary truncate">{log.action}</p>
                  </div>
                  <span className="text-xs text-text-tertiary whitespace-nowrap mr-2">{formatDate(log.created_at)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- Sessions Tab ----------
const SessionsTab: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [sessions, setSessions] = useState<SessionDetail[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [jalaliStart, setJalaliStart] = useState('')
  const [jalaliEnd, setJalaliEnd] = useState('')

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('id, name')
        .eq('is_admin', false)
        .order('name')
      if (data) setUsers(data)
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true)
      try {
        let query = supabase
          .from('study_sessions')
          .select(`
                        id,
                        user_id,
                        date,
                        duration_minutes,
                        notes,
                        users ( name, email ),
                        subjects ( name )
                    `)
          .order('date', { ascending: false })
          .limit(1000)

        if (selectedUser !== 'all') {
          query = query.eq('user_id', selectedUser)
        }
        if (jalaliStart) {
          try { query = query.gte('date', toGregorian(jalaliStart)) } catch { }
        }
        if (jalaliEnd) {
          try { query = query.lte('date', toGregorian(jalaliEnd)) } catch { }
        }

        const { data, error } = await query
        if (error) throw error

        const formatted: SessionDetail[] = (data || []).map((s: any) => {
          const { activities, wake, sleep, phone } = parseNotes(s.notes)
          return {
            id: s.id,
            user_name: s.users?.name || 'نامشخص',
            user_email: s.users?.email || '',
            date: s.date,
            duration_minutes: s.duration_minutes,
            subject_name: s.subjects?.name || null,
            activities,
            wake_time: wake,
            sleep_time: sleep,
            phone_hours: phone,
          }
        })
        setSessions(formatted)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchSessions()
  }, [selectedUser, jalaliStart, jalaliEnd])

  return (
    <div>
      {/* Filters */}
      <div className="bg-surface-1 rounded-2xl p-4 mb-4 shadow-card border border-border-subtle flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-text-secondary mb-1">کاربر</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">همه کاربران</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-[180px]">
          <label className="block text-xs text-text-secondary mb-1">از تاریخ (جلالی)</label>
          <input
            type="text"
            placeholder="مثال: ۱۴۰۴/۰۳/۲۵"
            value={jalaliStart}
            onChange={(e) => setJalaliStart(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="w-full sm:w-[180px]">
          <label className="block text-xs text-text-secondary mb-1">تا تاریخ (جلالی)</label>
          <input
            type="text"
            placeholder="مثال: ۱۴۰۴/۰۴/۰۱"
            value={jalaliEnd}
            onChange={(e) => setJalaliEnd(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={() => { setSelectedUser('all'); setJalaliStart(''); setJalaliEnd('') }}
          className="text-xs text-text-secondary hover:text-accent bg-surface-3 hover:bg-accent-muted px-3 py-2 rounded-xl transition"
        >
          پاک‌کردن فیلترها
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle overflow-x-auto min-w-full">
        {loading ? (
          <div className="py-10 text-center text-text-tertiary">در حال بارگذاری...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-text-secondary bg-surface-2/50 whitespace-nowrap">
                <th className="text-right py-3 px-4 font-medium">کاربر</th>
                <th className="text-right py-3 px-4 font-medium">تاریخ</th>
                <th className="text-right py-3 px-4 font-medium">مدت</th>
                <th className="text-right py-3 px-4 font-medium">فعالیت‌ها</th>
                <th className="text-right py-3 px-4 font-medium">بیداری</th>
                <th className="text-right py-3 px-4 font-medium">خواب</th>
                <th className="text-right py-3 px-4 font-medium">گوشی (ساعت)</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-text-tertiary">هیچ جلسه‌ای با این فیلترها یافت نشد</td></tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="border-b border-border-subtle hover:bg-surface-2/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-medium text-text-primary">{s.user_name}</span>
                      <div className="text-xs text-text-tertiary">{s.user_email}</div>
                    </td>
                    <td className="py-3 px-4 text-xs whitespace-nowrap">{toJalaliLong(s.date)}</td>
                    <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">{formatMinutes(s.duration_minutes)}</td>
                    <td className="py-3 px-4 text-xs max-w-[200px] whitespace-pre-wrap break-words">{s.activities || '—'}</td>
                    <td className="py-3 px-4 text-xs whitespace-nowrap">{s.wake_time || '—'}</td>
                    <td className="py-3 px-4 text-xs whitespace-nowrap">{s.sleep_time || '—'}</td>
                    <td className="py-3 px-4 text-xs whitespace-nowrap">{s.phone_hours || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ---------- Analytics Tab (focus on study hours per user) ----------
const AnalyticsTab: React.FC = () => {
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week')
  const [data, setData] = useState<{ date: string; minutes: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('users')
        .select('id, name')
        .eq('is_admin', false)
        .order('name')
      if (data) setUsers(data)
    }
    fetchUsers()
  }, [])

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        const todayStr = today()
        let startDate: string | null = null
        if (period === 'week') startDate = getWeekStart()
        else if (period === 'month') startDate = getMonthStart()

        let query = supabase
          .from('study_sessions')
          .select('date, duration_minutes')
          .order('date', { ascending: true })

        if (selectedUser !== 'all') {
          query = query.eq('user_id', selectedUser)
        }
        if (startDate) {
          query = query.gte('date', startDate).lte('date', todayStr)
        }

        const { data, error } = await query
        if (error) throw error

        // Aggregate by date
        const map = new Map<string, number>()
        data?.forEach(s => {
          map.set(s.date, (map.get(s.date) || 0) + s.duration_minutes)
        })
        const result = Array.from(map.entries()).map(([date, minutes]) => ({ date, minutes }))
        setData(result)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [selectedUser, period])

  const totalMinutes = data.reduce((sum, d) => sum + d.minutes, 0)
  const avgMinutes = data.length > 0 ? Math.round(totalMinutes / data.length) : 0

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-surface-1 rounded-2xl p-4 shadow-card border border-border-subtle flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs text-text-secondary mb-1">کاربر</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">همه کاربران</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'all'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${period === p
                  ? 'bg-accent text-white shadow'
                  : 'bg-surface-3 text-text-secondary hover:bg-surface-3'
                }`}
            >
              {p === 'week' ? 'این هفته' : p === 'month' ? 'این ماه' : 'کل'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-text-tertiary">در حال بارگذاری...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-5">
              <p className="text-sm text-text-secondary">کل مطالعه</p>
              <p className="text-2xl font-bold">{formatMinutes(totalMinutes)}</p>
            </div>
            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-5">
              <p className="text-sm text-text-secondary">تعداد روزها</p>
              <p className="text-2xl font-bold">{toPersianDigits(data.length)}</p>
            </div>
            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-5">
              <p className="text-sm text-text-secondary">میانگین روزانه</p>
              <p className="text-2xl font-bold">{formatMinutes(avgMinutes)}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-5">
            <h3 className="text-sm font-semibold text-text-secondary mb-4">روند مطالعه روزانه</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  interval={Math.floor(data.length / 10)}
                  stroke="#9CA3AF"
                  tickFormatter={(date) => toJalaliLong(date).split(' - ')[1].slice(0, 5)}
                />
                <YAxis tick={{ fontSize: 10 }} stroke="#9CA3AF" tickFormatter={(v) => formatMinutes(v)} />
                <Tooltip
                  formatter={(value: any) => formatMinutes(value)}
                  labelFormatter={(label) => toJalaliLong(label)}
                />
                <Bar dataKey="minutes" fill="#6366F1" radius={[4, 4, 0, 0]} name="دقیقه مطالعه" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

// ---------- Main AdminDashboard ----------
const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'analytics'>('overview')

  return (
    <div className="p-4 md:p-6 max-w-full mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-text-primary mb-6">پنل مدیریت</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'overview'
              ? 'bg-accent text-white shadow-lg shadow-indigo-200'
              : 'bg-surface-1 text-text-secondary border border-border hover:bg-surface-2'
            }`}
        >
          نمای کلی
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'sessions'
              ? 'bg-accent text-white shadow-lg shadow-indigo-200'
              : 'bg-surface-1 text-text-secondary border border-border hover:bg-surface-2'
            }`}
        >
          جزئیات جلسات
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'analytics'
              ? 'bg-accent text-white shadow-lg shadow-indigo-200'
              : 'bg-surface-1 text-text-secondary border border-border hover:bg-surface-2'
            }`}
        >
          تحلیل‌ها
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'sessions' && <SessionsTab />}
      {activeTab === 'analytics' && <AnalyticsTab />}
    </div>
  )
}

export default AdminDashboard
