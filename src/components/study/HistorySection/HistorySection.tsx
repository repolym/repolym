// src/components/study/HistorySection/HistorySection.tsx
import React, { useState, useMemo } from 'react';
import { useStudySessions } from '../../../hooks/useStudySessions';
import { Subject } from '../../../types/database';
import { HistoryFilters } from './HistoryFilters';
import { HistoryList } from './HistoryList';
import { daysAgo, today } from '../../../utils/date-utils';

interface Props {
    userId: string | null;
    subjects: Subject[];
}

export const HistorySection: React.FC<Props> = ({ userId, subjects }) => {
    const [filters, setFilters] = useState({
        dateRange: { from: daysAgo(30), to: today() },
        subjectId: null as string | null,
        tags: '',
        search: '',
        sort: 'newest' as 'newest' | 'oldest' | 'longest' | 'shortest',
    });

    // دریافت جلسات بر اساس بازه‌ی تاریخ
    const { data: allSessions, loading, error } = useStudySessions({
        userId,
        dateFrom: filters.dateRange.from,
        dateTo: filters.dateRange.to,
    });

    // اعمال فیلترهای دیگر روی داده‌ها
    const filteredSessions = useMemo(() => {
        let list = [...allSessions];

        // فیلتر بر اساس subject
        if (filters.subjectId) {
            list = list.filter(s => s.subject_id === filters.subjectId);
        }

        // فیلتر بر اساس tags
        if (filters.tags.trim()) {
            const tagQueries = filters.tags.split(',').map(t => t.trim().toLowerCase());
            list = list.filter(s => {
                if (!s.tags) return false;
                const sessionTags = s.tags.split(',').map(t => t.trim().toLowerCase());
                return tagQueries.every(q => sessionTags.some(t => t.includes(q)));
            });
        }

        // جستجو در activities و نام درس
        if (filters.search.trim()) {
            const q = filters.search.trim().toLowerCase();
            list = list.filter(s => {
                const activities = s.activities?.toLowerCase() || '';
                const subjectName = s.subjects?.name?.toLowerCase() || '';
                return activities.includes(q) || subjectName.includes(q);
            });
        }

        // مرتب‌سازی
        switch (filters.sort) {
            case 'newest':
                list.sort((a, b) => b.date.localeCompare(a.date));
                break;
            case 'oldest':
                list.sort((a, b) => a.date.localeCompare(b.date));
                break;
            case 'longest':
                list.sort((a, b) => b.duration_minutes - a.duration_minutes);
                break;
            case 'shortest':
                list.sort((a, b) => a.duration_minutes - b.duration_minutes);
                break;
        }
        return list;
    }, [allSessions, filters]);

    const handleFilterChange = (newFilters: Partial<typeof filters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    // اگر خطایی رخ داده باشد
    if (error) {
        return (
            <div className="text-center py-8 text-red-500">
                خطا در بارگذاری تاریخچه: {error}
                <button
                    onClick={() => window.location.reload()}
                    className="block mx-auto mt-4 text-indigo-600 hover:underline"
                >
                    تلاش مجدد
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <HistoryFilters
                subjects={subjects}
                filters={filters}
                onFilterChange={handleFilterChange}
            />
            <HistoryList sessions={filteredSessions} loading={loading} />
        </div>
    );
};