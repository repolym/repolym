import React from 'react';
import { Input } from '../common/Input';
import { Select } from '../common/Input';
import { AdminFilterState } from '../../types/admin';
import { useOlympiadList } from '../../hooks/useOlympiadList';

interface AdminFiltersProps {
    filters: AdminFilterState;
    onFilterChange: (key: keyof AdminFilterState, value: any) => void;
    onReset: () => void;
}

export const AdminFilters: React.FC<AdminFiltersProps> = ({
    filters,
    onFilterChange,
    onReset,
}) => {
    const { olympiads } = useOlympiadList();

    return (
        <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4 mb-6">
            <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="جستجو..."
                            value={filters.search || ''}
                            onChange={(e) => onFilterChange('search', e.target.value)}
                            className="pr-4"
                        />
                    </div>
                </div>
                <Select
                    value={filters.olympiadId || ''}
                    onChange={(e) => onFilterChange('olympiadId', e.target.value || null)}
                    options={[
                        { value: '', label: 'همه المپیادها' },
                        ...olympiads.map(o => ({ value: o.id, label: o.label })),
                    ]}
                    className="w-44"
                />
                <Select
                    value={filters.riskLevel || ''}
                    onChange={(e) => onFilterChange('riskLevel', e.target.value || null)}
                    options={[
                        { value: '', label: 'همه ریسک‌ها' },
                        { value: 'low', label: 'کم' },
                        { value: 'medium', label: 'متوسط' },
                        { value: 'high', label: 'بالا' },
                        { value: 'critical', label: 'بحرانی' },
                    ]}
                    className="w-36"
                />
                <Select
                    value={filters.status || ''}
                    onChange={(e) => onFilterChange('status', e.target.value || null)}
                    options={[
                        { value: '', label: 'همه وضعیت‌ها' },
                        { value: 'active', label: 'فعال' },
                        { value: 'suspended', label: 'تعلیق' },
                    ]}
                    className="w-36"
                />
                <button
                    onClick={onReset}
                    className="text-xs text-text-secondary hover:text-accent px-3 py-2 rounded-xl border border-border hover:border-accent transition"
                >
                    پاک کردن فیلترها
                </button>
            </div>
        </div>
    );
};