import { useState, useMemo, useEffect } from 'react'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
} from 'recharts'
import {
    Zap,
    Target,
    Brain,
    Activity,
    CheckCircle,
    Moon,
    Smartphone,
} from 'lucide-react'
import { usePerformanceAnalytics } from '../../../hooks/usePerformanceAnalytics'
import { useDailyMetrics } from '../../../hooks/useDailyMetrics'
import { useAuth } from '../../../context/AuthContext'
import { Skeleton, ErrorMessage, EmptyState } from '../../common/Loading'
import { toPersianDigits } from '../../../utils/jalali'
import { formatDateShort, daysAgo, today } from '../../../utils/date-utils'

// ---------- Custom Persian Tooltip ----------
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-lg text-right text-sm">
                <p className="font-semibold text-gray-700 mb-1">{label}</p>
                {payload.map((p: any, idx: number) => (
                    <p key={idx} className="flex items-center justify-between gap-4 text-gray-600">
                        <span>{p.name === 'minutes' ? 'مدت مطالعه' : p.name === 'tests_count' ? 'تعداد آزمون' : p.name === 'sleep_hours' ? 'خواب (ساعت)' : 'گوشی (دقیقه)'}</span>
                        <span className="font-mono font-medium">{p.value}</span>
                    </p>
                ))}
            </div>
        )
    }
    return null
}

