import React, { useState, useMemo } from 'react';
import { useAnomalyDetection } from '../../hooks/useAnomalyDetection';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Input';
import { Skeleton } from '../../components/common/Loading';
import { RefreshCw, Search, ArrowRight } from 'lucide-react';
import { formatDate } from '../../utils/date-utils';
import { Link } from 'react-router-dom';

const AnomaliesPage: React.FC = () => {
    const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month' | 'quarter'>('month');
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const limit = 20;

    const { data: anomalies, loading, error, refetch } = useAnomalyDetection({ timeRange, limit: 100 });

    const filtered = useMemo(() => {
        let list = anomalies || [];
        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            list = list.filter(a => a.student.toLowerCase().includes(q) || a.description.toLowerCase().includes(q));
        }
        if (typeFilter !== 'all') {
            list = list.filter(a => a.type === typeFilter);
        }
        if (severityFilter !== 'all') {
            list = list.filter(a => a.severity === severityFilter);
        }
        return list;
    }, [anomalies, searchQuery, typeFilter, severityFilter]);

    const totalPages = Math.ceil(filtered.length / limit);
    const paginated = filtered.slice((page - 1) * limit, page * limit);

    const severityColors = {
        low: 'bg-blue-100 text-blue-700',
        medium: 'bg-amber-100 text-amber-700',
        high: 'bg-red-100 text-red-700',
    };

    const typeLabels: Record<string, string> = {
        drop: 'کاهش مطالعه',
        increase: 'افزایش گوشی',
        inactivity: 'عدم فعالیت',
        sleep: 'اختلال خواب',
        phone: 'استفاده بیش از حد گوشی',
        burnout: 'خطر فرسودگی',
        irregular: 'برنامه نامنظم',
        missing: 'گزارش‌های مفقود',
    };

    if (loading && !anomalies) {
        return (
            <div className="p-6 space-y-4">
                <Skeleton className="h-12 w-48" />
                <Skeleton className="h-12 w-full" />
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto" dir="rtl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">ناهنجاری‌های سیستم</h1>
                    <p className="text-sm text-text-secondary mt-1">تشخیص خودکار رفتارهای غیرعادی و دانش‌آموزان در معرض خطر</p>
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

            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                            <Input
                                type="text"
                                placeholder="جستجو در دانش‌آموز یا توضیحات..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pr-10"
                            />
                        </div>
                    </div>
                    <Select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        options={[
                            { value: 'all', label: 'همه انواع' },
                            ...Object.entries(typeLabels).map(([value, label]) => ({ value, label })),
                        ]}
                        className="w-44"
                    />
                    <Select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        options={[
                            { value: 'all', label: 'همه شدت‌ها' },
                            { value: 'low', label: 'کم' },
                            { value: 'medium', label: 'متوسط' },
                            { value: 'high', label: 'بالا' },
                        ]}
                        className="w-36"
                    />
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 mb-4">
                    {error}
                </div>
            )}

            {filtered.length === 0 ? (
                <div className="text-center py-12 text-text-tertiary">هیچ ناهنجاری با این فیلترها یافت نشد</div>
            ) : (
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-surface-2 text-text-secondary border-b border-border">
                                    <th className="text-right py-3 px-4 font-medium">دانش‌آموز</th>
                                    <th className="text-right py-3 px-4 font-medium">نوع</th>
                                    <th className="text-right py-3 px-4 font-medium">توضیحات</th>
                                    <th className="text-right py-3 px-4 font-medium">شدت</th>
                                    <th className="text-right py-3 px-4 font-medium">تاریخ</th>
                                    <th className="text-right py-3 px-4 font-medium">عملیات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginated.map((anomaly) => (
                                    <tr key={anomaly.id} className="border-b border-border-subtle hover:bg-surface-2/50 transition-colors">
                                        <td className="py-3 px-4 font-medium text-text-primary">{anomaly.student}</td>
                                        <td className="py-3 px-4 text-text-secondary">{typeLabels[anomaly.type] || anomaly.type}</td>
                                        <td className="py-3 px-4 text-text-secondary">{anomaly.description}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityColors[anomaly.severity]}`}>
                                                {anomaly.severity === 'low' ? 'کم' : anomaly.severity === 'medium' ? 'متوسط' : 'بالا'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-text-secondary text-xs">{formatDate(anomaly.date)}</td>
                                        <td className="py-3 px-4">
                                            <Link to={`/admin/users/${anomaly.studentId}`} className="text-accent hover:text-accent-hover text-xs flex items-center gap-1">
                                                مشاهده <ArrowRight className="w-3 h-3" />
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t border-border-subtle">
                            <span className="text-sm text-text-secondary">صفحه {page} از {totalPages}</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                    className="px-3 py-1 rounded-lg border border-border hover:bg-surface-2 disabled:opacity-50"
                                >
                                    قبلی
                                </button>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                    className="px-3 py-1 rounded-lg border border-border hover:bg-surface-2 disabled:opacity-50"
                                >
                                    بعدی
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnomaliesPage;