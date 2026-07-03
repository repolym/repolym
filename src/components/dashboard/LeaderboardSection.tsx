// src/components/dashboard/LeaderboardSection.tsx
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Trophy, Medal, Flame, Clock, Target, BarChart3,
    RefreshCw, ChevronDown, ChevronUp, Users,
} from 'lucide-react'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { getOlympiad } from '../../config/olympiads'
import { OLYMPIAD_ICON_MAP } from '../../config/olympiad-icons'
import { toPersianDigits, formatMinutesPersian } from '../../utils/jalali'
import { Skeleton, EmptyState, ErrorMessage } from '../common/Loading'
import type { LeaderboardEntry } from '../../types/leaderboard'

// ─────────────────────────────────────────────────────────────────────────────
// ثابت‌ها
// ─────────────────────────────────────────────────────────────────────────────

type WindowType = 'today' | 'week' | 'month' | 'all'

const WINDOW_LABELS: Record<WindowType, string> = {
    today: 'امروز',
    week: 'این هفته',
    month: 'این ماه',
    all: 'همه زمان‌ها',
}

const RANK_ICONS: Record<number, { icon: React.ElementType; color: string; bg: string }> = {
    1: { icon: Trophy, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-200' },
    2: { icon: Medal, color: 'text-slate-400', bg: 'bg-slate-50 border-slate-200' },
    3: { icon: Medal, color: 'text-amber-700', bg: 'bg-orange-50 border-orange-200' },
}

// ─────────────────────────────────────────────────────────────────────────────
// کامپوننت‌های کمکی
// ─────────────────────────────────────────────────────────────────────────────

const ScoreBar: React.FC<{ value: number | null | undefined; color: string }> = ({ value, color }) => {
    const safeValue = value ?? 0
    const clampedValue = Math.min(100, Math.max(0, safeValue))

    return (
        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${clampedValue}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
            />
        </div>
    )
}

const StatPill: React.FC<{
    icon: React.ElementType
    value: string
    label: string
    color: string
}> = ({ icon: Icon, value, label, color }) => (
    <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${color} flex-shrink-0`} aria-hidden="true" />
        <span className="text-xs text-gray-700 font-medium tabular-nums">{value}</span>
        <span className="text-xs text-gray-400 hidden sm:inline">{label}</span>
    </div>
)

// ─────────────────────────────────────────────────────────────────────────────
// کارت هر ردیف لیدربورد
// ─────────────────────────────────────────────────────────────────────────────

interface EntryCardProps {
    entry: LeaderboardEntry
    isCurrentUser: boolean
    accentColor: string
    index: number
}

const EntryCard: React.FC<EntryCardProps> = ({ entry, isCurrentUser, accentColor, index }) => {
    const [expanded, setExpanded] = useState(false)
    const rank = entry.rank ?? 0
    const rankCfg = RANK_ICONS[rank]
    const RankIcon = rankCfg?.icon

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.25 }}
            className={`
                rounded-2xl border transition-all duration-200 overflow-hidden
                ${isCurrentUser
                    ? 'border-2 shadow-md'
                    : 'border border-gray-100 hover:border-gray-200 hover:shadow-sm'
                }
            `}
            style={isCurrentUser ? { borderColor: accentColor, boxShadow: `0 0 0 3px ${accentColor}22` } : {}}
        >
            {/* ردیف اصلی */}
            <div
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none
                    ${isCurrentUser ? 'bg-white' : 'bg-white hover:bg-gray-50/80'}`}
                onClick={() => setExpanded((p) => !p)}
                role="button"
                aria-expanded={expanded}
            >
                {/* رتبه */}
                <div className={`
                    w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border
                    ${rankCfg ? `${rankCfg.bg} ${rankCfg.color}` : 'bg-gray-50 border-gray-200 text-gray-500'}
                `}>
                    {RankIcon
                        ? <RankIcon className="w-4 h-4" aria-hidden="true" />
                        : <span className="text-xs font-bold tabular-nums">{toPersianDigits(rank)}</span>
                    }
                </div>

                {/* نام */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold truncate ${isCurrentUser ? 'text-indigo-700' : 'text-gray-800'}`}>
                            {entry.name || 'کاربر ناشناس'}
                        </p>
                        {isCurrentUser && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                                style={{ backgroundColor: accentColor }}>
                                شما
                            </span>
                        )}
                    </div>
                    {/* نوار امتیاز */}
                    <div className="mt-1.5">
                        <ScoreBar value={entry.composite_score ?? 0} color={accentColor} />
                    </div>
                </div>

                {/* امتیاز کلی */}
                <div className="text-left flex-shrink-0">
                    <p className="text-base font-bold tabular-nums" style={{ color: accentColor }}>
                        {toPersianDigits(entry.composite_score ?? 0)}
                    </p>
                    <p className="text-[10px] text-gray-400">امتیاز</p>
                </div>

                {/* آیکون باز/بسته */}
                <div className="text-gray-400 flex-shrink-0">
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </div>

            {/* جزئیات (گسترش‌پذیر) */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 pt-1 border-t border-gray-100 bg-gray-50/50">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                                <StatPill
                                    icon={Clock}
                                    value={formatMinutesPersian(entry.total_minutes_30 ?? 0)}
                                    label="مطالعه ۳۰ روز"
                                    color="text-indigo-500"
                                />
                                <StatPill
                                    icon={Target}
                                    value={`${toPersianDigits(entry.active_days_30 ?? 0)} روز`}
                                    label="روز فعال"
                                    color="text-emerald-500"
                                />
                                <StatPill
                                    icon={Flame}
                                    value={`${toPersianDigits(entry.best_streak ?? 0)} روز`}
                                    label="بهترین استریک"
                                    color="text-orange-500"
                                />
                                <StatPill
                                    icon={BarChart3}
                                    value={`${toPersianDigits(entry.avg_test_score ?? 0)}٪`}
                                    label="میانگین آزمون"
                                    color="text-sky-500"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// کامپوننت اصلی لیدربورد
// ─────────────────────────────────────────────────────────────────────────────

interface LeaderboardSectionProps {
    userId: string | null
    olympiadId: string | null
}

export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({
    userId,
    olympiadId,
}) => {
    const [windowType, setWindowType] = useState<WindowType>('month')
    const { data, loading, error, refetch } = useLeaderboard({
        olympiadId,
        window: windowType,
        limit: 50,
    })
    const olympiad = getOlympiad(olympiadId)
    const OlympiadIcon = olympiad ? OLYMPIAD_ICON_MAP[olympiad.icon] ?? OLYMPIAD_ICON_MAP['Sparkles'] : null

    // ── بارگذاری ──────────────────────────────────────────────
    if (loading && !data) {
        return (
            <div className="space-y-3 mt-4">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-3">
                        <Skeleton className="w-9 h-9 rounded-xl" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-1.5 w-full rounded-full" />
                        </div>
                        <Skeleton className="h-6 w-10" />
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="mt-4">
                <ErrorMessage message={error} onRetry={refetch} />
            </div>
        )
    }

    // ── استخراج امن داده‌ها ──────────────────────────────────
    const entries: LeaderboardEntry[] = Array.isArray(data?.entries) ? data.entries : []
    const totalUsers: number = data?.total_users ?? 0

    // ── بدون المپیاد ───────────────────────────────────────────
    if (!olympiadId || !olympiad) {
        return (
            <div className="mt-4">
                <EmptyState
                    title="المپیاد انتخاب‌نشده"
                    description="برای دیدن لیدربورد، ابتدا المپیاد خود را از صفحه پروفایل انتخاب کنید."
                />
            </div>
        )
    }

    // ── بدون داده‌های لیدربورد ──────────────────────────────────
    if (!data || entries.length === 0) {
        return (
            <div className="mt-4">
                <EmptyState
                    title="هنوز رقیبی نیست!"
                    description="اولین نفری باش که در این المپیاد ثبت‌نام می‌کنه و جایگاه اول رو بگیر."
                />
            </div>
        )
    }

    const accentColor = olympiad.accent
    const currentUserRank = entries.find((e) => e.user_id === userId)

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4 mt-4"
        >
            {/* هدر */}
            <div
                className={`rounded-2xl p-5 bg-gradient-to-l ${olympiad.gradient} text-white`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {OlympiadIcon && (
                            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                <OlympiadIcon className="w-5 h-5 text-white" aria-hidden="true" />
                            </div>
                        )}
                        <div>
                            <h2 className="text-base font-bold">{olympiad.label}</h2>
                            <p className="text-xs text-white/80">{olympiad.tagline}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => refetch()}
                        disabled={loading}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                        aria-label="بارگذاری مجدد"
                    >
                        <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                    </button>
                </div>

                {/* Time window selector */}
                <div className="flex flex-wrap gap-1 mt-4 pt-4 border-t border-white/20">
                    {(['today', 'week', 'month', 'all'] as WindowType[]).map((w) => (
                        <button
                            key={w}
                            onClick={() => setWindowType(w)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${windowType === w
                                ? 'bg-white text-indigo-700'
                                : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                        >
                            {WINDOW_LABELS[w]}
                        </button>
                    ))}
                </div>

                {/* آمار کلی */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/20">
                    <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-white/70" aria-hidden="true" />
                        <span className="text-sm font-medium text-white">
                            {toPersianDigits(totalUsers)} رقیب
                        </span>
                    </div>
                    {currentUserRank && (
                        <>
                            <div className="w-px h-4 bg-white/30" />
                            <div className="flex items-center gap-1.5">
                                <Trophy className="w-4 h-4 text-amber-300" aria-hidden="true" />
                                <span className="text-sm font-medium text-white">
                                    رتبه {toPersianDigits(currentUserRank.rank ?? 0)} شما
                                </span>
                            </div>
                            <div className="w-px h-4 bg-white/30" />
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-white">
                                    امتیاز {toPersianDigits(currentUserRank.composite_score ?? 0)}
                                </span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* تابلوی امتیازات */}
            <div className="space-y-2">
                {entries.map((entry, idx) => (
                    <EntryCard
                        key={entry.user_id}
                        entry={entry}
                        isCurrentUser={entry.user_id === userId}
                        accentColor={accentColor}
                        index={idx}
                    />
                ))}
            </div>

            {/* نکته امتیازگذاری */}
            <div className="text-xs text-gray-400 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
                <span className="font-medium text-gray-500">نحوه امتیازگذاری: </span>
                ۴۰٪ تداوم مطالعه + ۳۰٪ حجم مطالعه (۳۰ روز) + ۳۰٪ میانگین آزمون‌ها
                <span className="block text-2xs text-gray-400 mt-1">
                    * امتیاز بر اساس ترکیبی از مطالعه، کیفیت خواب، استفاده از موبایل و ثبات محاسبه می‌شود.
                </span>
            </div>
        </motion.div>
    )
}

export default LeaderboardSection