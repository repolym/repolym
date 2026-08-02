import React from 'react';
import { Input } from '../common/Input';
import { Select } from '../common/Input';
import { Button } from '../common/Button';
import { Filter, X } from 'lucide-react';
import { AdminFilters } from '../../types/admin';

interface AdminFiltersProps {
    filters: AdminFilters;
    onFilterChange: (filters: Partial<AdminFilters>) => void;
    onReset: () => void;
    olympiadOptions: { value: string; label: string }[];
}

export const AdminFilters: React.FC<AdminFiltersProps> = ({
    filters,
    onFilterChange,
    onReset,
    olympiadOptions,
}) => {
    return (
        <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-text-secondary" />
                    <span className="text-sm font-medium text-text-secondary">فیلترها</span>
                </div>
                <Button variant="ghost" size="sm" onClick={onReset}>
                    <X className="w-4 h-4" />
                    پاک کردن
                </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select
                    label="المپیاد"
                    value={filters.olympiadId || ''}
                    onChange={(e) => onFilterChange({ olympiadId: e.target.value || null })}
                    options={[
                        { value: '', label: 'همه المپیادها' },
                        ...olympiadOptions,
                    ]}
                />
                <Select
                    label="بازه زمانی"
                    value={filters.dateRange}
                    onChange={(e) => onFilterChange({ dateRange: e.target.value as any })}
                    options={[
                        { value: 'today', label: 'امروز' },
                        { value: 'week', label: 'هفته جاری' },
                        { value: 'month', label: 'ماه جاری' },
                        { value: 'quarter', label: 'سه ماهه' },
                        { value: 'custom', label: 'سفارشی' },
                    ]}
                />
                {filters.dateRange === 'custom' && (
                    <>
                        <Input
                            type="date"
                            label="از تاریخ"
                            value={filters.dateFrom || ''}
                            onChange={(e) => onFilterChange({ dateFrom: e.target.value || null })}
                        />
                        <Input
                            type="date"
                            label="تا تاریخ"
                            value={filters.dateTo || ''}
                            onChange={(e) => onFilterChange({ dateTo: e.target.value || null })}
                        />
                    </>
                )}
                <Select
                    label="وضعیت"
                    value={filters.status}
                    onChange={(e) => onFilterChange({ status: e.target.value as any })}
                    options={[
                        { value: 'all', label: 'همه' },
                        { value: 'active', label: 'فعال' },
                        { value: 'suspended', label: 'تعلیق' },
                    ]}
                />
                <Select
                    label="ریسک"
                    value={filters.riskLevel}
                    onChange={(e) => onFilterChange({ riskLevel: e.target.value as any })}
                    options={[
                        { value: 'all', label: 'همه' },
                        { value: 'low', label: 'کم' },
                        { value: 'medium', label: 'متوسط' },
                        { value: 'high', label: 'بالا' },
                        { value: 'critical', label: 'بحرانی' },
                    ]}
                />
                <div className="md:col-span-2">
                    <Input
                        label="جستجو"
                        type="text"
                        placeholder="جستجو در نام، ایمیل، المپیاد..."
                        value={filters.search}
                        onChange={(e) => onFilterChange({ search: e.target.value })}
                    />
                </div>
            </div>
        </div>
    );
};