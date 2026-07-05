// src/components/admin/OlympiadManagement.tsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import { useLeaderboard } from '../../hooks/useLeaderboard'
import { formatMinutes } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'
import { Button } from '../common/Button'
import { Skeleton } from '../common/Loading'
import { Trophy, RefreshCw } from 'lucide-react'

export const OlympiadManagement: React.FC = () => {
    const [olympiads, setOlympiads] = useState<string[]>([])
    const [selectedOlympiad, setSelectedOlympiad] = useState<string | null>(null)
    const [windowType, setWindowType] = useState<'today' | 'week' | 'month' | 'all'>('month')
    const [loadingOlympiads, setLoadingOlympiads] = useState(true)

    const { data, loading, error, refetch } = useLeaderboard({
        olympiadId: selectedOlympiad,
        window: windowType,
        limit: 50,
        metric: 'smart', // composite score
    })

    useEffect(() => {
        const fetchOlympiads = async () => {
            const { data, error } = await supabase
                .from('users')
                .select('olympiad_id')
                .not('olympiad_id', 'is', null)
                .limit(1000)
            if (!error && data) {
                const unique = [...new Set(data.map(u => u.olympiad_id))].filter(Boolean) as string[]
                setOlympiads(unique)
                if (unique.length > 0 && !selectedOlympiad) {
                    setSelectedOlympiad(unique[0])
                }
            }
            setLoadingOlympiads(false)
        }
        fetchOlympiads()
    }, [])

    const entries = data?.entries || []

    return (
        <div className="p-5 md:p-8 max-w-6xl mx-auto" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-amber-500" />
                    مدیریت المپیادها
                </h1>
                <Button variant="secondary" onClick={() => refetch()} loading={loading}>
                    <RefreshCw className="w-4 h-4" />
                    بروزرسانی
                </Button>
            </div>

            <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-4 mb-6 flex flex-wrap items-center gap-4">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs text-gray-500 mb-1">المپیاد</label>
                    {loadingOlympiads ? (
                        <Skeleton className="h-10 w-full" />
                    ) : (
                        <select
                            value={selectedOlympiad || ''}
                            onChange={(e) => setSelectedOlympiad(e.target.value || null)}
                            className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {olympiads.map(o => (
                                <option key={o} value={o}>{o}</option>
                            ))}
                        </select>
                    )}
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">بازه</label>
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                        {(['today', 'week', 'month', 'all'] as const).map(w => (
                            <button
                                key={w}
                                onClick={() => setWindowType(w)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${windowType === w ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {w === 'today' ? 'امروز' : w === 'week' ? 'هفته' : w === 'month' ? 'ماه' : 'کل'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 rounded-xl" />)}
                </div>
            ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">{error}</div>
            ) : entries.length === 0 ? (
                <div className="text-center py-12 text-gray-400">داده‌ای برای نمایش وجود ندارد</div>
            ) : (
                <div className="bg-white rounded-2xl shadow-card border border-gray-100 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 whitespace-nowrap">
                                <th className="text-right py-3 px-4 font-medium">رتبه</th>
                                <th className="text-right py-3 px-4 font-medium">نام</th>
                                <th className="text-right py-3 px-4 font-medium">امتیاز ترکیبی</th>
                                <th className="text-right py-3 px-4 font-medium">مطالعه (۳۰ روز)</th>
                                <th className="text-right py-3 px-4 font-medium">روزهای فعال</th>
                                <th className="text-right py-3 px-4 font-medium">میانگین آزمون</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entries.map((entry) => (
                                <tr key={entry.user_id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                    <td className="py-3 px-4 font-mono whitespace-nowrap">{toPersianDigits(entry.rank)}</td>
                                    <td className="py-3 px-4 font-medium whitespace-nowrap">{entry.name}</td>
                                    <td className="py-3 px-4 font-mono text-indigo-600 whitespace-nowrap">{entry.composite_score}</td>
                                    <td className="py-3 px-4 font-mono whitespace-nowrap">{formatMinutes(entry.total_minutes_30)}</td>
                                    <td className="py-3 px-4 whitespace-nowrap">{toPersianDigits(entry.active_days_30)}</td>
                                    <td className="py-3 px-4 whitespace-nowrap">{toPersianDigits(Math.round(entry.avg_test_score))}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}