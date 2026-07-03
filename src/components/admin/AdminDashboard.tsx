// src/components/admin/AdminDashboard.tsx
// ترکیب پنل قبلی (جزئیات جلسات) + تحلیل‌های آماری با انتخاب المپیاد و بازه زمانی
import React, { useEffect, useState } from 'react'
import { supabase } from '../../config/supabase'
import { formatMinutes } from '../../utils/date-utils'
import { toJalaliLong, toGregorian } from '../../utils/jalali'
import { getWeekStart, getMonthStart, today } from '../../utils/date-utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

// ---------- انواع داده ----------
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

interface OlympiadStat {
  olympiad: string
  avg_minutes: number
  student_count: number
}

interface StudentRank {
  name: string
  total_minutes: number
}

// New: Leaderboard with score
interface LeaderboardEntry {
  user_id: string
  name: string
  total_minutes_30: number
  active_days_30: number
  best_streak: number
  avg_test_score: number
  composite_score: number
  rank: number
}

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

const AdminDashboard: React.FC = () => {
  // ---------- state مشترک ----------
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [olympiads, setOlympiads] = useState<string[]>([])

  // ---------- tab کنترل ----------
  const [activeTab, setActiveTab] = useState<'sessions' | 'analytics'>('sessions')

  // ---------- state بخش جلسات ----------
  const [sessions, setSessions] = useState<SessionDetail[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [jalaliStart, setJalaliStart] = useState('')
  const [jalaliEnd, setJalaliEnd] = useState('')

  // ---------- state بخش تحلیل ----------
  const [selectedOlympiad, setSelectedOlympiad] = useState<string>('all')
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('week')
  const [topStudents, setTopStudents] = useState<StudentRank[]>([])
  const [olympiadStats, setOlympiadStats] = useState<OlympiadStat[]>([])
  const [bestOlympiad, setBestOlympiad] = useState<OlympiadStat | null>(null)

  // New: Leaderboard data for admin
  const [adminLeaderboard, setAdminLeaderboard] = useState<LeaderboardEntry[]>([])

  // ---------- بارگذاری کاربران و المپیادها ----------
  useEffect(() => {
    const fetchMeta = async () => {
      const { data } = await supabase
        .from('users')
        .select('id, name, olympiad_id')
        .eq('is_admin', false)
        .order('name')
      if (data) {
        setUsers(data)
        const distinctOly = [...new Set(data.map(u => u.olympiad_id || 'نامشخص'))].sort()
        setOlympiads(distinctOly)
      }
    }
    fetchMeta()
  }, [])

  // ---------- بارگذاری جلسات (بر اساس فیلتر) ----------
  useEffect(() => {
    if (activeTab !== 'sessions') return
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
  }, [activeTab, selectedUser, jalaliStart, jalaliEnd])

  // ---------- بارگذاری تحلیل‌ها ----------
  useEffect(() => {
    if (activeTab !== 'analytics') return
    const fetchAnalytics = async () => {
      setLoading(true)
      try {
        // تعیین بازه زمانی
        const todayStr = today()
        let startDate: string | null = null
        if (period === 'week') startDate = getWeekStart()
        else if (period === 'month') startDate = getMonthStart()

        // دریافت جلسات با اطلاعات کاربر (المپیاد)
        let query = supabase
          .from('study_sessions')
          .select(`
            id,
            user_id,
            duration_minutes,
            users ( name, olympiad_id )
          `)
          .order('date', { ascending: false })

        if (startDate) {
          query = query.gte('date', startDate).lte('date', todayStr)
        }

        const { data, error } = await query
        if (error) throw error

        // گروه‌بندی داده‌ها
        const studentMap: Record<string, { name: string; total: number }> = {}
        const olympiadMap: Record<string, { total: number; count: number }> = {}

        for (const s of data || []) {
          const u = s.users as any
          const oId = u?.olympiad_id || 'نامشخص'
          if (selectedOlympiad !== 'all' && oId !== selectedOlympiad) continue

          const userId = s.user_id
          if (!studentMap[userId]) {
            studentMap[userId] = { name: u?.name || 'ناشناس', total: 0 }
          }
          studentMap[userId].total += s.duration_minutes

          if (!olympiadMap[oId]) olympiadMap[oId] = { total: 0, count: 0 }
          olympiadMap[oId].total += s.duration_minutes
          olympiadMap[oId].count += 1
        }

        // رتبه‌بندی دانش‌آموزان
        const top = Object.values(studentMap)
          .sort((a, b) => b.total - a.total)
          .slice(0, 10)
          .map(v => ({ name: v.name, total_minutes: v.total }))
        setTopStudents(top)

        // تحلیل المپیادها
        const stats: OlympiadStat[] = Object.entries(olympiadMap).map(([olymp, v]) => ({
          olympiad: olymp,
          avg_minutes: v.count > 0 ? Math.round(v.total / v.count) : 0,
          student_count: v.count,
        }))
        stats.sort((a, b) => b.avg_minutes - a.avg_minutes)
        setOlympiadStats(stats)
        setBestOlympiad(stats.length > 0 ? stats[0] : null)

        // Fetch leaderboard for admin (using new RPC)
        const { data: lbData, error: lbError } = await supabase.rpc('get_olympiad_leaderboard', {
          p_olympiad_id: selectedOlympiad === 'all' ? null : selectedOlympiad,
          p_today: todayStr,
          p_limit: 50,
          p_window_type: period === 'week' ? 'week' : period === 'month' ? 'month' : 'all'
        })
        if (!lbError && lbData) {
          const entries = lbData.entries || []
          // Map to our interface
          const mapped = entries.map((e: any) => ({
            user_id: e.user_id,
            name: e.name,
            total_minutes_30: e.total_minutes_30,
            active_days_30: e.active_days_30,
            best_streak: e.best_streak,
            avg_test_score: e.avg_test_score,
            composite_score: e.composite_score,
            rank: e.rank
          }))
          setAdminLeaderboard(mapped)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [activeTab, selectedOlympiad, period])

  // ---------- رندر ----------
  return (
    <div className="p-4 md:p-6 max-w-full mx-auto" dir="rtl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">پنل مدیریت</h1>

      {/* تب‌ها */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'sessions'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
        >
          جزئیات جلسات
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'analytics'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
        >
          تحلیل‌ها
        </button>
      </div>

      {/* محتوای تب جلسات */}
      {activeTab === 'sessions' && (
        <>
          {/* فیلترها */}
          <div className="bg-white rounded-2xl p-4 mb-4 shadow-card border border-gray-100 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">کاربر</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
              >
                <option value="all">همه کاربران</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div className="w-[180px]">
              <label className="block text-xs text-gray-500 mb-1">از تاریخ (جلالی)</label>
              <input
                type="text"
                placeholder="مثال: ۱۴۰۴/۰۳/۲۵"
                value={jalaliStart}
                onChange={(e) => setJalaliStart(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
              />
            </div>
            <div className="w-[180px]">
              <label className="block text-xs text-gray-500 mb-1">تا تاریخ (جلالی)</label>
              <input
                type="text"
                placeholder="مثال: ۱۴۰۴/۰۴/۰۱"
                value={jalaliEnd}
                onChange={(e) => setJalaliEnd(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={() => { setSelectedUser('all'); setJalaliStart(''); setJalaliEnd('') }}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              پاک‌کردن فیلترها
            </button>
          </div>

          {/* جدول */}
          <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-x-auto">
            {loading ? (
              <div className="py-10 text-center text-gray-400">در حال بارگذاری...</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 bg-gray-50/50">
                    <th className="text-right py-3 px-3">کاربر</th>
                    <th className="text-right py-3 px-3">تاریخ</th>
                    <th className="text-right py-3 px-3">مدت</th>
                    <th className="text-right py-3 px-3">فعالیت‌ها</th>
                    <th className="text-right py-3 px-3">بیداری</th>
                    <th className="text-right py-3 px-3">خواب</th>
                    <th className="text-right py-3 px-3">گوشی (ساعت)</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length === 0 ? (
                    <tr><td colSpan={7} className="py-10 text-center text-gray-400">هیچ جلسه‌ای با این فیلترها یافت نشد</td></tr>
                  ) : (
                    sessions.map((s) => (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                        <td className="py-3 px-3">
                          <span className="font-medium text-gray-800">{s.user_name}</span>
                          <div className="text-xs text-gray-400">{s.user_email}</div>
                        </td>
                        <td className="py-3 px-3 text-xs">{toJalaliLong(s.date)}</td>
                        <td className="py-3 px-3 font-mono text-xs">{formatMinutes(s.duration_minutes)}</td>
                        <td className="py-3 px-3 text-xs max-w-[200px] whitespace-pre-wrap break-words">{s.activities || '—'}</td>
                        <td className="py-3 px-3 text-xs">{s.wake_time || '—'}</td>
                        <td className="py-3 px-3 text-xs">{s.sleep_time || '—'}</td>
                        <td className="py-3 px-3 text-xs">{s.phone_hours || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* محتوای تب تحلیل‌ها */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* فیلترها */}
          <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 flex flex-wrap gap-4 items-end">
            <div className="w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">المپیاد</label>
              <select
                value={selectedOlympiad}
                onChange={(e) => setSelectedOlympiad(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
              >
                <option value="all">همه المپیادها</option>
                {olympiads.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              {(['week', 'month', 'all'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${period === p
                    ? 'bg-indigo-600 text-white shadow'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {p === 'week' ? 'این هفته' : p === 'month' ? 'این ماه' : 'کل'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-400">در حال بارگذاری تحلیل‌ها...</div>
          ) : (
            <>
              {/* بهترین المپیاد بازه */}
              {bestOlympiad && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100 shadow-sm">
                  <p className="text-sm text-indigo-600 mb-1">المپیاد برتر {period === 'week' ? 'این هفته' : period === 'month' ? 'این ماه' : 'کل'}</p>
                  <p className="text-2xl font-bold text-indigo-700">{bestOlympiad.olympiad}</p>
                  <p className="text-sm text-indigo-500">میانگین: {formatMinutes(bestOlympiad.avg_minutes)} مطالعه به ازای هر دانش‌آموز</p>
                </div>
              )}

              {/* نمودار میانگین المپیادها */}
              {olympiadStats.length > 0 && (
                <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">میانگین مطالعه هر المپیاد</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={olympiadStats} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="olympiad" type="category" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: any) => formatMinutes(Number(value))}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="avg_minutes" fill="#8B5CF6" radius={[0, 8, 8, 0]} barSize={24} name="میانگین دقیقه" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* برترین دانش‌آموزان */}
              <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  برترین دانش‌آموزان {selectedOlympiad !== 'all' ? `در المپیاد ${selectedOlympiad}` : ''}
                </h3>
                {topStudents.length === 0 ? (
                  <p className="text-gray-400 text-sm">داده‌ای برای بازه انتخاب‌شده موجود نیست.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={topStudents} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: any) => formatMinutes(Number(value))}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="total_minutes" fill="#4F46E5" radius={[0, 8, 8, 0]} barSize={24} name="دقیقه مطالعه" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* New: Admin Leaderboard with composite scores */}
              <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">جدول امتیازات ترکیبی (بر اساس الگوریتم هوشمند)</h3>
                {adminLeaderboard.length === 0 ? (
                  <p className="text-gray-400 text-sm">داده‌ای موجود نیست.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 bg-gray-50/50">
                          <th className="text-right py-2 px-3">رتبه</th>
                          <th className="text-right py-2 px-3">نام</th>
                          <th className="text-right py-2 px-3">امتیاز ترکیبی</th>
                          <th className="text-right py-2 px-3">مطالعه (۳۰ روز)</th>
                          <th className="text-right py-2 px-3">روزهای فعال</th>
                          <th className="text-right py-2 px-3">میانگین آزمون</th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminLeaderboard.map((entry) => (
                          <tr key={entry.user_id} className="border-b border-gray-50">
                            <td className="py-2 px-3 font-mono">{entry.rank}</td>
                            <td className="py-2 px-3 font-medium">{entry.name}</td>
                            <td className="py-2 px-3 font-mono text-indigo-600">{entry.composite_score}</td>
                            <td className="py-2 px-3 font-mono">{formatMinutes(entry.total_minutes_30)}</td>
                            <td className="py-2 px-3">{entry.active_days_30}</td>
                            <td className="py-2 px-3">{entry.avg_test_score}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard