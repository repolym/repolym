// src/components/dashboard/DashboardPage.tsx
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
    Sparkles,
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
const AiAssistantSection = lazy(() => import('./sections/AiAssistantSection'))

type TabId = 'overview' | 'performance' | 'growth' | 'leaderboard' | 'ai'

const tabConfig: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'خلاصه', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'performance', label: 'عملکرد و تحلیل', icon: <Zap className="w-4 h-4" /> },
    { id: 'growth', label: 'رشد', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'leaderboard', label: 'جدول امتیازات', icon: <Trophy className="w-4 h-4" /> },
    { id: 'ai', label: 'دستیار هوش مصنوعی', icon: <Sparkles className="w-4 h-4" /> },
]

export const DashboardPage: React.FC = () => {
    const { user } = useAuth()
    const { dateRange } = useDashboard()
    const [activeTab, setActiveTab] = useState<TabId>('overview')

    const isAdmin = user?.is_admin ?? false

    // اگر ادمین است، فقط دستیار هوش مصنوعی را نشان بده
    if (isAdmin) {
        return (
            <div className="h-full bg-surface-2 text-text-primary font-sans p-4 md:p-8 flex flex-col gap-6 overflow-y-auto" dir="rtl">
                <header className="flex items-center justify-between border-b border-border pb-6 shrink-0">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="h-3 w-3 bg-accent rounded-full" />
                            <span className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                                <CalendarDays className="w-3 h-3" />
                                {formatDate(today())}
                            </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
                            {getGreeting().text}، <span className="text-accent">ادمین</span>
                        </h1>
                    </div>
                    <div className="text-text-tertiary">
                        {(() => {
                            const g = getGreeting()
                            const Icon = g.period === 'morning' ? Sunrise : g.period === 'noon' ? Sun : g.period === 'afternoon' ? Sunset : Moon
                            return <Icon className="w-8 h-8" />
                        })()}
                    </div>
                </header>
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 min-h-0"
                >
                    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
                        <ErrorBoundary>
                            <AiAssistantSection />
                        </ErrorBoundary>
                    </Suspense>
                </motion.div>
            </div>
        )
    }

    // ---------- کد قبلی برای دانش‌آموزان (بدون تغییر) ----------
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
            case 'morning': return Sunrise
            case 'noon': return Sun
            case 'afternoon': return Sunset
            default: return Moon
        }
    }, [greeting.period])

    return (
        <div className="h-full bg-surface-2 text-text-primary font-sans p-4 md:p-8 flex flex-col gap-6 overflow-y-auto" dir="rtl">
            {/* Header */}
            <header className="flex items-center justify-between border-b border-border pb-6 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="h-3 w-3 bg-accent rounded-full" />
                        <span className="text-[10px] font-bold text-accent uppercase tracking-wider flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {formatDate(today())}
                        </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-text-primary">
                        {greeting.text}، <span className="text-accent">{firstName}</span>
                    </h1>
                </div>
                <div className="text-text-tertiary">
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
            <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto scrollbar-hide">
                {tabConfig.map((tab) => {
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap
                ${isActive
                                    ? 'bg-accent-muted text-accent-hover shadow-sm'
                                    : 'text-text-secondary hover:bg-surface-2 hover:text-text-secondary'
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
                        {activeTab === 'ai' && (
                            <ErrorBoundary>
                                <AiAssistantSection />
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
            <div key={i} className="bg-surface-1 rounded-2xl p-6 border border-border-subtle shadow-card space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-32 w-full rounded-xl" />
            </div>
        ))}
    </div>
)

export default DashboardPage