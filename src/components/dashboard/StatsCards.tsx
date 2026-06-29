import React, { useMemo } from 'react'
import type { StudySession } from '../../types/database'
import { formatMinutes, getWeekStart, getMonthStart, today } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'
import { Skeleton } from '../common/Loading'

interface StatsCardsProps {
  sessions: StudySession[]
  loading: boolean
}

export const StatsCards: React.FC<StatsCardsProps> = ({ sessions, loading }) => {
  const stats = useMemo(() => {
    const todayStr = today()
    const weekStart = getWeekStart()
    const monthStart = getMonthStart()

    const todayMins = sessions.filter((s) => s.date === todayStr).reduce((s, x) => s + x.duration_minutes, 0)
    const weekMins = sessions.filter((s) => s.date >= weekStart).reduce((s, x) => s + x.duration_minutes, 0)
    const monthMins = sessions.filter((s) => s.date >= monthStart).reduce((s, x) => s + x.duration_minutes, 0)

    const monthDays = new Set(sessions.filter((s) => s.date >= monthStart).map((s) => s.date)).size
    const avgPerDay = monthDays > 0 ? Math.round(monthMins / monthDays) : 0

    return { todayMins, weekMins, monthMins, monthDays, avgPerDay }
  }, [sessions])

  const items = [
    { label: 'امروز', value: formatMinutes(stats.todayMins), sub: 'مطالعه' },
    { label: 'این هفته', value: formatMinutes(stats.weekMins), sub: 'مطالعه' },
    { label: 'این ماه', value: formatMinutes(stats.monthMins), sub: `${toPersianDigits(stats.monthDays)} روز فعال` },
    { label: 'میانگین روزانه', value: formatMinutes(stats.avgPerDay), sub: 'این ماه' },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((_, i) => (
          <div key={i} className="card p-4 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-3 w-12" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item) => (
        <div key={item.label} className="card p-4">
          <p className="label mb-2">{item.label}</p>
          <p className="text-2xl font-semibold text-text-primary font-mono tabular-nums">{item.value}</p>
          <p className="text-xs text-text-tertiary mt-1">{item.sub}</p>
        </div>
      ))}
    </div>
  )
}