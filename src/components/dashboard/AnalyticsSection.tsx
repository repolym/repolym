import React from 'react'
import { motion } from 'framer-motion'
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import {
    Gauge, HeartPulse, Flame, TrendingUp, TrendingDown, Minus, Moon, Smartphone,
    Trophy, CalendarX, PieChart as PieChartIcon,
} from 'lucide-react'
import { WEEKDAY_LABELS_FA } from '../../types/analytics'
import { formatDateShort } from '../../utils/date-utils'
import { toPersianDigits, formatMinutesPersian } from '../../utils/jalali'
import { Skeleton, EmptyState, ErrorMessage } from '../common/Loading'
import { DailyCheckInCard } from './DailyCheckInCard'
import { useAnalytics } from '../../hooks/useAnalytics'

interface AnalyticsSectionProps {
    userId: string | null
}

const ScoreGauge: React.FC<{ label: string; value: number; icon: React.ElementType; hint?: string }> = ({
    label, value, icon: Icon, hint,
}) => {
    const color = value >= 70 ? 'text-emerald-600' : value >= 40 ? 'text-amber-500' : 'text-rose-500'
    const ring = value >= 70 ? 'stroke-emerald-500' : value >= 40 ? 'stroke-amber-500' : 'stroke-rose-500'
    const circumference = 2 * Math.PI * 26
    const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference

    return (
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100 flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0">
                <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#F3F4F6" strokeWidth="6" />
                    <circle
                        cx="32" cy="32" r="26" fill="none" strokeWidth="6" strokeLinecap="round"
                        className={ring}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-sm font-bold tabular-nums ${color}`}>{toPersianDigits(value)}</span>
                </div>
            </div>
            <div>
                <div className="flex items-center gap-1.5 text-gray-600 mb-0.5">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span className="text-sm font-medium">{label}</span>
                </div>
                {hint && <p className="text-xs text-gray-400">{hint}</p>}
            </div>
        </div>
    )
}

const TrendBadge: React.FC<{ direction: string }> = ({ direction }) => {
    const map: Record<string, { label: string; icon: React.ElementType; className: string }> = {
        increasing: { label: 'رو به افزایش', icon: TrendingUp, className: 'text-emerald-600 bg-emerald-50' },
        improving: { label: 'در حال بهبود', icon: TrendingUp, className: 'text-emerald-600 bg-emerald-50' },
        decreasing: { label: 'رو به کاهش', icon: TrendingDown, className: 'text-rose-600 bg-rose-50' },
        declining: { label: 'در حال افت', icon: TrendingDown, className: 'text-rose-600 bg-rose-50' },
        stable: { label: 'ثابت', icon: Minus, className: 'text-gray-500 bg-gray-100' },
        insufficient_data: { label: 'داده کافی نیست', icon: Minus, className: 'text-gray-400 bg-gray-100' },
    }
    const cfg = map[direction] ?? map.stable
    const Icon = cfg.icon
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${cfg.className}`}>
            <Icon className="w-3 h-3" aria-hidden="true" />
            {cfg.label}
        </span>
    )
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ userId }) => {
    const { data: analytics, loading, error, refetch } = useAnalytics({ userId })

    if (loading && !analytics) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 shadow-card border border-gray-100 space-y-4">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="mt-6">
                <ErrorMessage message={error} onRetry={refetch} />
            </div>
        )
    }

    if (!analytics) {
        return (
            <div className="mt-6">
                <EmptyState
                    title="هنوز تحلیلی موجود نیست"
                    description="با ثبت اولین جلسهٔ مطالعه، تحلیل‌های هوشمند اینجا نمایش داده می‌شود."
                />
            </div>
        )
    }

    const {
        productivity_score, recovery_score, study_streak, study_consistency,
        study_trend, best_worst_day, subject_distribution, sleep_statistics,
        phone_usage_statistics, personal_baseline, progress_trend, moving_average,
    } = analytics

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6 mt-6"
        >
            {/* Check-in + composite scores */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <DailyCheckInCard />
                <ScoreGauge
                    label="امتیاز بهره‌وری"
                    value={productivity_score.productivity_score}
                    icon={Gauge}
                    hint="ترکیبی از تداوم، اهداف و آزمون‌ها"
                />
                <ScoreGauge
                    label="امتیاز ریکاوری"
                    value={recovery_score.recovery_score}
                    icon={HeartPulse}
                    hint="بازگشت بعد از روزهای استراحت"
                />
            </div>

            {/* Streak + consistency + progress */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <Flame className="w-4 h-4 text-orange-500" aria-hidden="true" />
                        <span className="text-sm font-medium">استریک مطالعه</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 tabular-nums">
                        {toPersianDigits(study_streak.current_streak)} روز
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        رکورد: {toPersianDigits(study_streak.longest_streak)} روز
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <PieChartIcon className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                        <span className="text-sm font-medium">تداوم مطالعه</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-800 tabular-nums">
                        {toPersianDigits(study_consistency.consistency_score)}٪
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        {toPersianDigits(study_consistency.active_days)} از {toPersianDigits(study_consistency.total_days)} روز فعال
                    </p>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">روند پیشرفت</span>
                        <TrendBadge direction={progress_trend.direction} />
                    </div>
                    <p className="text-2xl font-bold text-gray-800 tabular-nums">
                        {progress_trend.percent_change_vs_baseline != null
                            ? `${progress_trend.percent_change_vs_baseline > 0 ? '+' : ''}${toPersianDigits(progress_trend.percent_change_vs_baseline)}٪`
                            : '—'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        نسبت به میانگین پایه ({toPersianDigits(Math.round(personal_baseline.baseline_avg_minutes_active_days))} دقیقه/روز)
                    </p>
                </div>
            </div>

            {/* Moving average chart */}
            <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-800">روند مطالعه (میانگین متحرک ۷ روزه)</h3>
                    <TrendBadge direction={study_trend.direction} />
                </div>
                {moving_average.length > 0 ? (
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={moving_average} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(d) => formatDateShort(d)}
                                    tick={{ fontSize: 10, fill: '#9CA3AF' }}
                                    minTickGap={30}
                                />
                                <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} width={40} />
                                <Tooltip
                                    formatter={(value: any) => {
                                        if (value === undefined || value === null) return ['۰ دقیقه', 'میانگین ۷ روزه']
                                        const num = typeof value === 'number' ? value : Number(value)
                                        return [`${toPersianDigits(Math.round(num))} دقیقه`, 'میانگین ۷ روزه']
                                    }}
                                    labelFormatter={(d) => formatDateShort(d as string)}
                                />
                                <Line type="monotone" dataKey="minutes" stroke="#E5E7EB" strokeWidth={1.5} dot={false} />
                                <Line type="monotone" dataKey="moving_avg_7d" stroke="#4F46E5" strokeWidth={2.5} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <EmptyState title="داده‌ای برای نمایش نیست" description="با ثبت جلسات مطالعه، این نمودار تکمیل می‌شود." />
                )}
            </div>

            {/* Best/worst day + subject distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">بهترین و ضعیف‌ترین روز</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50">
                            <Trophy className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-emerald-700 font-medium">
                                    بهترین روز — {best_worst_day.best_date ? formatDateShort(best_worst_day.best_date) : '—'}
                                </p>
                                <p className="text-xs text-emerald-600/80 mt-0.5">
                                    {best_worst_day.best_date_minutes != null ? formatMinutesPersian(best_worst_day.best_date_minutes) : '—'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50">
                            <CalendarX className="w-4 h-4 text-rose-500 shrink-0" aria-hidden="true" />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-rose-700 font-medium">
                                    ضعیف‌ترین روز — {best_worst_day.worst_date ? formatDateShort(best_worst_day.worst_date) : '—'}
                                </p>
                                <p className="text-xs text-rose-600/80 mt-0.5">
                                    {best_worst_day.worst_date_minutes != null ? formatMinutesPersian(best_worst_day.worst_date_minutes) : '—'}
                                </p>
                            </div>
                        </div>
                        {best_worst_day.best_weekday_iso && (
                            <p className="text-xs text-gray-400 pt-1">
                                معمولاً روزهای <span className="font-medium text-gray-600">{WEEKDAY_LABELS_FA[best_worst_day.best_weekday_iso]}</span> بیشترین مطالعه را داری.
                            </p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4">پراکندگی دروس (۹۰ روز اخیر)</h3>
                    {subject_distribution.length > 0 ? (
                        <div className="space-y-3">
                            {subject_distribution.slice(0, 6).map((s) => (
                                <div key={s.subject_id}>
                                    <div className="flex items-center justify-between text-xs mb-1">
                                        <span className="font-medium text-gray-700">{s.subject_name}</span>
                                        <span className="text-gray-400 tabular-nums">{toPersianDigits(s.percent)}٪</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: `${s.percent}%`, backgroundColor: s.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState title="درسی ثبت نشده" description="جلسات مطالعه را به یک درس نسبت بده تا این نمودار تکمیل شود." />
                    )}
                </div>
            </div>

            {/* Sleep + phone usage */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 text-gray-500">
                        <Moon className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                        <span className="text-sm font-medium">آمار خواب (۳۰ روز اخیر)</span>
                    </div>
                    {sleep_statistics.logged_days > 0 ? (
                        <>
                            <p className="text-2xl font-bold text-gray-800 tabular-nums">
                                {toPersianDigits(sleep_statistics.avg_sleep_hours ?? 0)} ساعت
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                کمینه {toPersianDigits(sleep_statistics.min_sleep_hours ?? 0)} — بیشینه {toPersianDigits(sleep_statistics.max_sleep_hours ?? 0)} ساعت
                                {' · '}{toPersianDigits(sleep_statistics.logged_days)} روز ثبت‌شده
                            </p>
                        </>
                    ) : (
                        <p className="text-xs text-gray-400">هنوز ساعت خوابی ثبت نکرده‌ای — از کارت «چک‌این امروز» شروع کن.</p>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                    <div className="flex items-center gap-2 mb-3 text-gray-500">
                        <Smartphone className="w-4 h-4 text-amber-500" aria-hidden="true" />
                        <span className="text-sm font-medium">استفاده از موبایل (۳۰ روز اخیر)</span>
                    </div>
                    {phone_usage_statistics.logged_days > 0 ? (
                        <>
                            <p className="text-2xl font-bold text-gray-800 tabular-nums">
                                {formatMinutesPersian(Math.round(phone_usage_statistics.avg_phone_minutes ?? 0))}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                کمینه {toPersianDigits(phone_usage_statistics.min_phone_minutes ?? 0)} — بیشینه {toPersianDigits(phone_usage_statistics.max_phone_minutes ?? 0)} دقیقه
                                {' · '}{toPersianDigits(phone_usage_statistics.logged_days)} روز ثبت‌شده
                            </p>
                        </>
                    ) : (
                        <p className="text-xs text-gray-400">هنوز زمان استفاده از موبایل ثبت نکرده‌ای.</p>
                    )}
                </div>
            </div>
        </motion.div>
    )
}

export default AnalyticsSection