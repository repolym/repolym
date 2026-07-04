import React, { useState, useMemo } from 'react'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts'
import {
    Award,
    Calendar,
    Zap,
    Target,
    Brain,
    Activity
} from 'lucide-react'
import { usePerformanceAnalytics } from '../../../hooks/usePerformanceAnalytics'
import { useAuth } from '../../../context/AuthContext'
import { Skeleton, ErrorMessage, EmptyState } from '../../common/Loading'
import { toPersianDigits } from '../../../utils/jalali'
import { formatDateShort } from '../../../utils/date-utils'

interface PerformanceSectionProps {
    // No props needed since we fetch analytics internally
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl shadow-xl text-right font-sans transition-all duration-150">
                <p className="text-[10px] font-bold text-slate-500 mb-1.5 flex items-center gap-1 justify-end uppercase tracking-widest">
                    <span>{label}</span>
                    <Calendar className="w-3 h-3" />
                </p>
                {payload.map((p: any, idx: number) => (
                    <p key={idx} className={`text-sm font-bold flex items-center gap-1.5 justify-end mt-1`} style={{ color: p.color || p.fill }}>
                        <span className="font-mono text-base">{p.value}</span>
                        <span className="text-[10px] uppercase">{p.name === 'minutes' ? 'دقیقه' : p.name === 'tests_count' ? 'تعداد آزمون' : 'درصد'}</span>
                    </p>
                ))}
            </div>
        )
    }
    return null
}

