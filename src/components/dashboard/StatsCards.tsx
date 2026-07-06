import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { StudySession } from '../../types/database'
import { formatMinutes, getWeekStart, getMonthStart, today } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'
import { Skeleton } from '../common/Loading'
import { Clock, TrendingUp, Calendar, Target } from 'lucide-react'

interface StatsCardsProps {
  sessions: StudySession[]
  loading: boolean
}

const cardConfig = [
  { label: 'امروز', icon: Clock, key: 'todayMins' },
  { label: 'این هفته', icon: TrendingUp, key: 'weekMins' },
  { label: 'این ماه', icon: Calendar, key: 'monthMins' },
  { label: 'میانگین روزانه', icon: Target, key: 'avgPerDay' },
] as const

type StatKey = (typeof cardConfig)[number]['key']

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

  const values: Record<StatKey, string> = {
    todayMins: formatMinutes(stats.todayMins),
    weekMins: formatMinutes(stats.weekMins),
    monthMins: formatMinutes(stats.monthMins),
    avgPerDay: formatMinutes(stats.avgPerDay),
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cardConfig.map((_, i) => (
          <div key={i} className="bg-surface-1 rounded-2xl p-5 shadow-card border border-border-subtle space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cardConfig.map(({ label, icon: Icon, key }) => (
        <motion.div
          key={key}
          whileHover={{ y: -2, scale: 1.02 }}
          className="bg-surface-1 rounded-2xl p-5 shadow-card border border-border-subtle transition-all"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-accent-muted flex items-center justify-center">
              <Icon className="w-4 h-4 text-accent" />
            </div>
            <span className="text-sm font-medium text-text-secondary">{label}</span>
          </div>
          <p className="text-2xl font-bold text-text-primary tabular-nums">{values[key]}</p>
          <p className="text-xs text-text-tertiary mt-1">
            {key === 'monthMins'
              ? `${toPersianDigits(stats.monthDays)} روز فعال`
              : 'مطالعه'}
          </p>
        </motion.div>
      ))}
    </div>
  )
}
