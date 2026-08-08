import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { adminService } from '../../services/adminService';
import { adminAnalyticsService } from '../../services/adminAnalyticsService';
import { formatDate, formatMinutes, today, daysAgo } from '../../utils/date-utils';
import { toPersianDigits } from '../../utils/jalali';
import { Skeleton } from '../common/Loading';
import { Avatar, getAvatarUrl } from '../common/Avatar';
import {
    Mail, Calendar, BookOpen, Award, Activity, ArrowRight,
    Search, Download, Moon, Smartphone, BarChart3, Eye
} from 'lucide-react';
import { Button } from '../common/Button';
import { Select } from '../common/Input';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { PhoneUsageSubmissions } from './PhoneUsageSubmissions';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';

type UserDetailType = {
    id: string;
    name: string;
    email: string;
    olympiad_id: string | null;
    created_at: string;
    preferences: Record<string, unknown> | null;
    status: string;
};

type SessionDetailType = {
    id: string;
    date: string;
    duration_minutes: number;
    subject_id: string | null;
    subjects: { name: string; color: string } | null;
    activities: string | null;
    resource?: string | null;
    question_count?: number | null;
    tags?: string | null;
};

type DailyMetricType = {
    date: string;
    sleep_hours: number | null;
    phone_usage_minutes: number | null;
    bedtime: string | null;
    wake_time: string | null;
};