const PerformanceSection: React.FC<PerformanceSectionProps> = () => {
    const { user } = useAuth()
    const { data: analytics, loading: analyticsLoading, error, refetch } = usePerformanceAnalytics({ userId: user?.id ?? null })
    const [timeRange, setTimeRange] = useState<'week' | 'month'>('week')

    if (analyticsLoading && !analytics) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 bg-slate-900/60 rounded-2xl border border-slate-800" />)}
                </div>
                <div className="grid grid-cols-12 gap-6">
                    <div className="col-span-8"><Skeleton className="h-96 bg-slate-900/60 rounded-3xl border border-slate-800" /></div>
                    <div className="col-span-4"><Skeleton className="h-96 bg-slate-900/60 rounded-3xl border border-slate-800" /></div>
                </div>
            </div>
        )
    }

    if (error) {
        return <ErrorMessage message={error} onRetry={refetch} />
    }

    if (!analytics) {
        return <EmptyState title="تحلیلی یافت نشد" description="داده‌های کافی برای تحلیل موجود نیست" />
    }

    const {
        test_stats,
        subject_test_stats,
        weekly_trend,
        monthly_trend,
        study_streak,
        study_consistency,
        progress_trend,
        best_worst_day
    } = analytics

    const chartData = useMemo(() => {
        if (timeRange === 'week') {
            return weekly_trend.map(w => ({
                label: formatDateShort(w.week_start),
                minutes: w.minutes,
                tests_count: w.tests_count,
                avg_accuracy_percent: w.avg_accuracy_percent
            }))
        } else {
            return monthly_trend.map(m => ({
                label: formatDateShort(m.month),
                minutes: m.minutes,
                tests_count: m.tests_count,
                avg_accuracy_percent: m.avg_accuracy_percent
            }))
        }
    }, [weekly_trend, monthly_trend, timeRange])

    return (
        <div className="flex flex-col gap-6 min-h-0" dir="ltr">

            {/* SUMMARY KPI STRIP */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                        <span>Test Accuracy</span>
                        <Target className="w-3 h-3 text-slate-500" />
                    </p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white tracking-tighter">{toPersianDigits(test_stats.accuracy_percent)}%</span>
                        {test_stats.trend === 'up' && <span className="text-xs text-emerald-400 font-bold uppercase">Trending Up</span>}
                        {test_stats.trend === 'down' && <span className="text-xs text-rose-400 font-bold uppercase">Needs Focus</span>}
                    </div>
                    <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full shadow-[0_0_8px_rgba(99,102,241,0.5)] transition-all" style={{ width: `${test_stats.accuracy_percent}%` }}></div>
                    </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                        <span>Study Streak</span>
                        <Zap className="w-3 h-3 text-slate-500" />
                    </p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white tracking-tighter">{toPersianDigits(study_streak.current_streak)}</span>
                        <span className="text-xs text-slate-500 font-bold uppercase">Days</span>
                    </div>
                    <p className="text-[10px] font-mono text-indigo-400 mt-2 uppercase italic font-bold">Best: {toPersianDigits(study_streak.longest_streak)} Days</p>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 flex justify-between">
                        <span>Prep Velocity</span>
                        <Activity className="w-3 h-3 text-slate-500" />
                    </p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-black text-white tracking-tighter">{progress_trend.current_avg_minutes ? toPersianDigits(Math.round(progress_trend.current_avg_minutes)) : 0}</span>
                        <span className="text-xs text-slate-500 font-bold uppercase">Min/Day</span>
                    </div>
                    <p className={`text-[10px] font-mono mt-2 uppercase italic font-bold ${progress_trend.direction === 'improving' ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {progress_trend.direction === 'improving' ? `+${progress_trend.percent_change_vs_baseline ? Math.round(progress_trend.percent_change_vs_baseline) : 0}% Growth` : 'Stable Velocity'}
                    </p>
                </div>

                <div className="bg-indigo-600/90 border border-indigo-400/30 p-5 rounded-2xl relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-bold text-indigo-100 uppercase tracking-widest mb-2">Consistency</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white tracking-tighter">{toPersianDigits(Math.round(study_consistency.consistency_score))}%</span>
                            <span className="text-xs text-indigo-200 font-bold uppercase underline">Solid</span>
                        </div>
                        <p className="text-[10px] font-mono text-indigo-200 mt-2 uppercase font-bold tracking-tight">Keep it up!</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 text-white/10">
                        <svg width="80" height="80" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    </div>
                </div>
            </section>

            {/* MAIN ANALYTICS GRID */}
            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

                {/* COMPREHENSIVE STUDY MATRIX */}
                <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 lg:p-8 flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-xl font-black text-white italic uppercase tracking-tight">Comprehensive <span className="text-indigo-400">Study Matrix</span></h2>
                        <div className="flex gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                            <button
                                onClick={() => setTimeRange('week')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${timeRange === 'week' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
                            >
                                Weekly
                            </button>
                            <button
                                onClick={() => setTimeRange('month')}
                                className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${timeRange === 'month' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}
                            >
                                Monthly
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 w-full h-64 min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData as any[]} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                                <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                                <YAxis yAxisId="left" tickLine={false} axisLine={false} stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} stroke="#64748b" tick={{ fontSize: 10, fontFamily: 'monospace' }} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area yAxisId="left" type="monotone" dataKey="minutes" name="minutes" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorMinutes)" />
                                <Area yAxisId="right" type="monotone" dataKey="avg_accuracy_percent" name="accuracy" stroke="#2dd4bf" strokeWidth={3} fillOpacity={1} fill="url(#colorAccuracy)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50 flex gap-4 items-center">
                            <div className="w-10 h-10 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 flex shrink-0"></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Subject Variety</p>
                                <p className="text-sm font-black text-white italic tracking-tight uppercase">{subject_test_stats.length} Subjects Active</p>
                            </div>
                        </div>
                        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/50 flex gap-4 items-center">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">Best Day</p>
                                <p className="text-sm font-black text-white italic tracking-tight uppercase">
                                    {best_worst_day.best_date ? formatDateShort(best_worst_day.best_date) : 'N/A'}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DIAGNOSTICS & RECOMMENDATIONS */}
                <div className="lg:col-span-4 flex flex-col gap-6 min-h-0">

                    {/* STRENGTHS / WEAKNESSES */}
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                        <h3 className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-4">Skill Diagnostics</h3>
                        <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                            {subject_test_stats.length === 0 ? (
                                <p className="text-xs text-slate-500 uppercase italic">No test data available for diagnostics.</p>
                            ) : (
                                subject_test_stats.sort((a, b) => b.avg_accuracy_percent - a.avg_accuracy_percent).map((subject, idx) => {
                                    const isStrong = idx === 0 || subject.avg_accuracy_percent >= 80;
                                    const isWeak = idx === subject_test_stats.length - 1 || subject.avg_accuracy_percent < 50;

                                    let bgClass = "bg-slate-800/40 border-slate-700/50 opacity-60";
                                    let badgeClass = "bg-slate-700 text-white";
                                    let label = "Stable";

                                    if (isStrong && !isWeak) {
                                        bgClass = "bg-emerald-500/10 border-emerald-500/20";
                                        badgeClass = "bg-emerald-500 text-slate-950";
                                        label = "Elite";
                                    } else if (isWeak) {
                                        bgClass = "bg-amber-500/10 border-amber-500/20";
                                        badgeClass = "bg-amber-500 text-slate-950";
                                        label = "Review";
                                    }

                                    return (
                                        <div key={subject.subject_id} className={`flex items-center justify-between p-3 rounded-xl border ${bgClass}`}>
                                            <span className="text-xs font-bold text-white uppercase italic tracking-tight truncate ml-2" dir="rtl">{subject.subject_name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono text-slate-400">{subject.avg_accuracy_percent}%</span>
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${badgeClass}`}>{label}</span>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* AI INSIGHTS */}
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 flex-1 min-h-0 flex flex-col">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Adaptive Insights</h3>
                        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                            <div className="border-l-2 border-indigo-500 pl-4">
                                <p className="text-xs font-black text-white uppercase italic mb-1">Optimization Path</p>
                                <p className="text-[11px] leading-relaxed text-slate-400">
                                    Your consistency score is <span className="text-white">{Math.round(study_consistency.consistency_score)}%</span>.
                                    {study_consistency.consistency_score < 50 ? " Try to study a little bit every day to build a habit." : " You are building a solid study habit. Keep pushing!"}
                                </p>
                            </div>
                            {subject_test_stats.length > 0 && (
                                <div className="border-l-2 border-amber-500 pl-4 mt-4">
                                    <p className="text-xs font-black text-slate-500 uppercase italic mb-1">Weakness Detection</p>
                                    <p className="text-[11px] leading-relaxed text-slate-400 font-mono tracking-tight">
                                        Focus review on <span className="text-amber-500" dir="rtl">{subject_test_stats.sort((a, b) => a.avg_accuracy_percent - b.avg_accuracy_percent)[0]?.subject_name}</span> to boost overall metrics.
                                    </p>
                                </div>
                            )}
                        </div>
                        <button className="mt-4 w-full py-3 bg-white text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-400 transition-colors shadow-lg shadow-white/5 flex items-center justify-center gap-2">
                            <Brain className="w-4 h-4" />
                            Sync Study Plan
                        </button>
                    </div>
                </div>

            </main>
        </div>
    )
}

export default PerformanceSection
