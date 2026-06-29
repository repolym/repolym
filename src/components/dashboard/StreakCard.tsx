import React from 'react'
import type { StudySession } from '../../types/database'
import { calculateCurrentStreak, calculateLongestStreak } from '../../utils/calc-streak'
import { formatMinutes, today } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'
import { Skeleton } from '../common/Loading'

interface StreakCardProps {
  sessions: StudySession[]
  loading: boolean
}

export const StreakCard: React.FC<StreakCardProps> = ({ sessions, loading }) => {
  const current = React.useMemo(() => calculateCurrentStreak(sessions), [sessions])
  const longest = React.useMemo(() => calculateLongestStreak(sessions), [sessions])

  const totalMinutesToday = React.useMemo(() => {
    const todayStr = today()
    return sessions
      .filter((s) => s.date === todayStr)
      .reduce((sum, s) => sum + s.duration_minutes, 0)
  }, [sessions])

  if (loading) {
    return (
      <div className="card p-5 space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
    )
  }

  return (
    <div className="card p-5">
      <p className="label mb-3">روزهای متوالی</p>

      <div className="flex items-end gap-1 mb-1">
        <span className="text-4xl font-semibold text-text-primary font-mono tabular-nums">
          {toPersianDigits(current)}
        </span>
        <span className="text-sm text-text-secondary mb-1.5">روز</span>
      </div>

      <p className="text-xs text-text-tertiary">
        طولانی‌ترین: <span className="text-text-secondary">{toPersianDigits(longest)} روز</span>
      </p>

      {totalMinutesToday > 0 && (
        <div className="mt-3 pt-3 border-t border-border-subtle">
          <p className="text-xs text-text-tertiary">
            امروز: <span className="text-success font-medium">{formatMinutes(totalMinutesToday)}</span>
          </p>
        </div>
      )}

      {current === 0 && (
        <p className="mt-3 text-xs text-warning">یک جلسه ثبت کن تا روندت شروع بشه</p>
      )}
    </div>
  )
}