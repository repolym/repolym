import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useDashboard } from '../../context/DashboardContext'
import { useStudySessions } from '../../hooks/useStudySessions'
import { useGoals } from '../../hooks/useGoals'
import { useTests } from '../../hooks/useTests'
import { calculateGoalsProgress } from '../../utils/calc-goal-progress'
import { Heatmap } from './Heatmap'
import { StreakCard } from './StreakCard'
import { GoalProgressCards } from './GoalProgressCards'
import { TestScoresChart } from './TestScoresChart'
import { StatsCards } from './StatsCards'
import { daysAgo, today, formatDate, getGreeting } from '../../utils/date-utils'
import { Sunrise, Sun, Sunset, Moon, Calendar } from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { dateRange } = useDashboard()

  const sessions = useStudySessions({
    userId: user?.id ?? null,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  })

  const allSessions = useStudySessions({
    userId: user?.id ?? null,
    dateFrom: daysAgo(365),
    dateTo: today(),
  })

  const goals = useGoals({ userId: user?.id ?? null, status: 'active' })
  const tests = useTests({
    userId: user?.id ?? null,
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
  })

  const goalsWithProgress = useMemo(
    () => calculateGoalsProgress(goals.data, sessions.data),
    [goals.data, sessions.data]
  )

  const firstName = user?.name?.split(' ')[0] || 'دانش‌آموز'

  const greeting = useMemo(() => getGreeting(), [])
  const GreetingIcon = useMemo(() => {
    switch (greeting.period) {
      case 'morning':
        return Sunrise
      case 'noon':
        return Sun
      case 'afternoon':
        return Sunset
      default:
        return Moon
    }
  }, [greeting.period])

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* هدر با احوال‌پرسی */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col gap-2"
      >
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <Calendar className="w-4 h-4" />
          <span>{formatDate(today())}</span>
        </div>
        <h1 className="text-3xl font-extrabold text-gray-800 leading-tight">
          <GreetingIcon className="inline-block w-7 h-7 text-amber-500 mr-2" />
          {greeting.text}، {firstName}
        </h1>
        <p className="text-gray-500 text-sm">{greeting.subtitle}</p>
      </motion.div>

      {/* کارت‌های آمار */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <StatsCards sessions={sessions.data} loading={sessions.loading} />
      </motion.div>

      {/* Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <Heatmap sessions={allSessions.data} />
      </motion.div>

      {/* ردیف پایین: Streak و اهداف */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
      >
        <div className="lg:col-span-1">
          <StreakCard sessions={allSessions.data} loading={allSessions.loading} />
        </div>
        <div className="lg:col-span-2">
          <GoalProgressCards goals={goalsWithProgress} loading={goals.loading} />
        </div>
      </motion.div>

      {/* نمودار آزمون‌ها */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <TestScoresChart tests={tests.data} loading={tests.loading} />
      </motion.div>
    </div>
  )
}