export const UserDetail: React.FC = () => {
    const { userId } = useParams<{ userId: string }>();
    const { user: currentUser } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [user, setUser] = useState<UserDetailType | null>(null);
    const [sessions, setSessions] = useState<SessionDetailType[]>([]);
    const [metrics, setMetrics] = useState<DailyMetricType[]>([]);
    const [weeklyData, setWeeklyData] = useState<{ weekStart: string; studyMinutes: number; phoneMinutes: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [dateFrom, setDateFrom] = useState(daysAgo(30));
    const [dateTo, setDateTo] = useState(today());
    const [subjectFilter, setSubjectFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'sessions' | 'metrics'>('sessions');

    const isConsultant = currentUser?.role === 'ai_olympiad_consultant';

    const subjects = useMemo(() => {
        const subMap = new Map<string, string>();
        sessions.forEach(s => {
            if (s.subjects) {
                subMap.set(s.subject_id || '', s.subjects.name);
            }
        });
        return Array.from(subMap.entries()).map(([id, name]) => ({ id, name }));
    }, [sessions]);

    const filteredSessions = useMemo(() => {
        let list = sessions;
        if (dateFrom) list = list.filter(s => s.date >= dateFrom);
        if (dateTo) list = list.filter(s => s.date <= dateTo);
        if (subjectFilter !== 'all') list = list.filter(s => s.subject_id === subjectFilter);
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            list = list.filter(s =>
                s.activities?.toLowerCase().includes(q) ||
                s.subjects?.name?.toLowerCase().includes(q)
            );
        }
        return list.sort((a, b) => b.date.localeCompare(a.date));
    }, [sessions, dateFrom, dateTo, subjectFilter, searchQuery]);

    const filteredMetrics = useMemo(() => {
        let list = metrics;
        if (dateFrom) list = list.filter(m => m.date >= dateFrom);
        if (dateTo) list = list.filter(m => m.date <= dateTo);
        return list.sort((a, b) => b.date.localeCompare(a.date));
    }, [metrics, dateFrom, dateTo]);

    const filteredStats = useMemo(() => {
        const totalMinutes = filteredSessions.reduce((sum, s) => sum + s.duration_minutes, 0);
        const totalSessions = filteredSessions.length;
        const days = Math.max(1, filteredSessions.length > 0 ?
            new Set(filteredSessions.map(s => s.date)).size : 1);
        const avgDaily = totalMinutes / days;
        const avgSleep = filteredMetrics.reduce((sum, m) => sum + (m.sleep_hours || 0), 0) / (filteredMetrics.length || 1);
        const avgPhone = filteredMetrics.reduce((sum, m) => sum + (m.phone_usage_minutes || 0), 0) / (filteredMetrics.length || 1);
        return { totalMinutes, totalSessions, avgDaily, avgSleep, avgPhone, days };
    }, [filteredSessions, filteredMetrics]);

    useEffect(() => {
        if (!userId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                if (isConsultant) {
                    const userData = await adminService.getUserById(userId);
                    if (!userData || userData.olympiad_id !== 'ai' || userData.role !== 'student') {
                        setError('شما دسترسی به این کاربر را ندارید');
                        setLoading(false);
                        return;
                    }
                }
                const [userData, sessionsData, metricsData, weeklyMetrics] = await Promise.all([
                    adminService.getUserById(userId),
                    adminService.getUserSessions(userId, 500, 0),
                    adminAnalyticsService.getUserDailyMetrics(userId, daysAgo(90), today()),
                    adminAnalyticsService.getUserWeeklyMetrics(userId, 8),
                ]);
                if (userData) {
                    setUser({
                        id: userData.id,
                        name: userData.name,
                        email: userData.email,
                        olympiad_id: userData.olympiad_id,
                        created_at: userData.created_at,
                        preferences: userData.preferences,
                        status: userData.status || 'active',
                    });
                }
                setSessions(sessionsData.map((s: any) => ({
                    id: s.id,
                    date: s.date,
                    duration_minutes: s.duration_minutes,
                    subject_id: s.subject_id,
                    subjects: s.subjects,
                    activities: s.activities,
                    resource: s.resource,
                    question_count: s.question_count,
                    tags: s.tags,
                })));
                setMetrics(metricsData || []);
                setWeeklyData(weeklyMetrics || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId, isConsultant]);

    const handleExport = () => {
        const rows = viewMode === 'sessions'
            ? filteredSessions.map(s => [
                formatDate(s.date),
                s.duration_minutes,
                s.subjects?.name || 'بدون درس',
                s.activities || ''
            ])
            : filteredMetrics.map(m => [
                formatDate(m.date),
                m.sleep_hours ?? '—',
                m.phone_usage_minutes ?? '—',
                m.bedtime || '—',
                m.wake_time || '—'
            ]);
        const headers = viewMode === 'sessions'
            ? ['تاریخ', 'مدت (دقیقه)', 'درس', 'فعالیت‌ها']
            : ['تاریخ', 'ساعت خواب', 'استفاده از گوشی (دقیقه)', 'زمان خواب', 'زمان بیداری'];
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user_data_${userId}_${today()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('خروجی با موفقیت دانلود شد', 'success');
    };

    const handleViewSession = (sessionId: string) => {
        navigate(`/admin/users/${userId}/session/${sessionId}`);
    };

    if (loading) {
        return (
            <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                </div>
                <Skeleton className="h-64 rounded-2xl" />
            </div>
        );
    }

    if (error || !user) {
        return (
            <div className="p-5 md:p-8 max-w-4xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    {error || 'کاربر یافت نشد'}
                </div>
                <Link to="/admin/users" className="mt-4 inline-flex items-center gap-2 text-accent hover:text-accent-hover">
                    <ArrowRight className="w-4 h-4" />
                    بازگشت به لیست کاربران
                </Link>
            </div>
        );
    }

    if (isConsultant && user.olympiad_id !== 'ai') {
        return (
            <div className="p-5 md:p-8 max-w-4xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                    شما دسترسی به این کاربر را ندارید.
                </div>
                <Link to="/admin/users" className="mt-4 inline-flex items-center gap-2 text-accent hover:text-accent-hover">
                    <ArrowRight className="w-4 h-4" />
                    بازگشت به لیست کاربران
                </Link>
            </div>
        );
    }

    // Format week start for display (show week number or date range)
    const formatWeekLabel = (weekStart: string) => {
        const start = new Date(weekStart + 'T00:00:00');
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return `${formatDate(weekStart)} - ${formatDate(end.toISOString().split('T')[0])}`;
    };

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-surface-1 p-3 rounded-xl shadow-lg border border-border">
                    <p className="text-xs font-medium text-text-secondary mb-2">{formatWeekLabel(label)}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} className="text-xs" style={{ color: entry.color }}>
                            {entry.name}: {toPersianDigits(Math.round(entry.value))} {entry.name === 'مطالعه' ? 'دقیقه' : 'دقیقه'}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold text-text-primary">پروفایل کاربر</h1>
                    <Link to="/admin/users" className="text-sm text-accent hover:text-accent-hover flex items-center gap-1">
                        <ArrowRight className="w-4 h-4" />
                        بازگشت
                    </Link>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={handleExport} size="sm">
                        <Download className="w-4 h-4" />
                        خروجی CSV
                    </Button>
                </div>
            </div>

            {/* User Info */}
            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-6 flex flex-wrap items-center gap-6">
                <Avatar
                    name={user.name}
                    avatarUrl={getAvatarUrl(user.preferences)}
                    fallback={<span>{user.name?.charAt(0) || '?'}</span>}
                    className="w-16 h-16 rounded-full bg-accent text-white text-2xl font-bold"
                />
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold text-text-primary">{user.name}</h2>
                    <p className="text-sm text-text-secondary flex items-center gap-1"><Mail className="w-4 h-4" /> {user.email}</p>
                    <div className="flex flex-wrap gap-3 mt-2 text-xs">
                        <span className="flex items-center gap-1 bg-surface-3 px-2 py-1 rounded-full">
                            <Award className="w-3 h-3" /> {user.olympiad_id || 'بدون المپیاد'}
                        </span>
                        <span className="flex items-center gap-1 bg-surface-3 px-2 py-1 rounded-full">
                            <Calendar className="w-3 h-3" /> عضویت: {formatDate(user.created_at)}
                        </span>
                        <span className="flex items-center gap-1 bg-surface-3 px-2 py-1 rounded-full">
                            <Activity className="w-3 h-3" /> وضعیت: {user.status === 'suspended' ? 'تعلیق' : 'فعال'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4">
                    <p className="text-sm text-text-secondary">کل جلسات</p>
                    <p className="text-2xl font-bold">{toPersianDigits(filteredStats.totalSessions)}</p>
                </div>
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4">
                    <p className="text-sm text-text-secondary">کل مطالعه</p>
                    <p className="text-2xl font-bold">{formatMinutes(filteredStats.totalMinutes)}</p>
                </div>
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4">
                    <p className="text-sm text-text-secondary">میانگین روزانه</p>
                    <p className="text-2xl font-bold">{formatMinutes(Math.round(filteredStats.avgDaily))}</p>
                </div>
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4">
                    <p className="text-sm text-text-secondary">روزهای فعال</p>
                    <p className="text-2xl font-bold">{toPersianDigits(filteredStats.days)}</p>
                </div>
            </div>

            {/* Sleep & Phone Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                        <Moon className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm text-text-secondary">میانگین خواب</p>
                        <p className="text-xl font-bold">
                            {filteredStats.avgSleep > 0 ? `${toPersianDigits(filteredStats.avgSleep.toFixed(1))} ساعت` : '—'}
                        </p>
                    </div>
                </div>
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                        <Smartphone className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-sm text-text-secondary">میانگین استفاده از گوشی</p>
                        <p className="text-xl font-bold">
                            {filteredStats.avgPhone > 0 ? `${toPersianDigits(Math.round(filteredStats.avgPhone))} دقیقه` : '—'}
                        </p>
                    </div>
                </div>
            </div>

            {/* 🟢 NEW: Weekly Charts Section */}
            {weeklyData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Study Chart */}
                    <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-6">
                        <h3 className="text-sm font-semibold text-text-secondary mb-4">مطالعه هفتگی</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="weekStart"
                                        tickFormatter={(v) => formatDate(v)}
                                        tick={{ fontSize: 10 }}
                                        interval={Math.floor(weeklyData.length / 6)}
                                    />
                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => toPersianDigits(Math.round(v))} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="studyMinutes" name="مطالعه" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Phone Usage Chart */}
                    <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-6">
                        <h3 className="text-sm font-semibold text-text-secondary mb-4">استفاده از گوشی (هفتگی)</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="weekStart"
                                        tickFormatter={(v) => formatDate(v)}
                                        tick={{ fontSize: 10 }}
                                        interval={Math.floor(weeklyData.length / 6)}
                                    />
                                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => toPersianDigits(Math.round(v))} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend />
                                    <Bar dataKey="phoneMinutes" name="گوشی" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Phone Usage Submissions */}
            <PhoneUsageSubmissions userId={userId!} />

            {/* Filters */}
            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-text-secondary">از تاریخ</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="px-3 py-2 border border-border rounded-xl bg-surface-2 text-sm text-text-primary"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-xs font-medium text-text-secondary">تا تاریخ</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="px-3 py-2 border border-border rounded-xl bg-surface-2 text-sm text-text-primary"
                        />
                    </div>
                    <Select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        options={[
                            { value: 'all', label: 'همه دروس' },
                            ...subjects.map(s => ({ value: s.id, label: s.name })),
                        ]}
                        className="w-44"
                    />
                    <div className="flex-1 min-w-[150px]">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                            <input
                                type="text"
                                placeholder="جستجو در فعالیت‌ها..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pr-10 px-3 py-2 border border-border rounded-xl bg-surface-2 text-sm text-text-primary placeholder-text-tertiary"
                            />
                        </div>
                    </div>
                    <div className="flex gap-1 bg-surface-3 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('sessions')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'sessions'
                                ? 'bg-surface-1 text-accent shadow-sm'
                                : 'text-text-secondary hover:text-text-secondary'
                                }`}
                        >
                            <BookOpen className="w-4 h-4 inline ml-1" />
                            جلسات
                        </button>
                        <button
                            onClick={() => setViewMode('metrics')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'metrics'
                                ? 'bg-surface-1 text-accent shadow-sm'
                                : 'text-text-secondary hover:text-text-secondary'
                                }`}
                        >
                            <BarChart3 className="w-4 h-4 inline ml-1" />
                            خواب و گوشی
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle overflow-hidden">
                <div className="overflow-x-auto">
                    {viewMode === 'sessions' ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-surface-2 text-text-secondary border-b border-border">
                                    <th className="text-right py-3 px-4 font-medium">تاریخ</th>
                                    <th className="text-right py-3 px-4 font-medium">مدت</th>
                                    <th className="text-right py-3 px-4 font-medium">درس</th>
                                    <th className="text-right py-3 px-4 font-medium">فعالیت‌ها</th>
                                    <th className="text-right py-3 px-4 font-medium">جزئیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSessions.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-text-tertiary">هیچ جلسه‌ای با این فیلترها یافت نشد</td></tr>
                                ) : (
                                    filteredSessions.map(s => (
                                        <tr key={s.id} className="border-b border-border-subtle hover:bg-surface-2/50 transition-colors">
                                            <td className="py-3 px-4 text-xs whitespace-nowrap">{formatDate(s.date)}</td>
                                            <td className="py-3 px-4 font-mono text-sm whitespace-nowrap">{formatMinutes(s.duration_minutes)}</td>
                                            <td className="py-3 px-4">
                                                {s.subjects ? (
                                                    <span className="px-2 py-1 rounded-full text-xs" style={{
                                                        backgroundColor: s.subjects.color + '20',
                                                        color: s.subjects.color
                                                    }}>
                                                        {s.subjects.name}
                                                    </span>
                                                ) : (
                                                    <span className="text-text-tertiary text-xs">بدون درس</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-xs max-w-xs truncate">{s.activities || '—'}</td>
                                            <td className="py-3 px-4">
                                                <button
                                                    onClick={() => handleViewSession(s.id)}
                                                    className="p-1.5 rounded-lg text-accent hover:bg-accent-muted transition-colors"
                                                    title="مشاهده جزئیات کامل"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-surface-2 text-text-secondary border-b border-border">
                                    <th className="text-right py-3 px-4 font-medium">تاریخ</th>
                                    <th className="text-right py-3 px-4 font-medium">ساعت خواب</th>
                                    <th className="text-right py-3 px-4 font-medium">زمان خواب</th>
                                    <th className="text-right py-3 px-4 font-medium">زمان بیداری</th>
                                    <th className="text-right py-3 px-4 font-medium">استفاده از گوشی (دقیقه)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMetrics.length === 0 ? (
                                    <tr><td colSpan={5} className="text-center py-8 text-text-tertiary">هیچ داده‌ای با این فیلترها یافت نشد</td></tr>
                                ) : (
                                    filteredMetrics.map(m => (
                                        <tr key={m.date} className="border-b border-border-subtle hover:bg-surface-2/50 transition-colors">
                                            <td className="py-3 px-4 text-xs whitespace-nowrap">{formatDate(m.date)}</td>
                                            <td className="py-3 px-4">{m.sleep_hours ? toPersianDigits(m.sleep_hours.toFixed(1)) : '—'}</td>
                                            <td className="py-3 px-4">{m.bedtime || '—'}</td>
                                            <td className="py-3 px-4">{m.wake_time || '—'}</td>
                                            <td className="py-3 px-4">{m.phone_usage_minutes ? toPersianDigits(m.phone_usage_minutes) : '—'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="px-4 py-3 border-t border-border-subtle text-xs text-text-tertiary">
                    {viewMode === 'sessions'
                        ? `${toPersianDigits(filteredSessions.length)} جلسه یافت شد`
                        : `${toPersianDigits(filteredMetrics.length)} روز داده یافت شد`
                    }
                </div>
            </div>
        </div>
    );
};