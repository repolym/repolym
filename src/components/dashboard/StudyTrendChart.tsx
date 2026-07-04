
import React, { useMemo } from 'react'
import type { StudySession } from '../../types/database'
import { daysAgo, formatDateShort } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { Skeleton } from '../common/Loading'
import { TrendingUp } from 'lucide-react'

interface StudyTrendChartProps {
    sessions: StudySession[]
    loading: boolean
}

export const StudyTrendChart: React.FC<StudyTrendChartProps> = ({ sessions, loading }) => {
    const data = useMemo(() => {
        const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = daysAgo(29 - i)
            return { date, minutes: 0 }
        })

        const minutesByDate = sessions.reduce<Record<string, number>>((acc, s) => {
            acc[s.date] = (acc[s.date] || 0) + s.duration_minutes
            return acc
        }, {})

        return last30Days.map((day) => ({
            date: day.date,
            minutes: minutesByDate[day.date] || 0,
        }))
    }, [sessions])

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
                <div className="flex items-center gap-2 mb-5">
                    <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        )
    }

    if (data.every((d) => d.minutes === 0)) {
        return (
            <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800">روند مطالعه روزانه (۳۰ روز اخیر)</h3>
                </div>
                <div className="flex flex-col items-center py-12 text-center">
                    <p className="text-gray-500">هنوز داده‌ای برای نمایش وجود ندارد</p>
                    <p className="text-sm text-gray-400 mt-1">جلسات مطالعه‌ی خود را ثبت کنید تا روند پیشرفتتان را ببینید</p>
                </div>
            </div>
        )
    }

    const maxMinutes = Math.max(...data.map((d) => d.minutes), 60)
    const yAxisMax = Math.ceil(maxMinutes / 30) * 30

    return (
        <div className="bg-white rounded-2xl p-6 shadow-card border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-gray-800">روند مطالعه روزانه (۳۰ روز اخیر)</h3>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="date"
                            tickFormatter={(date) => formatDateShort(date)}
                            tick={{ fontSize: 10 }}
                            interval={4}
                            stroke="#9CA3AF"
                        />
                        <YAxis
                            tickFormatter={(value) => toPersianDigits(Math.round(value as number))}
                            domain={[0, yAxisMax]}
                            tick={{ fontSize: 10 }}
                            stroke="#9CA3AF"
                        />
                        <Tooltip
                            formatter={(value) => {
                                if (typeof value === 'number') {
                                    return `${Math.round(value)} دقیقه`
                                }
                                return `${value} دقیقه`
                            }}
                            labelFormatter={(date) => formatDateShort(date as string)}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Line
                            type="monotone"
                            dataKey="minutes"
                            stroke="#4F46E5"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 5, fill: '#4F46E5' }}
                            animationDuration={800}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

export default StudyTrendChart
