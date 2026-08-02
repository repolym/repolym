import React, { useState, useMemo } from 'react';
import { useAdminAnalytics } from '../../hooks/useAdminAnalytics';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { useAnomalyDetection } from '../../hooks/useAnomalyDetection';
import { useCoachInsights } from '../../hooks/useCoachInsights';
import {
  Users,
  Activity,
  Clock,
  AlertCircle,
  ChevronRight,
  Download,
  RefreshCw,
  Brain,
} from 'lucide-react';
import { formatDate, formatMinutes } from '../../utils/date-utils';
import { toPersianDigits } from '../../utils/jalali';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Button } from '../common/Button';
import { Select } from '../common/Input';
import { Skeleton } from '../common/Loading';
import { Link } from 'react-router-dom';

// Types
interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  totalTests: number;
  avgStudyMinutes: number;
  consistencyScore: number;
  recoveryScore: number;
  riskScore: number;
  studentsAtRisk: number;
  topOlympiads: { olympiad: string; count: number }[];
  recentActivity: { action: string; user: string; time: string }[];
}

// ---------- Helper Components ----------
const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  trend?: number;
  subtitle?: string;
}> = ({ title, value, icon, color, trend, subtitle }) => (
  <div className="bg-surface-1 rounded-2xl p-5 shadow-card border border-border-subtle transition-all hover:shadow-md">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-text-secondary">{title}</span>
      <div className={`p-2 rounded-xl bg-${color}-50 text-${color}-600`}>{icon}</div>
    </div>
    <div className="flex items-end justify-between">
      <span className="text-2xl font-bold text-text-primary">{value}</span>
      {trend !== undefined && (
        <span className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </span>
      )}
    </div>
    {subtitle && <p className="text-xs text-text-tertiary mt-1">{subtitle}</p>}
  </div>
);

// ---------- Main Dashboard ----------
export const AdminDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'quarter'>('month');
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: analytics, loading: analyticsLoading, error: analyticsError, refetch } = useAdminAnalytics({
    timeRange,
    forceRefresh: refreshKey > 0,
  });

  useLeaderboard({
    olympiadId: null,
    window: 'month',
    limit: 10,
  });

  const { data: anomalies, loading: anomaliesLoading } = useAnomalyDetection({ timeRange });
  const { data: insights, loading: insightsLoading } = useCoachInsights({ timeRange });

  const handleRefresh = () => {
    setRefreshKey((k) => k + 1);
    refetch();
  };

  // Statistics computation
  const stats = useMemo<Stats | null>(() => {
    if (!analytics) return null;
    return {
      totalUsers: analytics.totalUsers,
      activeUsers: analytics.activeUsers,
      totalSessions: analytics.totalSessions,
      totalTests: analytics.totalTests,
      avgStudyMinutes: analytics.avgStudyMinutes,
      consistencyScore: analytics.consistencyScore,
      recoveryScore: analytics.recoveryScore,
      riskScore: analytics.riskScore,
      studentsAtRisk: analytics.studentsAtRisk,
      topOlympiads: analytics.topOlympiads || [],
      recentActivity: analytics.recentActivity || [],
    };
  }, [analytics]);

  if (analyticsLoading && !analytics) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
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
          <h1 className="text-2xl font-bold text-text-primary">داشبورد مدیریت</h1>
          <p className="text-sm text-text-secondary mt-1">نمای کلی عملکرد دانش‌آموزان و سیستم</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            options={[
              { value: 'today', label: 'امروز' },
              { value: 'week', label: 'هفته جاری' },
              { value: 'month', label: 'ماه جاری' },
              { value: 'quarter', label: 'سه ماهه' },
            ]}
            className="w-40"
          />
          <Button variant="secondary" onClick={handleRefresh} loading={analyticsLoading}>
            <RefreshCw className="w-4 h-4" />
            بروزرسانی
          </Button>
          <Button variant="primary">
            <Download className="w-4 h-4" />
            خروجی
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="کاربران فعال"
            value={toPersianDigits(stats.activeUsers)}
            icon={<Users className="w-5 h-5" />}
            color="indigo"
            subtitle={`از ${toPersianDigits(stats.totalUsers)} کل`}
          />
          <StatCard
            title="میانگین مطالعه روزانه"
            value={formatMinutes(stats.avgStudyMinutes)}
            icon={<Clock className="w-5 h-5" />}
            color="emerald"
          />
          <StatCard
            title="امتیاز ثبات"
            value={`${toPersianDigits(Math.round(stats.consistencyScore))}%`}
            icon={<Activity className="w-5 h-5" />}
            color="amber"
          />
          <StatCard
            title="دانش‌آموزان در معرض خطر"
            value={toPersianDigits(stats.studentsAtRisk)}
            icon={<AlertCircle className="w-5 h-5" />}
            color="rose"
            trend={-5}
            subtitle="کاهش ۵٪ نسبت به هفته قبل"
          />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Trend */}
        <div className="bg-surface-1 rounded-2xl p-6 shadow-card border border-border-subtle">
          <h3 className="text-sm font-semibold text-text-secondary mb-4">روند مطالعه روزانه</h3>
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
          <h3 className="text-sm font-semibold text-text-secondary mb-4">توزیع دروس</h3>
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
        {/* Risk Score Distribution */}
        <div className="bg-surface-1 rounded-2xl p-6 shadow-card border border-border-subtle">
          <h3 className="text-sm font-semibold text-text-secondary mb-4">توزیع ریسک</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.riskDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="riskLevel" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Olympiads */}
        <div className="bg-surface-1 rounded-2xl p-6 shadow-card border border-border-subtle">
          <h3 className="text-sm font-semibold text-text-secondary mb-4">المپیادهای برتر</h3>
          <div className="space-y-2">
            {stats?.topOlympiads.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 hover:bg-surface-2 rounded-lg transition-colors">
                <span className="text-sm font-medium text-text-primary">{item.olympiad}</span>
                <span className="text-sm text-text-secondary">{toPersianDigits(item.count)} دانش‌آموز</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Anomalies & Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface-1 rounded-2xl p-6 shadow-card border border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-secondary">ناهنجاری‌های اخیر</h3>
            <Link to="/admin/anomalies" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1">
              مشاهده همه <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {anomaliesLoading ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="space-y-2">
              {(anomalies || []).slice(0, 3).map((anomaly, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-surface-2 rounded-xl border border-border-subtle">
                  <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{anomaly.student}</p>
                    <p className="text-xs text-text-secondary">{anomaly.description}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{formatDate(anomaly.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-surface-1 rounded-2xl p-6 shadow-card border border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-secondary">بینش‌های مربی</h3>
            <Link to="/admin/insights" className="text-xs text-accent hover:text-accent-hover flex items-center gap-1">
              مشاهده همه <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {insightsLoading ? (
            <Skeleton className="h-20" />
          ) : (
            <div className="space-y-2">
              {(insights || []).slice(0, 3).map((insight, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-surface-2 rounded-xl border border-border-subtle">
                  <div className="w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center text-accent shrink-0">
                    <Brain className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text-primary">{insight.title}</p>
                    <p className="text-xs text-text-secondary">{insight.description}</p>
                    <p className="text-xs text-text-tertiary mt-0.5">{insight.recommendation}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;