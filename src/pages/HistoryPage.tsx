import React, { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { useStudySessions } from '../hooks/useStudySessions'
import { addDays, formatDate, formatMinutes, getCurrentJalaliMonthRange } from '../utils/date-utils'
import { getJalaliParts, PERSIAN_MONTHS, toPersianDigits } from '../utils/jalali'
import { Archive, CalendarDays, Clock3, BookOpen } from 'lucide-react'
import { Skeleton } from '../components/common/Loading'

interface MonthGroup {
    key: string
    label: string
    minutes: number
    sessionCount: number
    activeDays: number
    sessions: Array<{
        id: string
        date: string
        duration_minutes: number
        subjectName: string
        subjectColor: string
        activities: string | null
    }>
}

export const HistoryPage: React.FC = () => {
    const { user } = useAuth()
    const currentMonth = getCurrentJalaliMonthRange()
    const historyEnd = addDays(currentMonth.from, -1)

    const { data: sessions, loading, error } = useStudySessions({
        userId: user?.id ?? null,
        dateTo: historyEnd,
    })

    const groups = useMemo<MonthGroup[]>(() => {
        const map = new Map<string, MonthGroup>()

        for (const session of sessions) {
            const { jy, jm } = getJalaliParts(session.date)
            const key = `${jy}-${String(jm).padStart(2, '0')}`
            const existing = map.get(key) ?? {
                key,
                label: `${PERSIAN_MONTHS[jm - 1]} ${toPersianDigits(jy)}`,
                minutes: 0,
                sessionCount: 0,
                activeDays: 0,
                sessions: [],
            }

            existing.minutes += session.duration_minutes
            existing.sessionCount += 1
            existing.sessions.push({
                id: session.id,
                date: session.date,
                duration_minutes: session.duration_minutes,
                subjectName: session.subjects?.name ?? 'بدون درس',
                subjectColor: session.subjects?.color ?? '#94a3b8',
                activities: session.activities,
            })
            map.set(key, existing)
        }

        return [...map.values()]
            .map(group => ({
                ...group,
                activeDays: new Set(group.sessions.map(s => s.date)).size,
                sessions: group.sessions.sort((a, b) => b.date.localeCompare(a.date)),
            }))
            .sort((a, b) => b.key.localeCompare(a.key))
    }, [sessions])

    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0)

    return (
        <div className="min-h-full bg-surface-2 p-4 md:p-8" dir="rtl">
            <div className="max-w-5xl mx-auto space-y-6">
                <header className="flex items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs font-medium text-text-tertiary mb-2">
                            <Archive className="w-4 h-4" />
                            آرشیو عملکرد
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">ماه‌های گذشته</h1>
                        <p className="text-sm text-text-secondary mt-2">
                            داده‌های قبل از {currentMonth.label} فقط از داشبورد جاری جدا شده‌اند و هیچ رکوردی حذف نشده است.
                        </p>
                    </div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-surface-1 rounded-2xl border border-border-subtle p-5 shadow-card">
                        <div className="flex items-center gap-2 text-text-tertiary text-xs mb-2"><Clock3 className="w-4 h-4" /> کل مطالعه</div>
                        <div className="text-2xl font-bold text-text-primary">{formatMinutes(totalMinutes)}</div>
                    </div>
                    <div className="bg-surface-1 rounded-2xl border border-border-subtle p-5 shadow-card">
                        <div className="flex items-center gap-2 text-text-tertiary text-xs mb-2"><BookOpen className="w-4 h-4" /> جلسات</div>
                        <div className="text-2xl font-bold text-text-primary">{toPersianDigits(sessions.length)}</div>
                    </div>
                    <div className="bg-surface-1 rounded-2xl border border-border-subtle p-5 shadow-card">
                        <div className="flex items-center gap-2 text-text-tertiary text-xs mb-2"><CalendarDays className="w-4 h-4" /> ماه‌ها</div>
                        <div className="text-2xl font-bold text-text-primary">{toPersianDigits(groups.length)}</div>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => <Skeleton key={i} className="h-36 w-full rounded-2xl" />)}
                    </div>
                ) : error ? (
                    <div className="bg-surface-1 rounded-2xl border border-red-200 p-6 text-red-600">خطا در بارگذاری آرشیو: {error}</div>
                ) : groups.length === 0 ? (
                    <div className="bg-surface-1 rounded-2xl border border-border-subtle p-10 text-center text-text-tertiary">
                        پیش از {currentMonth.label} هنوز داده‌ای برای آرشیو ثبت نشده است.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {groups.map(group => (
                            <details key={group.key} className="bg-surface-1 rounded-2xl border border-border-subtle shadow-card overflow-hidden" open={group === groups[0]}>
                                <summary className="cursor-pointer list-none p-5 hover:bg-surface-2 transition-colors">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <h2 className="font-bold text-text-primary">{group.label}</h2>
                                            <p className="text-xs text-text-tertiary mt-1">
                                                {toPersianDigits(group.activeDays)} روز فعال · {toPersianDigits(group.sessionCount)} جلسه
                                            </p>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-lg font-bold text-accent">{formatMinutes(group.minutes)}</div>
                                            <div className="text-xs text-text-tertiary">کل مطالعه</div>
                                        </div>
                                    </div>
                                </summary>

                                <div className="border-t border-border-subtle divide-y divide-border-subtle">
                                    {group.sessions.map(session => (
                                        <div key={session.id} className="px-5 py-4 flex items-center gap-4">
                                            <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: session.subjectColor }} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-semibold text-text-primary">{formatMinutes(session.duration_minutes)}</span>
                                                    <span className="text-xs px-2 py-1 rounded-lg bg-surface-3 text-text-secondary">{session.subjectName}</span>
                                                </div>
                                                {session.activities && <p className="text-xs text-text-tertiary mt-1 truncate">{session.activities}</p>}
                                            </div>
                                            <span className="text-xs text-text-tertiary whitespace-nowrap">{formatDate(session.date)}</span>
                                        </div>
                                    ))}
                                </div>
                            </details>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default HistoryPage
