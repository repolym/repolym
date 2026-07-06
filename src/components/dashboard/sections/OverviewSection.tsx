// src/components/dashboard/sections/OverviewSection.tsx
import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { StudySession } from '../../../types/database'
import { today } from '../../../utils/date-utils'
import { toPersianDigits, formatMinutesPersian } from '../../../utils/jalali'
import { Star, Clock, Target, CheckCircle2, Circle } from 'lucide-react'

interface OverviewSectionProps {
    sessions: StudySession[]
    goals: any[]
    tests: any[]
    loading: boolean
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ sessions, goals, loading }) => {
    const todayStr = today()

    const todayData = useMemo(() => {
        const safeSessions = sessions || []
        const safeGoals = goals || []

        const todaySessions = safeSessions.filter(s => s.date === todayStr)
        const totalMinutes = todaySessions.reduce((sum, s) => sum + s.duration_minutes, 0)

        const remainingGoals = safeGoals.filter(g => g && g.status !== 'completed' && !g.is_completed)
        const completedGoals = safeGoals.filter(g => g && (g.status === 'completed' || g.is_completed))

        let score = 1
        if (totalMinutes > 0) score += 1
        if (totalMinutes >= 180) score += 1

        if (safeGoals.length > 0) {
            if (remainingGoals.length === 0) score += 2
            else if (completedGoals.length > 0) score += 1
        } else {
            if (totalMinutes >= 240) score += 2
            else if (totalMinutes >= 90) score += 1
        }

        return { totalMinutes, remainingGoals, score: Math.min(5, score) }
    }, [sessions, goals, todayStr])

    if (loading) {
        return <div className="animate-pulse h-40 bg-surface-3 rounded-2xl mt-6"></div>
    }

    return (
        <div className="space-y-6 mt-6" dir="rtl">
            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 md:p-8 shadow-xl text-white text-right">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">خلاصه وضعیت امروز</h2>
                        <p className="text-accent-subtle text-sm">بررسی سریع عملکرد شما در امروز</p>
                    </div>

                    <div className="bg-surface-1/10 backdrop-blur-md rounded-2xl p-4 flex flex-col items-center min-w-[120px]">
                        <span className="text-xs text-accent-subtle mb-2 font-medium">نمره امروز شما</span>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    className={`w-5 h-5 ${star <= todayData.score ? 'fill-yellow-400 text-yellow-400' : 'fill-white/10 text-white/20'}`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="bg-black/10 rounded-2xl p-4 flex items-center gap-3 text-right">
                        <Clock className="text-accent-subtle w-8 h-8 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-accent-subtle">مدت مطالعه</p>
                            <p className="text-lg font-bold">{formatMinutesPersian(todayData.totalMinutes)}</p>
                        </div>
                    </div>
                    <div className="bg-black/10 rounded-2xl p-4 flex items-center gap-3 text-right">
                        <Target className="text-accent-subtle w-8 h-8 flex-shrink-0" />
                        <div>
                            <p className="text-xs text-accent-subtle">اهداف باقی‌مانده</p>
                            <p className="text-lg font-bold">{toPersianDigits(todayData.remainingGoals.length)} هدف</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-surface-1 rounded-3xl p-6 shadow-sm border border-border-subtle text-right">
                <h3 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    اهداف فعال و برنامه‌های امروز
                </h3>

                {todayData.remainingGoals.length === 0 ? (
                    <div className="text-center py-8 text-text-tertiary text-sm">
                        عالیه! تمامی اهداف برنامه‌ریزی شده را انجام داده‌اید یا هدفی ثبت نشده است. 🎉
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todayData.remainingGoals.map((goal, idx) => (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={goal.id || idx}
                                className="flex items-center gap-3 p-3 hover:bg-surface-2 rounded-xl transition-colors border border-border-subtle text-right"
                            >
                                <Circle className="w-5 h-5 text-text-tertiary flex-shrink-0" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-text-secondary">{goal.title || 'هدف بدون عنوان'}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default OverviewSection
