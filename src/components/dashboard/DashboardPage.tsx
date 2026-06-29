import React, { useMemo } from 'react'
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
import { daysAgo, today, formatDate } from '../../utils/date-utils'

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

  return (
    <div className="p-5 md:p-6 max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-base font-semibold text-text-primary">داشبورد</h1>
        <p className="text-xs text-text-tertiary mt-0.5">
          {formatDate(today())}
        </p>
      </div>

      {/* Stats */}
      <StatsCards sessions={sessions.data} loading={sessions.loading} />

      {/* Heatmap */}
      <Heatmap sessions={allSessions.data} />

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-1">
          <StreakCard sessions={allSessions.data} loading={allSessions.loading} />
        </div>
        <div className="lg:col-span-2">
          <GoalProgressCards goals={goalsWithProgress} loading={goals.loading} />
        </div>
      </div>

      {/* Tests */}
      <TestScoresChart tests={tests.data} loading={tests.loading} />
    </div>
  )
}