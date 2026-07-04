// src/components/dashboard/sections/LeaderboardSection.tsx
import React, { useState, useEffect } from 'react'
import { supabase } from '../../../config/supabase'
import { Trophy, Medal, Users, Globe, RefreshCw } from 'lucide-react'
import { toPersianDigits } from '../../../utils/jalali'

interface LeaderboardSectionProps {
    userId: string | null
    olympiadId: string | null
}

interface LeaderboardEntry {
    user_id: string
    name: string
    olympiad_id: string
    total_minutes_30: number
    active_days_30: number
    composite_score: number
    rank: number
}

export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({ userId, olympiadId }) => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [scope, setScope] = useState<'my_olympiad' | 'global'>('my_olympiad')

    const fetchLeaderboard = async () => {
        try {
            setLoading(true)
            const targetOlympiad = scope === 'my_olympiad' ? olympiadId : null
            const todayStr = new Date().toISOString().split('T')[0]

            const { data, error } = await supabase.rpc('get_olympiad_leaderboard', {
                p_olympiad_id: targetOlympiad,
                p_today: todayStr,
                p_limit: 20,
                p_window_type: 'month'
            })

            if (error) throw error
            if (data && data.entries) {
                setEntries(data.entries)
            } else {
                setEntries([])
            }
        } catch (err) {
            console.error('خطا در دریافت لیدربورد:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLeaderboard()
    }, [scope, olympiadId])

    return (
        <div className="space-y-6 mt-6" dir="rtl">
            <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex bg-gray-100 p-1 rounded-xl max-w-sm w-full sm:w-auto">
                    <button
                        onClick={() => setScope('my_olympiad')}
                        className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${scope === 'my_olympiad' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users className="w-4 h-4" />
                        المپیاد من
                    </button>
                    <button
                        onClick={() => setScope('global')}
                        className={`flex-1 py-2 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${scope === 'global' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Globe className="w-4 h-4" />
                        کل المپیادها
                    </button>
                </div>

                <button
                    onClick={fetchLeaderboard}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                    title="بروزرسانی زنده"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
                </button>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(n => <div key={n} className="h-16 bg-gray-100/70 rounded-2xl" />)}
                </div>
            ) : entries.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100 shadow-sm">
                    هنوز داده‌ای برای نمایش رتبه‌بندی ثبت نشده است.
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm text-right">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 grid grid-cols-12 text-xs font-bold text-gray-500">
                        <div className="col-span-2 text-center">رتبه</div>
                        <div className="col-span-5 text-right pr-2">دانش‌پژوه</div>
                        <div className="col-span-3 text-center">ساعت مطالعه (ماه)</div>
                        <div className="col-span-2 text-center">امتیاز فعالیت</div>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {entries.map((entry) => {
                            const isMe = entry.user_id === userId
                            return (
                                <div
                                    key={entry.user_id}
                                    className={`p-4 grid grid-cols-12 items-center text-sm transition-colors ${isMe ? 'bg-indigo-50/50 font-semibold' : 'hover:bg-gray-50/50'}`}
                                >
                                    <div className="col-span-2 flex justify-center">
                                        {entry.rank === 1 ? (
                                            <Trophy className="w-5 h-5 text-amber-500 drop-shadow-sm" />
                                        ) : entry.rank === 2 ? (
                                            <Medal className="w-5 h-5 text-slate-400 drop-shadow-sm" />
                                        ) : entry.rank === 3 ? (
                                            <Medal className="w-5 h-5 text-amber-700 drop-shadow-sm" />
                                        ) : (
                                            <span className="text-gray-400 font-bold">{toPersianDigits(entry.rank)}</span>
                                        )}
                                    </div>
                                    <div className="col-span-5 text-gray-700 font-medium truncate pr-2">
                                        {entry.name} {isMe && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-md mr-1 font-bold">شما</span>}
                                    </div>
                                    <div className="col-span-3 text-center text-gray-600 font-bold">
                                        {toPersianDigits(Math.round(entry.total_minutes_30 / 60))} ساعت
                                    </div>
                                    <div className="col-span-2 text-center">
                                        <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full text-xs">
                                            {toPersianDigits(entry.composite_score)}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}

export default LeaderboardSection