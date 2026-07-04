// src/components/dashboard/sections/PerformanceSection.tsx
import React, { useState } from 'react'
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    PieChart,
    Pie,
    Cell
} from 'recharts'
import {
    TrendingUp,
    Award,
    Clock,
    CheckCircle2,
    Calendar,
    ArrowUpRight,
    Zap,
    Target
} from 'lucide-react'
import { Test } from '../../../types/database' // مسیر واقعی پروژه‌ات

interface PerformanceSectionProps {
    tests: Test[]
    loading: boolean
}
// کامپوننت کاستوم و شیک برای توت‌تیپ نمودارها با افکت شیشه‌ای (Glassmorphism)
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-800 text-right font-sans transition-all duration-150">
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-1.5 flex items-center gap-1 justify-end">
                    <span>{label}</span>
                    <Calendar className="w-3 h-3" />
                </p>
                <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 justify-end">
                    <span className="font-mono text-base">{payload[0].value}</span>
                    <span>دقیقه مطالعه</span>
                </p>
            </div>
        )
    }
    return null
}

const PerformanceSection: React.FC<PerformanceSectionProps> = ({
    tests,
    loading,
}) => {
    void tests
    void loading
    const [timeRange, setTimeRange] = useState<'week' | 'month'>('week')

    // داده‌های نمونه متناسب با فضای المپیاد
    const performanceData = [
        { name: 'شنبه', activity: 120 },
        { name: 'یکشنبه', activity: 190 },
        { name: 'دوشنبه', activity: 150 },
        { name: 'سه‌شنبه', activity: 280 },
        { name: 'چهارشنبه', activity: 220 },
        { name: 'پنج‌شنبه', activity: 350 },
        { name: 'جمعه', activity: 250 },
    ]

    const subjectData = [
        { name: 'ترکیبیات', value: 40, color: '#6366f1' },
        { name: 'نظریه اعداد', value: 25, color: '#3b82f6' },
        { name: 'هندسه', value: 20, color: '#10b981' },
        { name: 'جبر', value: 15, color: '#f59e0b' },
    ]

    return (
        <div className="space-y-8 p-1 text-right font-sans" dir="rtl">

            {/* پیام انگیزشی و خلاصه وضعیت هوشمند */}
            <div className="bg-gradient-to-l from-indigo-600 to-indigo-700 dark:from-indigo-950 dark:to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-10 -translate-y-10" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-extrabold mb-2 tracking-tight">وضعیت تحلیلی شما چطوره؟ 🚀</h2>
                        <p className="text-indigo-100 text-sm md:text-base max-w-xl font-medium leading-relaxed">
                            عالیه! تو این هفته رشد <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded-md text-white font-bold">۱۴٪</span> داشتی. بیشترین تمرکزد روی مبحث <span className="underline decoration-wavy decoration-amber-400 font-bold">ترکیبیات</span> بوده. همین فرمون رو ادامه بده!
                        </p>
                    </div>
                    <div className="flex gap-2 bg-white/10 backdrop-blur-md p-1 rounded-xl self-start md:self-center">
                        <button
                            onClick={() => setTimeRange('week')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeRange === 'week' ? 'bg-white text-indigo-900 shadow-sm' : 'text-white hover:bg-white/5'}`}
                        >
                            هفتگی
                        </button>
                        <button
                            onClick={() => setTimeRange('month')}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${timeRange === 'month' ? 'bg-white text-indigo-900 shadow-sm' : 'text-white hover:bg-white/5'}`}
                        >
                            ماهانه
                        </button>
                    </div>
                </div>
            </div>

            {/* کارت‌های شاخص (KPI Cards) با کپی‌رایتینگ انسانی */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* کارت اول: کل فعالیت */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex items-center justify-between group">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500">کل تست‌های حل شده</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">۱۵۶</h3>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                            <TrendingUp className="w-3 h-3" />
                            ۱۲٪+ از دیروز
                        </span>
                    </div>
                    <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                        <Zap className="w-6 h-6" />
                    </div>
                </div>

                {/* کارت دوم: زمان مطالعه */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex items-center justify-between group">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500">زمان تمرکز این هفته</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">۱۸.۵ <span className="text-xs font-sans text-slate-400">ساعت</span></h3>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                            <ArrowUpRight className="w-3 h-3" />
                            خوب و پایدار
                        </span>
                    </div>
                    <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl group-hover:scale-110 transition-transform">
                        <Clock className="w-6 h-6" />
                    </div>
                </div>

                {/* کارت سوم: دقت پاسخگویی */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex items-center justify-between group">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500">میانگین درصد پاسخ درست</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">۸۲٪</h3>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 dark:text-indigo-400 px-2 py-0.5 rounded-full">
                            <Target className="w-3 h-3" />
                            بالاتر از میانگین کل
                        </span>
                    </div>
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>

                {/* کارت چهارم: امتیاز رنکینگ */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex items-center justify-between group">
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 dark:text-slate-500">امتیاز کل رنکینگ</p>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">۲,۴۵۰</h3>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-400 px-2 py-0.5 rounded-full">
                            🏆 جزو ۱۰ نفر برتر
                        </span>
                    </div>
                    <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl group-hover:scale-110 transition-transform">
                        <Award className="w-6 h-6" />
                    </div>
                </div>

            </div>

            {/* بخش اصلی نمودارها */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* نمودار خطی روند پیشرفت روزانه */}
                <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">روند مطالعه شما</h4>
                            <p className="text-xs text-slate-400 dark:text-slate-500">مدت زمان مطالعه به تفکیک روزهای هفته</p>
                        </div>
                    </div>

                    <div className="w-full h-72 text-xs font-mono">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={performanceData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/40" />
                                <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#94a3b8" />
                                <YAxis tickLine={false} axisLine={false} stroke="#94a3b8" />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="activity"
                                    stroke="#6366f1"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#colorActivity)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* نمودار دایره‌ای تفکیک مباحث */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                    <div>
                        <h4 className="text-base font-bold text-slate-800 dark:text-slate-100">تفکیک مباحث</h4>
                        <p className="text-xs text-slate-400 dark:text-slate-500">توزیع تمرکز شما روی شاخه‌های المپیاد</p>
                    </div>

                    <div className="flex flex-col items-center justify-center my-4 relative">
                        <div className="w-full h-44 flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={subjectData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={75}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {subjectData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} className="outline-none" />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">۴</span>
                            <span className="text-[10px] font-bold text-slate-400">مبحث اصلی</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                        {subjectData.map((item, index) => (
                            <div key={index} className="flex items-center gap-2 justify-start bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                                <span className="text-slate-600 dark:text-slate-300 font-medium truncate">{item.name}</span>
                                <span className="font-mono font-bold text-slate-400 mr-auto">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default PerformanceSection