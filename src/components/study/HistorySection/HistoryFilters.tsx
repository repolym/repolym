import React from 'react';
import { Button } from '../../common/Button';
import { Input, Select } from '../../common/Input';
import { JalaliDateInput } from '../../common/JalaliDateInput';
import { daysAgo, today } from '../../../utils/date-utils';
import { Subject } from '../../../types/database';

interface Props {
    subjects: Subject[];
    filters: {
        dateRange: { from: string; to: string };
        subjectId: string | null;
        tags: string;
        search: string;
        sort: 'newest' | 'oldest' | 'longest' | 'shortest';
    };
    onFilterChange: (newFilters: Partial<Props['filters']>) => void;
}

export const HistoryFilters: React.FC<Props> = ({ subjects, filters, onFilterChange }) => {
    const setDatePreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
        let from = today();
        let to = today();
        if (preset === 'today') { from = today(); to = today(); }
        else if (preset === 'yesterday') { from = daysAgo(1); to = daysAgo(1); }
        else if (preset === 'week') { from = daysAgo(7); to = today(); }
        else if (preset === 'month') { from = daysAgo(30); to = today(); }
        onFilterChange({ dateRange: { from, to } });
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">بازه زمانی</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        <Button variant="secondary" size="sm" onClick={() => setDatePreset('today')}>امروز</Button>
                        <Button variant="secondary" size="sm" onClick={() => setDatePreset('yesterday')}>دیروز</Button>
                        <Button variant="secondary" size="sm" onClick={() => setDatePreset('week')}>این هفته</Button>
                        <Button variant="secondary" size="sm" onClick={() => setDatePreset('month')}>این ماه</Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <JalaliDateInput
                            value={filters.dateRange.from}
                            onChange={(date) => onFilterChange({ dateRange: { ...filters.dateRange, from: date } })}
                            className="flex-1"
                        />
                        <span className="text-gray-500">تا</span>
                        <JalaliDateInput
                            value={filters.dateRange.to}
                            onChange={(date) => onFilterChange({ dateRange: { ...filters.dateRange, to: date } })}
                            className="flex-1"
                        />
                    </div>
                </div>
                <div>
                    <Select
                        label="درس"
                        value={filters.subjectId || ''}
                        onChange={(e) => onFilterChange({ subjectId: e.target.value || null })}
                        options={[
                            { value: '', label: 'همه دروس' },
                            ...subjects.map(s => ({ value: s.id, label: s.name })),
                        ]}
                    />
                </div>
                <div>
                    <Input
                        label="برچسب‌ها (با کاما جدا کنید)"
                        value={filters.tags}
                        onChange={(e) => onFilterChange({ tags: e.target.value })}
                        placeholder="ریاضی, تست"
                    />
                </div>
                <div className="md:col-span-2">
                    <Input
                        label="جستجو"
                        value={filters.search}
                        onChange={(e) => onFilterChange({ search: e.target.value })}
                        placeholder="جستجو در یادداشت‌ها و نام درس..."
                    />
                </div>
                <div>
                    <Select
                        label="مرتب‌سازی"
                        value={filters.sort}
                        onChange={(e) => onFilterChange({ sort: e.target.value as any })}
                        options={[
                            { value: 'newest', label: 'جدیدترین' },
                            { value: 'oldest', label: 'قدیمی‌ترین' },
                            { value: 'longest', label: 'طولانی‌ترین' },
                            { value: 'shortest', label: 'کوتاه‌ترین' },
                        ]}
                    />
                </div>
            </div>
        </div>
    );
};