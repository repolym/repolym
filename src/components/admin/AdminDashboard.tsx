import React, { useEffect, useState } from 'react'
import { supabase } from '../../config/supabase'
import { formatMinutes, today, daysAgo, getWeekStart, getMonthStart } from '../../utils/date-utils'
import { toJalaliLong, toJalali, toGregorian, todayJalali } from '../../utils/jalali'
import { formatError } from '../../utils/error-handler'

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
  const [sessions, setSessions] = useState<SessionDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('all')
  // مستقیماً تاریخ جلالی ذخیره می‌شود
  const [jalaliStart, setJalaliStart] = useState('')
  const [jalaliEnd, setJalaliEnd] = useState('')
  const [activePreset, setActivePreset] = useState<string>('')

  // فیلترهای آماده — همگی بک‌اند-محور هستند (محدوده تاریخ جلالی را به میلادی
  // تبدیل کرده و مستقیماً در کوئری Supabase استفاده می‌کنیم)
  const applyPreset = (preset: 'today' | 'yesterday' | 'week' | 'month' | 'all') => {
    setActivePreset(preset)
    if (preset === 'all') {
      setJalaliStart('')
      setJalaliEnd('')
      return
    }
    if (preset === 'today') {
      const t = toJalali(today())
      setJalaliStart(t)
      setJalaliEnd(t)
      return
    }
    if (preset === 'yesterday') {
      const y = toJalali(daysAgo(1))
      setJalaliStart(y)
      setJalaliEnd(y)
      return
    }
    if (preset === 'week') {
      setJalaliStart(toJalali(getWeekStart()))
      setJalaliEnd(toJalali(today()))
      return
    }
    if (preset === 'month') {
      setJalaliStart(toJalali(getMonthStart()))
      setJalaliEnd(toJalali(today()))
      return
    }
  }

  // بارگذاری لیست کاربران
  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('users').select('id, name').order('name')
      if (data) setUsers(data)
    }
    fetchUsers()
  }, [])

  // بارگذاری جلسات بر اساس فیلترها
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

        // فقط در صورتی که تاریخ جلالی معتبر باشد، فیلتر تاریخ اعمال می‌شود
        if (jalaliStart) {
          try {
            const gregStart = toGregorian(jalaliStart)
            query = query.gte('date', gregStart)
          } catch { /* فرمت نامعتبر – نادیده گرفته می‌شود */ }
        }
        if (jalaliEnd) {
          try {
            const gregEnd = toGregorian(jalaliEnd)
            query = query.lte('date', gregEnd)
          } catch { /* فرمت نامعتبر */ }
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
        setLoadError(null)
      } catch (err) {
        setLoadError(formatError(err))
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [selectedUser, jalaliStart, jalaliEnd])

  return (
    <div className="p-4 md:p-6 max-w-full mx-auto" dir="rtl">
      <h1 className="text-base font-semibold text-text-primary mb-4">جزئیات جلسات مطالعه</h1>

      {/* فیلترها */}
      <div className="card p-4 mb-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'همه' },
            { key: 'today', label: 'امروز' },
            { key: 'yesterday', label: 'دیروز' },
            { key: 'week', label: 'این هفته' },
            { key: 'month', label: 'این ماه' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key as any)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                activePreset === p.key
                  ? 'bg-accent text-white border-accent'
                  : 'border-border text-text-secondary hover:bg-surface-2'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-text-secondary mb-1">کاربر</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full rounded-xs border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary"
            >
              <option value="all">همه کاربران</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="w-[180px]">
            <label className="block text-xs text-text-secondary mb-1">از تاریخ (جلالی)</label>
            <input
              type="text"
              placeholder="مثال: ۱۴۰۴/۰۳/۲۵"
              value={jalaliStart}
              onChange={(e) => { setJalaliStart(e.target.value); setActivePreset('') }}
              className="w-full rounded-xs border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <div className="w-[180px]">
            <label className="block text-xs text-text-secondary mb-1">تا تاریخ (جلالی)</label>
            <input
              type="text"
              placeholder="مثال: ۱۴۰۴/۰۴/۰۱"
              value={jalaliEnd}
              onChange={(e) => { setJalaliEnd(e.target.value); setActivePreset('') }}
              className="w-full rounded-xs border border-border bg-surface-1 px-3 py-2 text-sm text-text-primary"
            />
          </div>
          <button
            onClick={() => {
              setSelectedUser('all')
              setJalaliStart('')
              setJalaliEnd('')
              setActivePreset('')
            }}
            className="btn-ghost text-xs text-text-tertiary hover:text-text-primary"
          >
            پاک‌کردن فیلترها
          </button>
        </div>
      </div>

      {loadError && (
        <div className="card p-4 mb-4 text-sm text-danger bg-danger/10 border border-danger/20">
          {loadError}
        </div>
      )}

      {/* جدول */}
      <div className="card p-3 overflow-x-auto">
        {loading ? (
          <div className="py-8 text-center text-text-tertiary">در حال بارگذاری...</div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border-subtle text-text-secondary text-xs">
                <th className="text-right py-2 px-2 whitespace-nowrap">کاربر</th>
                <th className="text-right py-2 px-2 whitespace-nowrap">تاریخ</th>
                <th className="text-right py-2 px-2 whitespace-nowrap">مدت</th>
                <th className="text-right py-2 px-2 whitespace-nowrap">فعالیت‌ها</th>
                <th className="text-right py-2 px-2 whitespace-nowrap">بیداری</th>
                <th className="text-right py-2 px-2 whitespace-nowrap">خواب</th>
                <th className="text-right py-2 px-2 whitespace-nowrap">گوشی (ساعت)</th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-text-tertiary">
                    هیچ جلسه‌ای با این فیلترها یافت نشد
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-2 transition-colors">
                    <td className="py-2 px-2">
                      <span className="font-medium text-text-primary">{s.user_name}</span>
                      <div className="text-2xs text-text-tertiary">{s.user_email}</div>
                    </td>
                    <td className="py-2 px-2 text-xs">{toJalaliLong(s.date)}</td>
                    <td className="py-2 px-2 font-mono">{formatMinutes(s.duration_minutes)}</td>
                    <td className="py-2 px-2 text-xs max-w-[200px] whitespace-pre-wrap break-words">
                      {s.activities || '—'}
                    </td>
                    <td className="py-2 px-2 text-xs">{s.wake_time || '—'}</td>
                    <td className="py-2 px-2 text-xs">{s.sleep_time || '—'}</td>
                    <td className="py-2 px-2 text-xs">{s.phone_hours || '—'}</td>
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

export default AdminDashboard
