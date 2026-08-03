// src/components/admin/AIOlympiadDashboard.tsx - FIXED (removed unused imports)
import React, { useState, useMemo, useEffect } from 'react';
import { useAdminAnalytics } from '../../hooks/useAdminAnalytics';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    Activity,
    Clock,
    AlertCircle,
    RefreshCw,
    TrendingUp,
    Award,
    BarChart3,
} from 'lucide-react';
import { formatDate, formatMinutes } from '../../utils/date-utils';
import { toPersianDigits } from '../../utils/jalali';
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
    Cell,
} from 'recharts';
import { Button } from '../common/Button';
import { Skeleton } from '../common/Loading';
import { Link } from 'react-router-dom';
import { RiskDistributionCard } from './RiskDistributionCard';
import { OlympiadLeaderboard } from './OlympiadLeaderboard';
import { AnomalyCard } from './AnomalyCard';
import { InsightCard } from './InsightCard';
import { supabase } from '../../config/supabase';

interface AIOlympiadStats {
    totalStudents: number;
    activeStudents: number;
    totalMinutes: number;
    avgDailyMinutes: number;
    totalActiveDays: number;
    generatedAt: string;
}

export const AIOlympiadDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [refreshKey, setRefreshKey] = useState(0);
    const [stats, setStats] = useState<AIOlympiadStats | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    const { data: analytics, loading: analyticsLoading, error: analyticsError, refetch } = useAdminAnalytics({
        olympiadId: 'ai',
        dateRange: 'month',
        forceRefresh: refreshKey > 0,
    });

    useEffect(() => {
        const fetchStats = async () => {
            setStatsLoading(true);
            try {
                const { data, error } = await supabase.rpc('get_ai_olympiad_student_stats');
                if (error) throw error;
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch AI Olympiad stats:', err);
            } finally {
                setStatsLoading(false);
            }
        };
        fetchStats();
    }, [refreshKey]);

    const handleRefresh = () => {
        setRefreshKey((k) => k + 1);
        refetch();
    };

    // Statistics for cards
    const statCards = useMemo(() => {
        if (!stats) return null;
        return {
            totalStudents: stats.totalStudents,
            activeStudents: stats.activeStudents,
            avgDailyMinutes: stats.avgDailyMinutes || 0,
            totalMinutes: stats.totalMinutes || 0,
        };
    }, [stats]);

    if ((analyticsLoading || statsLoading) && !analytics) {
        return (
            <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-2xl" />
                    ))}
                </div>
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Skeleton className="h-64 rounded-2xl" />
                    <Skeleton className="h-64 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (analyticsError) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" />
                    <span>{analyticsError}</span>
                    <Button variant="secondary" onClick={handleRefresh}>تلاش مجدد</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-full mx-auto space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">داشبورد المپیاد هوش مصنوعی</h1>
                    <p className="text-sm text-text-secondary mt-1">نمای کلی عملکرد دانش‌آموزان المپیاد هوش مصنوعی</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Button variant="secondary" onClick={handleRefresh} loading={analyticsLoading}>
                        <RefreshCw className="w-4 h-4" />
                        بروزرسانی
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            {statCards && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-surface-1 rounded-2xl p-5 shadow-card border border-border-subtle">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-text-secondary">دانش‌آموزان کل</span>
                            <Users className="w-5 h-5 text-indigo-500" />
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold text-text-primary">{toPersianDigits(statCards.totalStudents)}</span>
                        </div>
                    </div>
                    <div className="bg-surface-1 rounded-2xl p-5 shadow-card border border-border-subtle">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-text-secondary">دانش‌آموزان فعال</span>
                            <Activity className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold text-text-primary">{toPersianDigits(statCards.activeStudents)}</span>
                        </div>
                    </div>
                    <div className="bg-surface-1 rounded-2xl p-5 shadow-card border border-border-subtle">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-text-secondary">میانگین مطالعه روزانه</span>
                            <Clock className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold text-text-primary">{formatMinutes(statCards.avgDailyMinutes)}</span>
                        </div>
                    </div>
                    <div className="bg-surface-1 rounded-2xl p-5 shadow-card border border-border-subtle">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-text-secondary">کل مطالعه (۳۰ روز)</span>
                            <BarChart3 className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="flex items-end justify-between">
                            <span className="text-2xl font-bold text-text-primary">{formatMinutes(statCards.totalMinutes)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Study Trend */}
                <div className="bg-surface-1 rounded-2xl p-6 shadow-card border border-border-subtle">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-text-secondary">روند مطالعه روزانه (ماه اخیر)</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics?.dailyStudy || []}>
                                <defs>
                                    <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatMinutes(v)} />
                                <Tooltip formatter={(value: any) => formatMinutes(value)} labelFormatter={(label) => formatDate(label)} />
                                <Area type="monotone" dataKey="minutes" stroke="#6366f1" fill="url(#studyGradient)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Subject Distribution */}
                <div className="bg-surface-1 rounded-2xl p-6 shadow-card border border-border-subtle">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-text-secondary">توزیع دروس</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics?.subjectDistribution || []}
                                    dataKey="minutes"
                                    nameKey="subject"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={({ name }) => name}
                                >
                                    {(analytics?.subjectDistribution || []).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => formatMinutes(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Risk Distribution */}
                <RiskDistributionCard
                    data={analytics?.riskDistribution || []}
                    onRiskClick={(level) => navigate(`/admin/users?risk=${level}`)}
                />

                {/* Olympiad Leaderboard */}
                <OlympiadLeaderboard
                    olympiads={analytics?.topOlympiads || []}
                    onOlympiadClick={() => navigate('/admin/olympiads')}
                />
            </div>

            {/* Anomalies & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnomalyCard
                    anomalies={analytics?.anomalies || []}
                    onViewAll={() => navigate('/admin/anomalies')}
                />
                <InsightCard
                    insights={analytics?.insights || []}
                    onViewAll={() => navigate('/admin/insights')}
                />
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link
                    to="/admin/users"
                    className="bg-surface-1 rounded-2xl p-4 shadow-card border border-border-subtle hover:border-accent transition-colors text-center"
                >
                    <Users className="w-6 h-6 text-accent mx-auto mb-2" />
                    <span className="text-sm font-medium text-text-primary">مدیریت دانش‌آموزان</span>
                </Link>
                <Link
                    to="/admin/olympiads"
                    className="bg-surface-1 rounded-2xl p-4 shadow-card border border-border-subtle hover:border-accent transition-colors text-center"
                >
                    <Award className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                    <span className="text-sm font-medium text-text-primary">رتبه‌بندی</span>
                </Link>
                <Link
                    to="/admin/insights"
                    className="bg-surface-1 rounded-2xl p-4 shadow-card border border-border-subtle hover:border-accent transition-colors text-center"
                >
                    <TrendingUp className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    <span className="text-sm font-medium text-text-primary">بینش‌ها</span>
                </Link>
                <Link
                    to="/admin/anomalies"
                    className="bg-surface-1 rounded-2xl p-4 shadow-card border border-border-subtle hover:border-accent transition-colors text-center"
                >
                    <AlertCircle className="w-6 h-6 text-rose-500 mx-auto mb-2" />
                    <span className="text-sm font-medium text-text-primary">ناهنجاری‌ها</span>
                </Link>
            </div>
        </div>
    );
};

export default AIOlympiadDashboard;