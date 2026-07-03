import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../config/supabase'
import { formatMinutes } from '../../utils/date-utils'
import { toJalaliLong } from '../../utils/jalali'
import type { StudySession, Subject } from '../../types/database'

type SessionWithSubject = StudySession & {
    subjects: Subject | null
}

const PublicStudyPage: React.FC = () => {
    const { userId } = useParams<{ userId: string }>()
    const [sessions, setSessions] = useState<SessionWithSubject[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!userId) return
        const fetchSessions = async () => {
            setLoading(true)
            setError(null)
            try {
                const { data, error: supabaseError } = await supabase
                    .from('study_sessions')
                    .select('id, date, duration_minutes, subjects (id, name, color)')
                    .eq('user_id', userId)
                    .order('date', { ascending: false })

                if (supabaseError) throw supabaseError

                // تبدیل داده‌ی خام به فرمت مورد انتظار
                const formatted = (data || []).map((item: any) => ({
                    ...item,
                    // اگر subjects به‌صورت آرایه برگشت (نادر)، اولین عنصر را بگیرد
                    subjects: Array.isArray(item.subjects) ? item.subjects[0] : item.subjects,
                })) as SessionWithSubject[]

                setSessions(formatted)
            } catch (err) {
                console.error(err)
                setError('خطا در بارگذاری اطلاعات')
            } finally {
                setLoading(false)
            }
        }

        fetchSessions()
    }, [userId])

    if (loading) {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center" dir="rtl">
                <p className="text-text-tertiary text-sm">در حال بارگذاری...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-surface-0 flex items-center justify-center" dir="rtl">
                <div className="text-center">
                    <p className="text-danger text-sm mb-2">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-accent text-xs hover:underline"
                    >
                        دوباره تلاش کنید
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-surface-0 p-4 md:p-6" dir="rtl">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-lg font-semibold text-text-primary mb-6">ساعات مطالعه</h1>

                {sessions.length === 0 ? (
                    <p className="text-text-tertiary text-sm">هنوز جلسه مطالعه‌ای ثبت نشده</p>
                ) : (
                    <ul className="space-y-2">
                        {sessions.map((session) => (
                            <li key={session.id} className="card-hover px-4 py-3 flex items-center gap-3">
                                <div
                                    className="w-2 h-8 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: session.subjects?.color || '#3a3a3f' }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-text-primary truncate">
                                        {session.subjects?.name || 'بدون درس'}
                                    </p>
                                </div>
                                <p className="text-xs text-text-tertiary whitespace-nowrap">
                                    {formatMinutes(session.duration_minutes)}
                                </p>
                                <p className="text-xs text-text-tertiary whitespace-nowrap hidden sm:block">
                                    {toJalaliLong(session.date)}
                                </p>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}

export default PublicStudyPage
