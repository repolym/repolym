import React from 'react'
import { motion } from 'framer-motion'
import type { StudySession } from '../../types/database'
import { calculateCurrentStreak, calculateLongestStreak } from '../../utils/calc-streak'
import { formatMinutes, today } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'
import { Skeleton } from '../common/Loading'
import { Zap, Flame } from 'lucide-react'

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
      <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100 space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-4 w-32" />
      </div>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-2xl p-6 shadow-card border border-gray-100"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
          <Zap className="w-5 h-5 text-amber-500" />
        </div>
        <span className="font-medium text-gray-600">روزهای متوالی</span>
      </div>

      <div className="flex items-end gap-2 mb-1">
        <span className="text-5xl font-extrabold text-gray-800 tabular-nums">
          {toPersianDigits(current)}
        </span>
        <span className="text-gray-500 mb-1.5 text-sm">روز</span>
      </div>

      <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
        <Flame className="w-4 h-4 text-orange-400" />
        طولانی‌ترین: <span className="font-medium text-gray-700">{toPersianDigits(longest)} روز</span>
      </div>

      {totalMinutesToday > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            امروز: <span className="text-green-600 font-semibold">{formatMinutes(totalMinutesToday)}</span>
          </p>
        </div>
      )}

      {current === 0 && (
        <p className="mt-4 text-sm text-amber-600 bg-amber-50 rounded-xl px-3 py-2">
          یک جلسه ثبت کن تا روندت شروع بشه
        </p>
      )}
    </motion.div>
  )
}