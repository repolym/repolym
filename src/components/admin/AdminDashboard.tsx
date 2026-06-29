import React, { useEffect, useState } from 'react'
import { supabase } from '../../config/supabase'
import { formatMinutes, today } from '../../utils/date-utils'
import { toJalaliLong } from '../../utils/jalali'

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
        // notes ساده (قدیمی)
        return { activities: notes, wake: '', sleep: '', phone: '' }
    }
}

const AdminDashboard: React.FC = () => {
    const [sessions, setSessions] = useState<SessionDetail[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAllSessions = async () => {
            setLoading(true)
            try {
                const { data, error } = await supabase
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
                    .limit(500) // افزایش در صورت نیاز

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

        fetchAllSessions()
    }, [])

    if (loading) {
        return (
            <div className="p-6 text-center">
                <p className="text-text-tertiary">در حال بارگذاری جلسات...</p>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-6 max-w-full mx-auto" dir="rtl">
            <h1 className="text-base font-semibold text-text-primary mb-4">جزئیات جلسات مطالعه</h1>

            <div className="card p-3 overflow-x-auto">
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
                                    هیچ جلسه‌ای ثبت نشده است
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
            </div>
        </div>
    )
}

export default AdminDashboard