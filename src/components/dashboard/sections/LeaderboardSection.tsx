import React, { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../../config/supabase'
import {
    Trophy,
    Users,
    Globe,
    RefreshCw,
    Clock,
    Calendar,
    Moon,
    Smartphone,
    Brain,
    Crown,
    TrendingUp,
    AlertCircle
} from 'lucide-react'
import { toPersianDigits } from '../../../utils/jalali'

interface LeaderboardSectionProps {
    userId: string | null
    olympiadId: string | null
}

interface LeaderboardEntry {
    rank: number
    user_id: string
    name: string
    total_minutes_30: number
    active_days_30: number
    best_streak: number
    avg_test_score: number
    avg_sleep_hours: number
    avg_phone_minutes: number
    composite_score: number
}

type TabId = 'study' | 'consistency' | 'sleep' | 'phone' | 'smart'

const tabConfigs = {
    study: {
        label: 'پرتلاش‌ترین',
        icon: <Clock className="w-4 h-4" />,
        unit: 'ساعت',
        banner: '🔥 جنگ غول‌های المپیاد و درس! اینجا ثانیه‌ها هم سرنوشت‌سازن. کی بیشتر دووم میاره؟',
        titles: ['🏆 سلطان مطالعه و خستگی‌ناپذیر', '🥈 کتاب‌خوان حرفه‌ای هفته', '🥉 رقیب سرسخت و نفس‌گیر', 'تلاشگر مصمم']
    },
    consistency: {
        label: 'منظم‌ترین',
        icon: <Calendar className="w-4 h-4" />,
        unit: 'امتیاز',
        banner: '📅 مسابقه زنجیره طلایی! کسایی که هر روز بدون وقفه تلاش کردن و چراغ جاده رو روشن نگه داشتن.',
        titles: ['👑 قهرمانِ تداوم و اراده آهنین', '🥈 الگوی نظم و انضباط پلتفرم', '🥉 استوار و بی‌وقفه', 'منظم و پیگیر']
    },
    sleep: {
        label: 'خواب‌آلوترین',
        icon: <Moon className="w-4 h-4" />,
        unit: 'ساعت',
        banner: '😴 مسابقات قهرمانی خواب سنگین! نفر اول رسماً خابالوترین آدم کل کهکشانه! دمتون گرم که به ریکاوری اهمیت میدین.',
        titles: ['👑 خابالوترین خرس قطبی پلتفرم', '🥈 عاشقِ وفادار بالش و پتو', '🥉 پادشاه خواب', 'خوش‌خوابِ منظم']
    },
    phone: {
        label: 'کم-گوشی‌ترین',
        icon: <Smartphone className="w-4 h-4" />,
        unit: 'دقیقه',
        banner: '📵 چالش بزرگ سم‌زدایی دیجیتال! کسانی که گوشی رو بوسیدن گذاشتن کنار و دارن توی دنیای واقعی زندگی می‌کنن.',
        titles: ['🥈 مهارکننده بزرگ تکنولوژی / دشمن سوشال مدیا', ' 🦾 امپراطور تمرکز و اراده دیجیتال', '🥉 قهرمان دوری از اکسپلور', 'همراهِ متمرکز']
    },
    smart: {
        label: 'هوشمندترین',
        icon: <Brain className="w-4 h-4" />,
        unit: 'امتیاز',
        banner: '🧠 مغزهای متفکر لیدربورد! تعادل فوق‌العاده بین زمان مطالعه، استمرار عالی و نمرات درخشان در آزمون‌ها.',
        titles: ['👑 مغز متفکر و تئوریسین ارشد لیدربورد', '🥈 استراتژیست باهوش و دقیق', '🥉 مهندسِ موفقیت و یادگیری', 'دانش‌پژوه هوشمند']
    }
}


export const LeaderboardSection: React.FC<LeaderboardSectionProps> = ({ userId, olympiadId }) => {
    const [entries, setEntries] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [scope, setScope] = useState<'my_olympiad' | 'global'>('my_olympiad')
    const [activeTab, setActiveTab] = useState<TabId>('study')
    const [windowType, setWindowType] = useState<'today' | 'week' | 'month' | 'all'>('month')

    const fetchLeaderboard = async () => {
        try {
            setLoading(true)
            setError(null)
            const targetOlympiad = scope === 'my_olympiad' ? olympiadId : null
            const todayStr = new Date().toISOString().split('T')[0]

            const { data, error } = await supabase.rpc('get_olympiad_leaderboard', {
                p_olympiad_id: targetOlympiad,
                p_today: todayStr,
                p_limit: 50,
                p_window_type: windowType,
                p_metric: activeTab
            })

            if (error) throw error
            if (data && data.entries) {
                const entriesWithRank = data.entries.map((entry: any, index: number) => ({
                    ...entry,
                    rank: index + 1,
                    avg_sleep_hours: entry.avg_sleep_hours ?? 0,
                    avg_phone_minutes: entry.avg_phone_minutes ?? 0,
                }))
                setEntries(entriesWithRank)
            } else {
                setEntries([])
            }
        } catch (err: any) {
            console.error('خطا در دریافت لیدربورد:', err)
            setError(err.message || 'خطا در دریافت داده‌ها')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchLeaderboard()
    }, [scope, olympiadId, windowType, activeTab])

    const myRankInfo = useMemo(() => {
        const index = entries.findIndex(e => e.user_id === userId)
        if (index !== -1) {
            return { rank: entries[index].rank, data: entries[index] }
        }
        return { rank: null, data: null }
    }, [entries, userId])

    const podiumUsers = useMemo(() => entries.slice(0, 3), [entries])
    const remainingUsers = useMemo(() => entries.slice(3), [entries])

    const getFormattedValue = (entry: LeaderboardEntry) => {
        if (activeTab === 'study') return `${toPersianDigits(Math.round(entry.total_minutes_30 / 60))}`
        if (activeTab === 'consistency') return `${toPersianDigits(Math.round(entry.active_days_30 * 0.6 + entry.best_streak * 0.4))}`
        if (activeTab === 'sleep') return `${toPersianDigits(Number(entry.avg_sleep_hours).toFixed(1))}`
        if (activeTab === 'phone') return `${toPersianDigits(Math.round(entry.avg_phone_minutes))}`
        return `${toPersianDigits(Math.round(entry.composite_score))}`
    }

    const getCustomTitle = (rankIndex: number) => {
        const titles = tabConfigs[activeTab].titles
        return rankIndex < 3 ? titles[rankIndex] : titles[3]
    }

    const periodLabels = { today: 'امروز', week: 'این هفته', month: 'این ماه', all: 'همه زمان‌ها' }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-red-50 rounded-2xl border border-red-200">
                <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
                <p className="text-red-700 font-medium">{error}</p>
                <button onClick={fetchLeaderboard} className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-bold">
                    تلاش مجدد
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-6 mt-6 max-w-5xl mx-auto pb-12" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-5 rounded-2xl border border-indigo-500/20 backdrop-blur-md">
                <div className="text-right">
                    <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-amber-500 animate-bounce" />
                        تالار افتخارات و رقابت آنلاین دانش‌پژوهان
                    </h2>
                    <p className="text-gray-500 text-xs mt-1">
                        عملکرد خودت رو بسنج و با برترین‌های پلتفرم به صورت لحظه‌ای رقابت کن!
                    </p>
                </div>
                {myRankInfo.rank && (
                    <div className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/20 self-start md:self-auto">
                        <TrendingUp className="w-4 h-4" />
                        رتبه شما در این بخش: {toPersianDigits(myRankInfo.rank)}#
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                    <button
                        onClick={() => setScope('my_olympiad')}
                        className={`py-2 px-4 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${scope === 'my_olympiad' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users className="w-4 h-4" />
                        المپیاد من
                    </button>
                    <button
                        onClick={() => setScope('global')}
                        className={`py-2 px-4 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${scope === 'global' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Globe className="w-4 h-4" />
                        کل المپیادها
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <select
                        value={windowType}
                        onChange={(e) => setWindowType(e.target.value as any)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-bold text-gray-700 outline-none cursor-pointer"
                    >
                        <option value="today">امروز</option>
                        <option value="week">هفته اخیر</option>
                        <option value="month">ماه اخیر</option>
                        <option value="all">همه زمان‌ها</option>
                    </select>

                    <button
                        onClick={fetchLeaderboard}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        title="بروزرسانی داده‌ها"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-gray-100 p-1 rounded-xl">
                {(Object.keys(tabConfigs) as TabId[]).map((tabId) => (
                    <button
                        key={tabId}
                        onClick={() => setActiveTab(tabId)}
                        className={`py-2.5 px-2 text-xs font-black rounded-lg transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap ${activeTab === tabId ? 'bg-white text-indigo-600 shadow-md transform scale-[1.02]' : 'text-gray-500 hover:text-gray-800'}`}
                    >
                        {tabConfigs[tabId].icon}
                        {tabConfigs[tabId].label}
                    </button>
                ))}
            </div>

            {/* Banner */}
            <div className="bg-blue-50/70 border-r-4 border-blue-500 p-4 rounded-xl text-xs md:text-sm font-medium text-blue-900 shadow-sm text-right">
                <p className="leading-6">{tabConfigs[activeTab].banner}</p>
            </div>

            {loading ? (
                <div className="animate-pulse space-y-3">
                    <div className="h-40 bg-gray-100 rounded-2xl" />
                    {[1, 2, 3].map(n => <div key={n} className="h-16 bg-gray-100/70 rounded-2xl" />)}
                </div>
            ) : entries.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100 shadow-sm font-medium">
                    هنوز هیچ داده‌ای برای نمایش رتبه‌بندی در این بازه ثبت نشده است. اولین نفر باشید!🚀
                </div>
            ) : (
                <>
                    {/* Podium */}
                    <div className="bg-gradient-to-b from-white to-gray-50/50 rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <div className="flex items-end justify-center gap-3 md:gap-10 pt-10 pb-2 max-w-xl mx-auto">
                            {podiumUsers[1] && (
                                <div className="flex flex-col items-center flex-1 transition-all duration-300 hover:scale-105">
                                    <div className="relative">
                                        <div className="w-14 h-14 bg-gradient-to-tr from-gray-300 to-gray-100 rounded-full flex items-center justify-center text-xl font-bold border-2 border-gray-300 shadow-md">
                                            👤
                                        </div>
                                        <span className="absolute -top-2 -right-1 bg-gray-400 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">۲</span>
                                    </div>
                                    <div className="text-center mt-2 w-full">
                                        <p className="text-xs font-black text-gray-800 truncate">{podiumUsers[1].name}</p>
                                        <p className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-md mt-0.5 inline-block max-w-full truncate">
                                            {getCustomTitle(1)}
                                        </p>
                                    </div>
                                    <div className="w-full bg-gradient-to-t from-gray-200 to-gray-100 h-24 rounded-t-xl mt-3 flex flex-col items-center justify-center border-t border-gray-300">
                                        <span className="text-sm font-black text-gray-700">{getFormattedValue(podiumUsers[1])}</span>
                                        <span className="text-[9px] text-gray-400 font-bold">{tabConfigs[activeTab].unit}</span>
                                    </div>
                                </div>
                            )}

                            {podiumUsers[0] && (
                                <div className="flex flex-col items-center flex-1 z-10 transition-all duration-300 hover:scale-105">
                                    <div className="relative -mt-6">
                                        <Crown className="w-5 h-5 text-amber-500 absolute -top-4 left-1/2 transform -translate-x-1/2 animate-bounce" />
                                        <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-yellow-200 rounded-full flex items-center justify-center text-2xl border-4 border-amber-400 shadow-xl ring-4 ring-amber-500/10">
                                            👑
                                        </div>
                                        <span className="absolute -top-1 -right-1 bg-amber-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ring-2 ring-white">۱</span>
                                    </div>
                                    <div className="text-center mt-2 w-full">
                                        <p className="text-sm font-black text-gray-900 truncate">{podiumUsers[0].name}</p>
                                        <p className="text-[9px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full mt-0.5 inline-block max-w-full truncate">
                                            {getCustomTitle(0)}
                                        </p>
                                    </div>
                                    <div className="w-full bg-gradient-to-t from-amber-200 via-yellow-100 to-amber-50 h-32 rounded-t-xl mt-3 flex flex-col items-center justify-center border-t-2 border-amber-400 shadow-md">
                                        <span className="text-base font-black text-amber-950">{getFormattedValue(podiumUsers[0])}</span>
                                        <span className="text-[10px] text-amber-700 font-bold">{tabConfigs[activeTab].unit}</span>
                                    </div>
                                </div>
                            )}

                            {podiumUsers[2] && (
                                <div className="flex flex-col items-center flex-1 transition-all duration-300 hover:scale-105">
                                    <div className="relative">
                                        <div className="w-14 h-14 bg-gradient-to-tr from-orange-300 to-orange-100 rounded-full flex items-center justify-center text-xl font-bold border-2 border-orange-200 shadow-md">
                                            👤
                                        </div>
                                        <span className="absolute -top-2 -right-1 bg-orange-400 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black">۳</span>
                                    </div>
                                    <div className="text-center mt-2 w-full">
                                        <p className="text-xs font-black text-gray-800 truncate">{podiumUsers[2].name}</p>
                                        <p className="text-[9px] font-bold text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded-md mt-0.5 inline-block max-w-full truncate">
                                            {getCustomTitle(2)}
                                        </p>
                                    </div>
                                    <div className="w-full bg-gradient-to-t from-orange-100 to-orange-50 h-20 rounded-t-xl mt-3 flex flex-col items-center justify-center border-t border-orange-200">
                                        <span className="text-sm font-black text-gray-700">{getFormattedValue(podiumUsers[2])}</span>
                                        <span className="text-[9px] text-gray-400 font-bold">{tabConfigs[activeTab].unit}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Remaining list */}
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <div className="p-4 bg-gray-50 border-b border-gray-100 grid grid-cols-12 text-xs font-black text-gray-500 text-center">
                            <div className="col-span-2">رتبه</div>
                            <div className="col-span-6 text-right pr-4">نام کارکرد و نشان افتخار</div>
                            <div className="col-span-4 text-left pl-6">مقدار ({periodLabels[windowType]})</div>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {remainingUsers.map((entry) => {
                                const isMe = entry.user_id === userId
                                return (
                                    <div
                                        key={entry.user_id}
                                        className={`p-4 grid grid-cols-12 items-center text-center text-sm transition-colors ${isMe ? 'bg-indigo-50/60 font-black border-y border-indigo-100' : 'hover:bg-gray-50/40'}`}
                                    >
                                        <div className="col-span-2 flex justify-center">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isMe ? 'bg-indigo-600 text-white shadow' : 'bg-gray-100 text-gray-600'}`}>
                                                {toPersianDigits(entry.rank)}
                                            </span>
                                        </div>

                                        <div className="col-span-6 text-right pr-4 truncate">
                                            <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                                                {entry.name}
                                                {isMe && <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-md font-black">شما</span>}
                                            </span>
                                            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
                                                {getCustomTitle(entry.rank - 1)}
                                            </p>
                                        </div>

                                        <div className="col-span-4 text-left pl-6 font-black text-indigo-700 flex items-center justify-end gap-1">
                                            <span>{getFormattedValue(entry)}</span>
                                            <span className="text-[10px] text-gray-400 font-normal">{tabConfigs[activeTab].unit}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </>
            )}

            {/* My rank card */}
            {myRankInfo.rank && myRankInfo.data && (
                <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-indigo-950 text-white p-4 rounded-xl flex items-center justify-between shadow-xl mt-4">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-500 rounded-full flex items-center justify-center text-lg shadow-inner shadow-black/20">
                            🚀
                        </div>
                        <div className="text-right">
                            <h4 className="text-xs font-black text-gray-100">جایگاه اختصاصی شما</h4>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                                در تب <span className="text-amber-400 font-bold">{tabConfigs[activeTab].label}</span> / بازه <span className="text-amber-400 font-bold">{periodLabels[windowType]}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-center">
                            <span className="block text-[9px] text-gray-400 font-bold">رتبه شما</span>
                            <span className="text-sm font-black text-amber-400">#{toPersianDigits(myRankInfo.rank)}</span>
                        </div>
                        <div className="text-center border-r border-gray-700 pr-5">
                            <span className="block text-[9px] text-gray-400 font-bold">میزان کارکرد</span>
                            <span className="text-sm font-black text-white">
                                {getFormattedValue(myRankInfo.data)} <span className="text-[9px] text-gray-400 font-normal">{tabConfigs[activeTab].unit}</span>
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LeaderboardSection