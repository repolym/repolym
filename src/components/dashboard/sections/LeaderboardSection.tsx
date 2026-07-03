// src/components/dashboard/LeaderboardSection.tsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../config/supabase';
import { Trophy, Medal, Award, Target, Flame, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

// ─── Helper: safe number formatting ──────────────────────────
function safeNumber(value: any): number {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
}

// ─── Local Error Boundary ─────────────────────────────────────
class LeaderboardErrorBoundary extends React.Component<
    { children: React.ReactNode },
    { hasError: boolean; error: Error | null }
> {
    constructor(props: any) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }
    componentDidCatch(error: Error) {
        console.error('Leaderboard crashed:', error);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 text-center bg-red-50 rounded-2xl border border-red-200">
                    <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 font-medium">مشکلی در نمایش جدول رتبه‌بندی وجود دارد</p>
                    <p className="text-sm text-red-400 mt-1">{this.state.error?.message || ''}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
                    >
                        تلاش مجدد
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// ─── Main Component ────────────────────────────────────────────
export default function LeaderboardSection() {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function fetchData() {
            if (!user?.olympiad_id) {
                if (mounted) {
                    setLeaderboard([]);
                    setLoading(false);
                    setError(null);
                }
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const today = new Date().toISOString().split('T')[0];
                console.log('📊 Fetching leaderboard for olympiad:', user.olympiad_id, today);

                const { data, error: rpcError } = await supabase.rpc('get_olympiad_leaderboard', {
                    p_olympiad_id: user.olympiad_id,
                    p_today: today,
                    p_limit: 50,
                    p_window_type: 'month',
                });

                console.log('📊 RPC response:', { data, rpcError });

                if (rpcError) {
                    console.error('❌ RPC error:', rpcError);
                    setError(`خطا در دریافت داده: ${rpcError.message || 'مشکل در ارتباط با سرور'}`);
                    setLeaderboard([]);
                    setLoading(false);
                    return;
                }

                // Safely extract entries
                let entries = [];
                if (data && typeof data === 'object' && 'entries' in data && Array.isArray(data.entries)) {
                    entries = data.entries;
                } else {
                    console.warn('⚠️ Unexpected data format:', data);
                    // If data is an array directly, use it
                    if (Array.isArray(data)) {
                        entries = data;
                    }
                }

                const formatted = entries.map((item: any) => ({
                    user_id: item?.user_id || '',
                    user_name: item?.name || 'ناشناس',
                    total_study_minutes: safeNumber(item?.total_minutes_30),
                    active_days: safeNumber(item?.active_days_30),
                    rank: safeNumber(item?.rank),
                }));

                console.log('✅ Formatted leaderboard:', formatted);

                if (mounted) {
                    setLeaderboard(formatted);
                    setError(null);
                }
            } catch (err) {
                console.error('💥 Unexpected error:', err);
                if (mounted) {
                    setError('خطای غیرمنتظره. لطفاً صفحه را مجدداً بارگذاری کنید.');
                    setLeaderboard([]);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        fetchData();

        return () => {
            mounted = false;
        };
    }, [user?.olympiad_id]);

    // ─── Render States ──────────────────────────────────────────

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
                <p className="text-red-600 font-medium">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    if (!leaderboard || leaderboard.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                <Trophy className="w-12 h-12 text-gray-300 mb-3" />
                <p className="text-gray-500 font-medium">هیچ رتبه‌بندی موجود نیست</p>
                <p className="text-sm text-gray-400">با ثبت جلسات مطالعه، جایگاه شما مشخص می‌شود.</p>
            </div>
        );
    }

    // ─── Main render ────────────────────────────────────────────

    const currentUser = leaderboard.find((item) => item.user_id === user?.id);

    // Wrap everything in the local error boundary
    return (
        <LeaderboardErrorBoundary>
            <div className="space-y-6 dir-rtl text-right">
                {/* User status */}
                {currentUser && (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Target size={20} className="text-amber-300" />
                                وضعیت رقابتی شما
                            </h3>
                            <p className="text-sm text-indigo-100 mt-1">
                                {currentUser.rank <= 3
                                    ? 'فوق‌العاده است! شما در صدر جدول سکوهای قهرمانی هستید. 🔥'
                                    : `شما در رتبه ${currentUser.rank} مسابقات قرار دارید. با افزایش پارت‌های مطالعه روزانه می‌توانید به جمع ۳ نفر برتر برسید!`}
                            </p>
                        </div>
                        <div className="flex gap-4 bg-white/10 p-3 rounded-xl backdrop-blur-sm self-stretch md:self-auto justify-around">
                            <div className="text-center px-2">
                                <span className="block text-xs text-indigo-200">رتبه شما</span>
                                <span className="font-mono text-xl font-bold text-amber-300">{currentUser.rank}</span>
                            </div>
                            <div className="w-px bg-white/20" />
                            <div className="text-center px-2">
                                <span className="block text-xs text-indigo-200">کل مطالعه</span>
                                <span className="font-mono text-xl font-bold">
                                    {Math.round(currentUser.total_study_minutes / 60)} ساعت
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-slate-50 flex items-center gap-2">
                        <Trophy className="text-amber-500" size={22} />
                        <div>
                            <h2 className="font-bold text-slate-800 text-lg">جدول المپیادی‌های برتر</h2>
                            <p className="text-xs text-slate-400 mt-0.5">رتبه‌بندی بر اساس مجموع دقایق مطالعه ثبت شده</p>
                        </div>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {leaderboard.map((row) => {
                            const isMe = row.user_id === user?.id;
                            return (
                                <div
                                    key={row.user_id || Math.random().toString()}
                                    className={`flex items-center justify-between p-4 transition-colors ${isMe ? 'bg-indigo-50/50' : 'hover:bg-slate-50/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 flex justify-center items-center font-mono font-bold text-base text-slate-500">
                                            {row.rank === 1 && <Trophy size={22} className="text-amber-500" />}
                                            {row.rank === 2 && <Medal size={22} className="text-slate-400" />}
                                            {row.rank === 3 && <Award size={22} className="text-amber-700" />}
                                            {row.rank > 3 && row.rank}
                                        </div>

                                        <div>
                                            <span className={`font-semibold text-sm block ${isMe ? 'text-indigo-600 font-bold' : 'text-slate-700'
                                                }`}>
                                                {row.user_name} {isMe && '(شما)'}
                                            </span>
                                            <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                                <Flame size={12} className="text-orange-400" />
                                                {row.active_days} روز مطالعه فعال
                                            </span>
                                        </div>
                                    </div>

                                    <div className="text-left font-mono">
                                        <span className="font-bold text-slate-800">
                                            {Math.round(row.total_study_minutes / 60)}
                                        </span>
                                        <span className="text-xs text-slate-400 mr-1">ساعت</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </LeaderboardErrorBoundary>
    );
}