const PerformanceSection: React.FC = () => {
    const { user } = useAuth()
    const [timeRange, setTimeRange] = useState<'week' | 'month'>('week')

    // داده‌های تحلیلی (مطالعه و آزمون)
    const { data: analytics, loading: analyticsLoading, error: analyticsError, refetch } = usePerformanceAnalytics({ userId: user?.id ?? null })

    // داده‌های روزانه (خواب و گوشی) - ۳۰ روز اخیر
    const dateFrom = daysAgo(30)
    const dateTo = today()
    const { data: dailyMetrics, loading: dailyLoading, error: dailyError, refetch: refetchDaily } = useDailyMetrics({
        userId: user?.id ?? null,
        dateFrom,
        dateTo,
    })

    // برای رفع اشکال – لاگ کردن داده‌ها در کنسول (در صورت نیاز حذف شود)
    useEffect(() => {
        if (dailyMetrics && dailyMetrics.length > 0) {
            console.log('📊 Daily Metrics received:', dailyMetrics)
        }
    }, [dailyMetrics])

    // ترکیب داده‌های خواب و گوشی با تاریخ‌های کامل (پر کردن روزهای بدون داده)
    const sleepPhoneData = useMemo(() => {
        if (!dailyMetrics || dailyMetrics.length === 0) return []
        const map = new Map<string, { sleep: number | null; phone: number | null }>()
        dailyMetrics.forEach((d) => {
            map.set(d.date, {
                sleep: d.sleep_hours ?? null,
                phone: d.phone_usage_minutes ?? null,
            })
        })
        // ایجاد آرایه‌ای از تمام روزهای بازه
        const result = []
        let current = new Date(dateFrom + 'T00:00:00')
        const end = new Date(dateTo + 'T00:00:00')
        while (current <= end) {
            const dateStr = current.toISOString().split('T')[0]
            const data = map.get(dateStr) || { sleep: null, phone: null }
            result.push({
                date: dateStr,
                label: formatDateShort(dateStr),
                sleep_hours: data.sleep,
                phone_minutes: data.phone,
            })
            current.setDate(current.getDate() + 1)
        }
        return result
    }, [dailyMetrics, dateFrom, dateTo])

    // آمار خلاصه خواب و گوشی
    const sleepStats = useMemo(() => {
        const values = sleepPhoneData.filter(d => d.sleep_hours !== null).map(d => d.sleep_hours as number)
        if (values.length === 0) return { avg: null, min: null, max: null, count: 0 }
        return {
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length,
        }
    }, [sleepPhoneData])

    const phoneStats = useMemo(() => {
        const values = sleepPhoneData.filter(d => d.phone_minutes !== null).map(d => d.phone_minutes as number)
        if (values.length === 0) return { avg: null, min: null, max: null, count: 0 }
        return {
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length,
        }
    }, [sleepPhoneData])

    // داده‌های نمودار مطالعه
    const chartData = useMemo(() => {
        if (!analytics) return []
        const { weekly_trend, monthly_trend } = analytics
        const raw = timeRange === 'week' ? (weekly_trend || []) : (monthly_trend || [])
        return raw.map((item: any) => ({
            label: timeRange === 'week' ? formatDateShort(item.week_start) : formatDateShort(item.month),
            minutes: item.minutes,
            tests_count: item.tests_count,
            avg_accuracy_percent: Math.round(item.avg_accuracy_percent || 0),
        }))
    }, [analytics, timeRange])

    // وضعیت بارگذاری ترکیبی
    const isLoading = (analyticsLoading || dailyLoading) && !analytics

    // خطاها
    const hasError = analyticsError || dailyError

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="h-28 rounded-2xl" />
                    ))}
                </div>
                <Skeleton className="h-80 rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 rounded-2xl" />
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            </div>
        )
    }

    if (hasError) {
        return <ErrorMessage message={analyticsError || dailyError || 'خطا در دریافت داده'} onRetry={() => { refetch(); refetchDaily(); }} />
    }

    if (!analytics) {
        return (
            <EmptyState
                title="تحلیلی موجود نیست"
                description="برای مشاهده تحلیل‌ها، ابتدا جلسات مطالعه و آزمون ثبت کنید."
            />
        )
    }

    const {
        test_stats,
        subject_test_stats,
        study_streak,
        study_consistency,
        progress_trend,
        best_worst_day,
    } = analytics

    const safeSubjectTestStats = subject_test_stats || []

    // تابع کمکی برای تبدیل عدد به فارسی با مدیریت مقدار null/undefined
    const toPersian = (num: number | null | undefined): string => {
        if (num === null || num === undefined || isNaN(num)) return '—'
        return toPersianDigits(Math.round(num))
    }

    return (
        <div className="space-y-6" dir="rtl">
            {/* KPI Cards - 4 ستونه */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* دقت آزمون */}
                <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">دقت آزمون‌ها</span>
                        <Target className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-800">
                            {toPersianDigits(Math.round(test_stats?.accuracy_percent || 0))}%
                        </span>
                        {test_stats?.trend === 'up' && (
                            <span className="text-xs text-emerald-600 font-medium">▲ رو به بهبود</span>
                        )}
                        {test_stats?.trend === 'down' && (
                            <span className="text-xs text-rose-600 font-medium">▼ نیاز به تمرین</span>
                        )}
                    </div>
                    <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, test_stats?.accuracy_percent || 0)}%` }}
                        />
                    </div>
                </div>

                {/* روند مطالعه */}
                <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">روند مطالعه</span>
                        <Zap className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-800">
                            {toPersianDigits(study_streak?.current_streak || 0)}
                        </span>
                        <span className="text-sm text-gray-500">روز پیاپی</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        بهترین: {toPersianDigits(study_streak?.longest_streak || 0)} روز
                    </p>
                </div>

                {/* سرعت مطالعه */}
                <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-500">سرعت مطالعه</span>
                        <Activity className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-800">
                            {toPersianDigits(Math.round(progress_trend?.current_avg_minutes || 0))}
                        </span>
                        <span className="text-sm text-gray-500">دقیقه/روز</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                        {progress_trend?.direction === 'improving'
                            ? `▲ ${Math.round(progress_trend?.percent_change_vs_baseline || 0)}% رشد`
                            : 'پایدار'}
                    </p>
                </div>

                {/* ثبات */}
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-2xl p-5 border border-indigo-200/50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-indigo-700">ثبات</span>
                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-indigo-800">
                            {toPersianDigits(Math.round(study_consistency?.consistency_score || 0))}%
                        </span>
                        <span className="text-xs text-indigo-600 font-medium">عالی</span>
                    </div>
                    <p className="text-xs text-indigo-600/70 mt-1">به همین روال ادامه بده</p>
                </div>
            </div>

            {/* ردیف اول: نمودار مطالعه + تحلیل دروس */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* نمودار مطالعه و آزمون (۲/۳ عرض) */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-card border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-semibold text-gray-800">روند مطالعه و آزمون</h3>
                        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                            <button
                                onClick={() => setTimeRange('week')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${timeRange === 'week'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                هفته‌ای
                            </button>
                            <button
                                onClick={() => setTimeRange('month')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${timeRange === 'month'
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                ماهانه
                            </button>
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                                <defs>
                                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    yAxisId="left"
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => toPersianDigits(val)}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tick={{ fontSize: 11, fill: '#6b7280' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `${toPersianDigits(val)}%`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="minutes"
                                    name="minutes"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorMinutes)"
                                />
                                <Area
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="avg_accuracy_percent"
                                    name="avg_accuracy_percent"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorAccuracy)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="flex items-center justify-center gap-6 mt-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-indigo-500 rounded-full" />
                            مدت مطالعه (دقیقه)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-0.5 bg-emerald-500 rounded-full" />
                            درصد صحت آزمون
                        </span>
                    </div>
                </div>

                {/* تحلیل دروس (۱/۳ عرض) */}
                <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
                    <h3 className="text-base font-semibold text-gray-800 mb-4">تحلیل دروس</h3>
                    {safeSubjectTestStats.length === 0 ? (
                        <p className="text-sm text-gray-400">هنوز داده‌ای برای تحلیل دروس موجود نیست.</p>
                    ) : (
                        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                            {[...safeSubjectTestStats]
                                .sort((a, b) => b.avg_accuracy_percent - a.avg_accuracy_percent)
                                .map((subject, idx) => {
                                    const pct = Math.round(subject.avg_accuracy_percent || 0)
                                    let label = 'متوسط'
                                    let labelClass = 'bg-gray-100 text-gray-600'
                                    if (pct >= 80) {
                                        label = 'عالی'
                                        labelClass = 'bg-emerald-100 text-emerald-700'
                                    } else if (pct < 50) {
                                        label = 'نیاز به تمرین'
                                        labelClass = 'bg-amber-100 text-amber-700'
                                    }
                                    return (
                                        <div key={subject.subject_id || idx} className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 truncate ml-2">
                                                {subject.subject_name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-mono text-gray-500">
                                                    {toPersianDigits(pct)}%
                                                </span>
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${labelClass}`}>
                                                    {label}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                        </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400">
                            <span className="font-medium text-gray-600">بهترین روز:</span>{' '}
                            {best_worst_day?.best_date ? formatDateShort(best_worst_day.best_date) : '—'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ردیف دوم: نمودار خواب و گوشی (دو کارت کنار هم) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* کارت خواب */}
                <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                            <Moon className="w-5 h-5 text-indigo-500" />
                            خواب روزانه
                        </h3>
                        <div className="text-xs text-gray-400">
                            {sleepStats.count > 0 ? (
                                <span>
                                    میانگین: <span className="font-bold text-gray-700">{toPersian(sleepStats.avg)} ساعت</span>
                                </span>
                            ) : (
                                'داده‌ای موجود نیست'
                            )}
                        </div>
                    </div>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sleepPhoneData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 10, fill: '#6b7280' }}
                                    tickLine={false}
                                    axisLine={false}
                                    interval={Math.floor(sleepPhoneData.length / 10)}
                                />
                                <YAxis
                                    domain={[0, 12]}
                                    tick={{ fontSize: 10, fill: '#6b7280' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => toPersianDigits(val)}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const val = payload[0].value
                                            return (
                                                <div className="bg-white border border-gray-200 p-2 rounded-lg shadow-lg text-right text-sm">
                                                    <p className="font-medium text-gray-700">{label}</p>
                                                    <p className="text-gray-600">
                                                        خواب: <span className="font-bold">{val !== null && val !== undefined ? toPersian(Number(val)) : '—'} ساعت</span>
                                                    </p>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="sleep_hours"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    dot={{ r: 2, fill: '#6366f1' }}
                                    connectNulls
                                    name="خواب (ساعت)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    {sleepStats.count > 0 ? (
                        <div className="flex justify-around mt-3 text-xs text-gray-500">
                            <span>کمترین: {toPersian(sleepStats.min)} ساعت</span>
                            <span>بیشترین: {toPersian(sleepStats.max)} ساعت</span>
                            <span>تعداد روزهای ثبت: {toPersianDigits(sleepStats.count)}</span>
                        </div>
                    ) : (
                        <div className="text-center mt-3 text-xs text-gray-400">
                            برای دیدن نمودار، ابتدا اطلاعات خواب خود را ثبت کنید.
                        </div>
                    )}
                </div>

                {/* کارت گوشی */}
                <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-rose-500" />
                            استفاده از گوشی
                        </h3>
                        <div className="text-xs text-gray-400">
                            {phoneStats.count > 0 ? (
                                <span>
                                    میانگین: <span className="font-bold text-gray-700">{toPersian(phoneStats.avg)} دقیقه</span>
                                </span>
                            ) : (
                                'داده‌ای موجود نیست'
                            )}
                        </div>
                    </div>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={sleepPhoneData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="label"
                                    tick={{ fontSize: 10, fill: '#6b7280' }}
                                    tickLine={false}
                                    axisLine={false}
                                    interval={Math.floor(sleepPhoneData.length / 10)}
                                />
                                <YAxis
                                    tick={{ fontSize: 10, fill: '#6b7280' }}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => toPersianDigits(val)}
                                />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const val = payload[0].value
                                            return (
                                                <div className="bg-white border border-gray-200 p-2 rounded-lg shadow-lg text-right text-sm">
                                                    <p className="font-medium text-gray-700">{label}</p>
                                                    <p className="text-gray-600">
                                                        گوشی: <span className="font-bold">{val !== null && val !== undefined ? toPersian(Number(val)) : '—'} دقیقه</span>
                                                    </p>
                                                </div>
                                            )
                                        }
                                        return null
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="phone_minutes"
                                    stroke="#f43f5e"
                                    strokeWidth={2}
                                    dot={{ r: 2, fill: '#f43f5e' }}
                                    connectNulls
                                    name="گوشی (دقیقه)"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                    {phoneStats.count > 0 ? (
                        <div className="flex justify-around mt-3 text-xs text-gray-500">
                            <span>کمترین: {toPersian(phoneStats.min)} دقیقه</span>
                            <span>بیشترین: {toPersian(phoneStats.max)} دقیقه</span>
                            <span>تعداد روزهای ثبت: {toPersianDigits(phoneStats.count)}</span>
                        </div>
                    ) : (
                        <div className="text-center mt-3 text-xs text-gray-400">
                            برای دیدن نمودار، ابتدا اطلاعات استفاده از گوشی را ثبت کنید.
                        </div>
                    )}
                </div>
            </div>

            {/* بینش هوشمند (با اضافه شدن تحلیل خواب و گوشی) */}
            <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-500" />
                    بینش هوشمند
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="font-medium text-gray-700">نکته مطالعه</p>
                        <p className="mt-1">
                            امتیاز ثبات شما <span className="font-bold text-indigo-600">{toPersianDigits(Math.round(study_consistency?.consistency_score || 0))}%</span> است.
                            {study_consistency?.consistency_score < 50
                                ? ' سعی کنید هر روز حتی مقدار کم مطالعه کنید تا عادت شکل بگیرد.'
                                : ' عادت مطالعه خوبی دارید. ادامه دهید!'}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="font-medium text-gray-700">نقطه ضعف درسی</p>
                        <p className="mt-1">
                            {safeSubjectTestStats.length > 0 ? (
                                <>
                                    بر روی درس{' '}
                                    <span className="font-bold text-amber-600">
                                        {[...safeSubjectTestStats].sort((a, b) => a.avg_accuracy_percent - b.avg_accuracy_percent)[0]?.subject_name || 'نامشخص'}
                                    </span>{' '}
                                    بیشتر تمرکز کنید تا میانگین کلی بهبود یابد.
                                </>
                            ) : (
                                'برای تشخیص نقاط ضعف، آزمون بیشتری ثبت کنید.'
                            )}
                        </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="font-medium text-gray-700">تحلیل خواب و گوشی</p>
                        <p className="mt-1">
                            {sleepStats.count > 0 ? (
                                <>
                                    میانگین خواب: <span className="font-bold text-indigo-600">{toPersian(sleepStats.avg)} ساعت</span>
                                    {sleepStats.avg !== null && sleepStats.avg < 7 ? ' — خواب کمتر از حد توصیه شده (۷ ساعت) ممکن است روی تمرکز تأثیر بگذارد.' : ' — خواب مناسبی دارید.'}
                                    {phoneStats.avg !== null && phoneStats.avg > 120 ? ' استفاده از گوشی بیش از حد معمول (بیش از ۲ ساعت) می‌تواند بازدهی را کاهش دهد.' : ''}
                                </>
                            ) : (
                                'برای دریافت تحلیل خواب و گوشی، اطلاعات روزانه را ثبت کنید.'
                            )}
                        </p>
                    </div>
                </div>
                <button className="mt-4 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm">
                    همگام‌سازی برنامه مطالعه
                </button>
            </div>
        </div>
    )
}

export default PerformanceSection