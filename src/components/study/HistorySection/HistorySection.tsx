import React, { useState, useMemo, useEffect } from 'react';
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

    const { data: allSessions, loading, refetch } = useStudySessions({
        userId,
        dateFrom: filters.dateRange.from,
        dateTo: filters.dateRange.to,
    });

    // Apply client‑side filtering
    const filteredSessions = useMemo(() => {
        let list = [...allSessions];
        // Subject filter
        if (filters.subjectId) {
            list = list.filter(s => s.subject_id === filters.subjectId);
        }
        // Tags filter (simple substring)
        if (filters.tags.trim()) {
            const tagQueries = filters.tags.split(',').map(t => t.trim().toLowerCase());
            list = list.filter(s => {
                if (!s.tags) return false;
                const sessionTags = s.tags.split(',').map(t => t.trim().toLowerCase());
                return tagQueries.every(q => sessionTags.some(t => t.includes(q)));
            });
        }
        // Search in notes and subject name
        if (filters.search.trim()) {
            const q = filters.search.trim().toLowerCase();
            list = list.filter(s => {
                const notes = s.notes?.toLowerCase() || '';
                const subjectName = s.subjects?.name?.toLowerCase() || '';
                return notes.includes(q) || subjectName.includes(q);
            });
        }
        // Sort
        switch (filters.sort) {
            case 'newest': list.sort((a, b) => b.date.localeCompare(a.date)); break;
            case 'oldest': list.sort((a, b) => a.date.localeCompare(b.date)); break;
            case 'longest': list.sort((a, b) => b.duration_minutes - a.duration_minutes); break;
            case 'shortest': list.sort((a, b) => a.duration_minutes - b.duration_minutes); break;
        }
        return list;
    }, [allSessions, filters]);

    const handleFilterChange = (newFilters: Partial<typeof filters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    };

    // Refetch when date range changes
    useEffect(() => {
        refetch();
    }, [filters.dateRange, refetch]);

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