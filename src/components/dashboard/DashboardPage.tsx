import React, { useState, Suspense, lazy, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useDashboard } from '../../context/DashboardContext'
import { useStudySessions } from '../../hooks/useStudySessions'
import { useGoals } from '../../hooks/useGoals'
import { useTests } from '../../hooks/useTests'
import { calculateGoalsProgress } from '../../utils/calc-goal-progress'
import { today, formatDate, getGreeting } from '../../utils/date-utils'
import {
    LayoutDashboard,
    Zap,
    Trophy,
    TrendingUp,
    CalendarDays,
    Sunrise,
    Sun,
    Sunset,
    Moon,
} from 'lucide-react'
import { StatsCards } from './StatsCards'
import { Skeleton } from '../common/Loading'
import { ErrorBoundary } from '../common/ErrorBoundary'

const OverviewSection = lazy(() => import('./sections/OverviewSection'))
const PerformanceSection = lazy(() => import('./sections/PerformanceSection'))
const GrowthSection = lazy(() => import('./sections/GrowthSection'))
const LeaderboardSection = lazy(() => import('./sections/LeaderboardSection'))

type TabId = 'overview' | 'performance' | 'growth' | 'leaderboard'

const tabConfig: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'خلاصه', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'performance', label: 'عملکرد و تحلیل', icon: <Zap className="w-4 h-4" /> },
    { id: 'growth', label: 'رشد', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'جدول امتیازات', icon: <Trophy className="w-4 h-4" /> },
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

    const goalsWithProgress = useMemo(
        () => calculateGoalsProgress(goals.data, sessions.data),
        [goals.data, sessions.data]
    )

    const firstName = user?.name?.split(' ')[0] || 'دانش‌آموز'
    const greeting = getGreeting()
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
        <div className="h-full bg-gray-50 text-gray-800 font-sans p-4 md:p-8 flex flex-col gap-6 overflow-y-auto" dir="rtl">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-gray-200 pb-6 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="h-3 w-3 bg-indigo-500 rounded-full" />
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {formatDate(today())}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                        {greeting.text}، <span className="text-indigo-600">{firstName}</span>
                    </h1>
                </div>
                <div className="text-gray-400">
                    <GreetingIcon className="w-8 h-8" />
                </div>
            </header>

            {/* Stats Cards */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <StatsCards sessions={sessions.data} loading={sessions.loading} />
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto scrollbar-hide">
                {tabConfig.map((tab) => {
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${isActive
                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                }
              `}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 min-h-0"
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
                            <ErrorBoundary>
                                <PerformanceSection />
                            </ErrorBoundary>
                        )}
                        {activeTab === 'growth' && (
                            <ErrorBoundary>
                                <GrowthSection sessions={sessions.data} loading={sessions.loading} />
                            </ErrorBoundary>
                        )}
                        {activeTab === 'leaderboard' && (
                            <ErrorBoundary>
                                <LeaderboardSection userId={user?.id ?? null} olympiadId={user?.olympiad_id ?? null} />
                            </ErrorBoundary>
                        )}
                    </Suspense>
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

const SectionSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>
        ))}
    </div>
)

export default DashboardPage