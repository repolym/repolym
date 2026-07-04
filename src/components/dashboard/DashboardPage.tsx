import React, { useState, Suspense, lazy, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useDashboard } from '../../context/DashboardContext'
import { useStudySessions } from '../../hooks/useStudySessions'
import { useGoals } from '../../hooks/useGoals'
import { useTests } from '../../hooks/useTests'
import { calculateGoalsProgress } from '../../utils/calc-goal-progress'
import { today, formatDate, getGreeting } from '../../utils/date-utils'
import { Sunrise, Sun, Sunset, Moon, CalendarDays, LayoutDashboard, Zap, Trophy, TrendingUp } from 'lucide-react'
import { StatsCards } from './StatsCards'
import { Skeleton } from '../common/Loading'

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
            case 'morning': return Sunrise
            case 'noon': return Sun
            case 'afternoon': return Sunset
            default: return Moon
        }
    }, [greeting.period])

    return (
        <div className="h-full bg-[#020617] text-slate-200 font-sans p-4 md:p-8 flex flex-col gap-6 overflow-y-auto" dir="rtl">
            <header className="flex justify-between items-end border-b border-slate-800 pb-6 shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="h-3 w-3 bg-indigo-500 rounded-full shadow-[0_0_10px_#6366f1]"></span>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {formatDate(today())}
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white uppercase leading-none">
                        {greeting.text}، <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 font-light italic">{firstName}</span>
                    </h1>
                </div>
                <div className="text-left">
                    <GreetingIcon className="w-10 h-10 md:w-12 md:h-12 text-indigo-500 opacity-80" />
                </div>
            </header>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
            >
                <StatsCards sessions={sessions.data} loading={sessions.loading} />
            </motion.div>

            <div className="flex gap-2 border-b border-slate-800 pb-2 overflow-x-auto shrink-0 scrollbar-hide">
                {tabConfig.map((tab) => {
                    const isActive = activeTab === tab.id
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold uppercase tracking-widest transition-all duration-300 whitespace-nowrap
                                ${isActive
                                    ? 'bg-indigo-600/90 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] border border-indigo-400/30'
                                    : 'text-slate-500 hover:bg-slate-900/60 hover:text-slate-300 border border-transparent hover:border-slate-800'
                                }
                            `}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="flex-1 min-h-0 flex flex-col"
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
                            <PerformanceSection />
                        )}
                        {activeTab === 'growth' && (
                            <GrowthSection
                                sessions={sessions.data}
                                loading={sessions.loading}
                            />
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
        {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-slate-900/60 rounded-3xl p-6 border border-slate-800 space-y-4">
                <Skeleton className="h-6 w-32 bg-slate-800" />
                <Skeleton className="h-4 w-full bg-slate-800/50" />
                <Skeleton className="h-4 w-3/4 bg-slate-800/50" />
                <Skeleton className="h-32 w-full rounded-2xl bg-slate-800" />
            </div>
        ))}
    </div>
)

export default DashboardPage
