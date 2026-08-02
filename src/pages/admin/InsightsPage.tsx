import React, { useState } from 'react';
import { useCoachInsights } from '../../hooks/useCoachInsights';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Input';
import { Skeleton } from '../../components/common/Loading';
import { RefreshCw, Lightbulb, TrendingUp, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { formatDate } from '../../utils/date-utils';
import { Link } from 'react-router-dom';

const InsightsPage: React.FC = () => {
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'quarter'>('month');
    const [limit] = useState(20);

    const { data: insights, loading, error, refetch } = useCoachInsights({ timeRange, limit });

    const typeIcons = {
        improvement: <TrendingUp className="w-5 h-5 text-emerald-500" />,
        risk: <AlertTriangle className="w-5 h-5 text-red-500" />,
        achievement: <CheckCircle className="w-5 h-5 text-amber-500" />,
        suggestion: <Lightbulb className="w-5 h-5 text-blue-500" />,
        warning: <AlertTriangle className="w-5 h-5 text-orange-500" />,
    };

    const typeLabels = {
        improvement: 'پیشرفت',
        risk: 'خطر',
        achievement: 'دستاورد',
        suggestion: 'پیشنهاد',
        warning: 'هشدار',
    };

    if (loading && !insights) {
        return (
            <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-48" />
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">بینش‌های مربی</h1>
                    <p className="text-sm text-text-secondary mt-1">توصیه‌های هوشمند و تحلیل‌های عملی بر اساس داده‌های واقعی</p>
                </div>
                <div className="flex items-center gap-3">
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
                    <Button variant="secondary" onClick={() => refetch()} loading={loading}>
                        <RefreshCw className="w-4 h-4" />
                        بروزرسانی
                    </Button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-4">
                    {error}
                </div>
            )}

            {insights && insights.length === 0 ? (
                <div className="text-center py-12 text-text-tertiary">هیچ بینشی برای این بازه وجود ندارد</div>
            ) : (
                <div className="space-y-4">
                    {insights?.map((insight) => (
                        <div key={insight.id} className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-5 transition-all hover:shadow-md">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-surface-2 flex items-center justify-center shrink-0">
                                    {typeIcons[insight.type] || <Lightbulb className="w-5 h-5 text-accent" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-bold text-text-primary">{insight.title}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${insight.type === 'risk' || insight.type === 'warning'
                                                ? 'bg-red-100 text-red-700'
                                                : insight.type === 'achievement'
                                                    ? 'bg-amber-100 text-amber-700'
                                                    : insight.type === 'improvement'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {typeLabels[insight.type] || insight.type}
                                        </span>
                                        {insight.studentName && (
                                            <Link to={`/admin/users/${insight.studentId}`} className="text-xs text-accent hover:text-accent-hover">
                                                {insight.studentName}
                                            </Link>
                                        )}
                                    </div>
                                    <p className="text-sm text-text-secondary mt-1">{insight.description}</p>
                                    <div className="mt-2 p-3 bg-accent-muted rounded-xl border border-accent-subtle">
                                        <p className="text-xs text-accent-hover font-medium">پیشنهاد: {insight.recommendation}</p>
                                    </div>
                                    <p className="text-xs text-text-tertiary mt-2">{formatDate(insight.date)}</p>
                                </div>
                                {insight.studentId && (
                                    <Link to={`/admin/users/${insight.studentId}`} className="shrink-0 text-accent hover:text-accent-hover">
                                        <ArrowRight className="w-5 h-5" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default InsightsPage;