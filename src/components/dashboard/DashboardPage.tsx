
import React, { useState, Suspense, lazy } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useDashboard } from '../../context/DashboardContext'
import { useStudySessions } from '../../hooks/useStudySessions'
import { useGoals } from '../../hooks/useGoals'
import { useTests } from '../../hooks/useTests'
import { calculateGoalsProgress } from '../../utils/calc-goal-progress'
import { today, formatDate, getGreeting } from '../../utils/date-utils'
import { Sunrise, Sun, Sunset, Moon, Calendar } from 'lucide-react'
import { StatsCards } from './StatsCards'
import { DashboardTabs } from './DashboardTabs'
import { Skeleton } from '../common/Loading'

const OverviewSection = lazy(() => import('./sections/OverviewSection'))
const PerformanceSection = lazy(() => import('./sections/PerformanceSection'))
const GrowthSection = lazy(() => import('./sections/GrowthSection'))
const AnalyticsSection = lazy(() => import('./AnalyticsSection'))
const LeaderboardSection = lazy(() => import('./sections/LeaderboardSection'))

type TabId = 'overview' | 'performance' | 'growth' | 'analytics' | 'leaderboard'

const tabConfig: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'خلاصه' },
    { id: 'performance', label: 'عملکرد' },
    { id: 'growth', label: 'رشد' },
    { id: 'analytics', label: 'تحلیل' },
    { id: 'leaderboard', label: 'جدول امتیازات' },
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

    const handleTabChange = (tabId: string) => {
        setActiveTab(tabId as TabId)
    }

    return (
        <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-8" dir="rtl">
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

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
            >
                <StatsCards sessions={sessions.data} loading={sessions.loading} />
            </motion.div>

            <DashboardTabs
                tabs={tabConfig}
                activeTab={activeTab}
                onChange={handleTabChange}
            />

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                >
                    <Suspense fallback={<SectionSkeleton />}>
                        {activeTab === 'overview' && (
                            <OverviewSection
                                goals={goalsWithProgress}
                                loading={goals.loading}
                                sessions={sessions.data}
                                tests={tests.data}
                            />
                        )}
                        {activeTab === 'performance' && (
                            <PerformanceSection
                                tests={tests.data}
                                loading={tests.loading}
                            />
                        )}
                        {activeTab === 'growth' && (
                            <GrowthSection
                                sessions={sessions.data}
                                loading={sessions.loading}
                            />
                        )}
                        {activeTab === 'analytics' && (
                            <AnalyticsSection userId={user?.id ?? null} />
                        )}
                        {activeTab === 'leaderboard' && (
                            <LeaderboardSection userId={user?.id ?? null} olympiadId={user?.olympiad_id ?? null} />
                        )}
                    </Suspense>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

const SectionSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-card border border-gray-100 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>
        ))}
    </div>
)
