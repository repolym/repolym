import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useDashboard } from '../../context/DashboardContext'
import { useStudySessions } from '../../hooks/useStudySessions'
import { useGoals } from '../../hooks/useGoals'
import { useTests } from '../../hooks/useTests'
import { calculateGoalsProgress } from '../../utils/calc-goal-progress'
import { daysAgo, today, formatDate, getGreeting } from '../../utils/date-utils'
import { Sunrise, Sun, Sunset, Moon, Calendar } from 'lucide-react'
import { StatsCards } from './StatsCards'
import { DashboardTabs } from './DashboardTabs'

// Direct imports – ensure each section has `export default`
import OverviewSection from './sections/OverviewSection'
import StudySection from './sections/StudySection'
import PerformanceSection from './sections/PerformanceSection'
import GrowthSection from './sections/GrowthSection'

type TabId = 'overview' | 'study' | 'performance' | 'growth'

const tabConfig: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'خلاصه' },
  { id: 'study', label: 'مطالعه' },
  { id: 'performance', label: 'عملکرد' },
  { id: 'growth', label: 'رشد' },
]

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { dateRange } = useDashboard()
  const [activeTab, setActiveTab] = useState<TabId>('overview')

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

  const goalsWithProgress = React.useMemo(
    () => calculateGoalsProgress(goals.data, sessions.data),
    [goals.data, sessions.data]
  )

  const firstName = user?.name?.split(' ')[0] || 'دانش‌آموز'
  const greeting = getGreeting()
  const GreetingIcon = React.useMemo(() => {
    switch (greeting.period) {
      case 'morning': return Sunrise
      case 'noon': return Sun
      case 'afternoon': return Sunset
      default: return Moon
    }
  }, [greeting.period])

  return (
    <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-8" dir="rtl">
      {/* Header */}
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
          <GreetingIcon className="inline-block w-7 h-7 text-amber-500 ml-2" />
          {greeting.text}، {firstName}
        </h1>
        <p className="text-gray-500 text-sm">{greeting.subtitle}</p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        <StatsCards sessions={sessions.data} loading={sessions.loading} />
      </motion.div>

      {/* Tabs */}
      <DashboardTabs tabs={tabConfig} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab content with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && (
            <OverviewSection
              goals={goalsWithProgress}
              loading={goals.loading}
              sessions={sessions.data}
              tests={tests.data}
            />
          )}
          {activeTab === 'study' && (
            <StudySection sessions={allSessions.data} loading={allSessions.loading} />
          )}
          {activeTab === 'performance' && (
            <PerformanceSection tests={tests.data} loading={tests.loading} />
          )}
          {activeTab === 'growth' && (
            <GrowthSection sessions={sessions.data} loading={sessions.loading} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}