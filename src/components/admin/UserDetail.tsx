import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { adminService } from '../../services/adminService'
import { adminAnalyticsService } from '../../services/adminAnalyticsService'
import { formatDate, formatMinutes, today, daysAgo } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'
import { Skeleton } from '../common/Loading'
import { Avatar, getAvatarUrl } from '../common/Avatar'
import { Mail, Calendar, BookOpen, Award, Clock, Activity, ArrowRight } from 'lucide-react'
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
} from 'recharts'

// Types
interface UserDetailType {
    id: string
    name: string
    email: string
    olympiad_id: string | null
    created_at: string
    preferences: Record<string, unknown> | null
    status: string
}

interface UserStatsType {
    totalSessions: number
    totalMinutes: number
    totalTests: number
    avgTestScore: number
    currentStreak: number
    longestStreak: number
}

interface SessionDetailType {
    id: string
    date: string
    duration_minutes: number
    subjects: { name: string; color: string } | null
}

interface ActivityLogType {
    id: string
    action: string
    created_at: string
}

interface DailyStudy {
    date: string
    minutes: number
}

interface SubjectDist {
    subject: string
    minutes: number
    color: string
}

export const UserDetail: React.FC = () => {
    const { userId } = useParams<{ userId: string }>()
    const [user, setUser] = useState<UserDetailType | null>(null)
    const [stats, setStats] = useState<UserStatsType | null>(null)
    const [sessions, setSessions] = useState<SessionDetailType[]>([])
    const [logs, setLogs] = useState<ActivityLogType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [dailyStudy, setDailyStudy] = useState<DailyStudy[]>([])
    const [subjectDist, setSubjectDist] = useState<SubjectDist[]>([])

    useEffect(() => {
        if (!userId) return
        const fetchData = async () => {
            setLoading(true)
            try {
                const [userData, statsData, sessionsData, logsData, dailyData, subjectData] = await Promise.all([
                    adminService.getUserById(userId),
                    adminService.getUserStats(userId),
                    adminService.getUserSessions(userId, 50, 0),
                    adminService.getUserActivityLogs(userId, 20),
                    adminAnalyticsService.getDailyStudyTrend({ from: daysAgo(30), to: today() }),
                    adminAnalyticsService.getSubjectDistribution({ from: daysAgo(90), to: today() }),
                ])
                if (userData) {
                    const mappedUser: UserDetailType = {
                        id: userData.id,
                        name: userData.name,
                        email: userData.email,
                        olympiad_id: userData.olympiad_id,
                        created_at: userData.created_at,
                        preferences: userData.preferences,
                        status: userData.status || 'active',
                    }
                    setUser(mappedUser)
                } else {
                    setUser(null)
                }
                setStats(statsData)
                const mappedSessions: SessionDetailType[] = sessionsData.map((s: any) => ({
                    id: s.id,
                    date: s.date,
                    duration_minutes: s.duration_minutes,
                    subjects: s.subjects ? { name: s.subjects.name, color: s.subjects.color } : null,
                }))
                setSessions(mappedSessions)
                setLogs(logsData)
                setDailyStudy(dailyData)
                setSubjectDist(subjectData)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [userId])

    if (loading) {
        return (
            <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
                </div>
                <Skeleton className="h-64 rounded-2xl" />
                <Skeleton className="h-64 rounded-2xl" />
            </div>
        )
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
        )
    }

    return (
        <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6" dir="rtl">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-text-primary">پروفایل کاربر</h1>
                <Link to="/admin/users" className="text-sm text-accent hover:text-accent-hover flex items-center gap-1">
                    <ArrowRight className="w-4 h-4" />
                    بازگشت
                </Link>
            </div>

            {/* User Info */}
            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-6 flex items-center gap-6">
                <Avatar
                    name={user.name}
                    avatarUrl={getAvatarUrl(user.preferences)}
                    fallback={<span>{user.name?.charAt(0) || '?'}</span>}
                    className="w-16 h-16 rounded-full bg-accent text-white text-2xl font-bold"
                />
                <div>
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
                    <p className="text-sm text-text-secondary">جلسات مطالعه</p>
                    <p className="text-2xl font-bold">{toPersianDigits(stats?.totalSessions || 0)}</p>
                </div>
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4">
                    <p className="text-sm text-text-secondary">مدت کل</p>
                    <p className="text-2xl font-bold">{formatMinutes(stats?.totalMinutes || 0)}</p>
                </div>
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4">
                    <p className="text-sm text-text-secondary">آزمون‌ها</p>
                    <p className="text-2xl font-bold">{toPersianDigits(stats?.totalTests || 0)}</p>
                </div>
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4">
                    <p className="text-sm text-text-secondary">میانگین نمره</p>
                    <p className="text-2xl font-bold">{toPersianDigits(Math.round(stats?.avgTestScore || 0))}%</p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-surface-1 rounded-2xl p-6 shadow-card border border-border-subtle">
                    <h3 className="text-sm font-semibold text-text-secondary mb-4">روند مطالعه روزانه</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyStudy}>
                                <defs>
                                    <linearGradient id="userStudyGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => formatMinutes(v)} />
                                <Tooltip formatter={(value: any) => formatMinutes(value)} labelFormatter={(label) => formatDate(label)} />
                                <Area type="monotone" dataKey="minutes" stroke="#6366f1" fill="url(#userStudyGradient)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-surface-1 rounded-2xl p-6 shadow-card border border-border-subtle">
                    <h3 className="text-sm font-semibold text-text-secondary mb-4">توزیع دروس</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={subjectDist}
                                    dataKey="minutes"
                                    nameKey="subject"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={({ name }) => name}
                                >
                                    {subjectDist.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: any) => formatMinutes(value)} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Sessions */}
            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-accent" />
                    آخرین جلسات مطالعه
                </h3>
                {sessions.length === 0 ? (
                    <p className="text-text-tertiary text-sm">هیچ جلسه‌ای ثبت نشده</p>
                ) : (
                    <div className="space-y-2">
                        {sessions.slice(0, 10).map(s => (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-surface-2 rounded-xl border border-border-subtle">
                                <div>
                                    <p className="text-sm font-medium">{s.subjects?.name || 'بدون درس'}</p>
                                    <p className="text-xs text-text-tertiary">{formatDate(s.date)}</p>
                                </div>
                                <span className="font-mono text-sm">{formatMinutes(s.duration_minutes)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Recent Activity */}
            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-accent" />
                    فعالیت‌های اخیر
                </h3>
                {logs.length === 0 ? (
                    <p className="text-text-tertiary text-sm">هیچ فعالیتی ثبت نشده</p>
                ) : (
                    <div className="space-y-2">
                        {logs.map(log => (
                            <div key={log.id} className="flex items-center justify-between p-3 bg-surface-2 rounded-xl border border-border-subtle">
                                <span className="text-sm">{log.action}</span>
                                <span className="text-xs text-text-tertiary">{formatDate(log.created_at)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}