import React, { useState, useMemo } from 'react';
import { useAdminAnalytics } from '../../hooks/useAdminAnalytics';
import { useOlympiadList } from '../../hooks/useOlympiadList';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Activity,
  Clock,
  AlertCircle,
  RefreshCw,
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
  Line,
} from 'recharts';
import { Button } from '../common/Button';
import { Select } from '../common/Input';
import { Skeleton } from '../common/Loading';
import { Link } from 'react-router-dom';
import { OlympiadSelector } from './OlympiadSelector';
import { RiskDistributionCard } from './RiskDistributionCard';
import { OlympiadLeaderboard } from './OlympiadLeaderboard';
import { AnomalyCard } from './AnomalyCard';
import { InsightCard } from './InsightCard';
import { ExportButton } from './ExportButton';

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
  onClick?: () => void;
}> = ({ title, value, icon, color, trend, subtitle, onClick }) => (
  <div
    className={`bg-surface-1 rounded-2xl p-5 shadow-card border border-border-subtle transition-all hover:shadow-md ${onClick ? 'cursor-pointer hover:border-accent' : ''}`}
    onClick={onClick}
  >
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
  const navigate = useNavigate();
  const { olympiads } = useOlympiadList();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedOlympiad, setSelectedOlympiad] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'quarter'>('month');

  const { data: analytics, loading: analyticsLoading, error: analyticsError, refetch } = useAdminAnalytics({
    olympiadId: selectedOlympiad,
    dateRange,
    forceRefresh: refreshKey > 0,
  });

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
      {/* Header with Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">داشبورد مدیریت</h1>
          <p className="text-sm text-text-secondary mt-1">نمای کلی عملکرد دانش‌آموزان و سیستم</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <OlympiadSelector
            value={selectedOlympiad}
            onChange={setSelectedOlympiad}
            olympiads={olympiads}
          />
          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
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
          </Button>
          <ExportButton
            data={analytics}
            label="خروجی"
          />
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
            onClick={() => navigate('/admin/users')}
          />
          <StatCard
            title="میانگین مطالعه روزانه"
            value={formatMinutes(stats.avgStudyMinutes)}
            icon={<Clock className="w-5 h-5" />}
            color="emerald"
            onClick={() => navigate('/admin/analytics')}
          />
          <StatCard
            title="امتیاز ثبات"
            value={`${toPersianDigits(Math.round(stats.consistencyScore))}%`}
            icon={<Activity className="w-5 h-5" />}
            color="amber"
            onClick={() => navigate('/admin/analytics')}
          />
          <StatCard
            title="دانش‌آموزان در معرض خطر"
            value={toPersianDigits(stats.studentsAtRisk)}
            icon={<AlertCircle className="w-5 h-5" />}
            color="rose"
            trend={-5}
            subtitle="کاهش ۵٪ نسبت به هفته قبل"
            onClick={() => navigate('/admin/risk')}
          />
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Trend */}
        <div className="bg-surface-1 rounded-2xl p-6 shadow-card border border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-secondary">روند مطالعه روزانه</h3>
            <Link to="/admin/analytics" className="text-xs text-accent hover:text-accent-hover">
              مشاهده جزئیات
            </Link>
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
                <Line type="monotone" dataKey="average" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Subject Distribution */}
        <div className="bg-surface-1 rounded-2xl p-6 shadow-card border border-border-subtle">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-secondary">توزیع دروس</h3>
            <Link to="/admin/subjects" className="text-xs text-accent hover:text-accent-hover">
              مشاهده جزئیات
            </Link>
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
          olympiads={stats?.topOlympiads || []}
          onOlympiadClick={(olympiad) => navigate(`/admin/olympiads/${olympiad}`)}
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
    </div>
  );
};

export default AdminDashboard;