import React, { useState, useMemo } from 'react';
import { useStudySessions } from '../../../hooks/useStudySessions';
import { Subject, StudySession } from '../../../types/database';
import { HistoryFilters } from './HistoryFilters';
import { HistoryList } from './HistoryList';
import { daysAgo, today } from '../../../utils/date-utils';
import { SessionForm } from '../../sessions/SessionForm';
import { useToast } from '../../../context/ToastContext';

interface Props {
    userId: string | null;
    subjects: Subject[];
}

export const HistorySection: React.FC<Props> = ({ userId, subjects }) => {
    const { showToast } = useToast();

    const [filters, setFilters] = useState({
        dateRange: { from: daysAgo(30), to: today() },
        subjectId: null as string | null,
        tags: '',
        search: '',
        sort: 'newest' as 'newest' | 'oldest' | 'longest' | 'shortest',
    });

    const { data: allSessions, loading, error, refetch, updateSession, deleteSession } = useStudySessions({
        userId,
        dateFrom: filters.dateRange.from,
        dateTo: filters.dateRange.to,
        subjectId: filters.subjectId,
    });

    const [editingSession, setEditingSession] = useState<StudySession | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const filteredSessions = useMemo(() => {
        let list = [...allSessions];

        if (filters.tags.trim()) {
            const tagQueries = filters.tags.split(',').map(t => t.trim().toLowerCase());
            list = list.filter(s => {
                if (!s.tags) return false;
                const sessionTags = s.tags.split(',').map(t => t.trim().toLowerCase());
                return tagQueries.every(q => sessionTags.some(t => t.includes(q)));
            });
        }

        if (filters.search.trim()) {
            const q = filters.search.trim().toLowerCase();
            list = list.filter(s => {
                const activities = s.activities?.toLowerCase() || '';
                const subjectName = s.subjects?.name?.toLowerCase() || '';
                return activities.includes(q) || subjectName.includes(q);
            });
        }

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

    const handleEdit = (session: StudySession) => {
        setEditingSession(session);
        setIsFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        const ok = await deleteSession(id);
        if (ok) {
            showToast('جلسه با موفقیت حذف شد', 'success');
            refetch();
        } else {
            showToast('خطا در حذف جلسه', 'error');
        }
    };

    const handleUpdate = async (data: any) => {
        if (!editingSession) return false;
        const ok = await updateSession(editingSession.id, data);
        if (ok) {
            showToast('جلسه با موفقیت به‌روزرسانی شد', 'success');
            setIsFormOpen(false);
            setEditingSession(null);
            refetch();
            return true;
        } else {
            showToast('خطا در به‌روزرسانی جلسه', 'error');
            return false;
        }
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingSession(null);
    };

    if (error) {
        return (
            <div className="text-center py-8 text-red-500">
                خطا در بارگذاری تاریخچه: {error}
                <button
                    onClick={() => window.location.reload()}
                    className="block mx-auto mt-4 text-accent hover:underline"
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
            <HistoryList
                sessions={filteredSessions}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <SessionForm
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                onSubmit={handleUpdate}
                subjects={subjects}
                editing={editingSession}
            />
        </div>
    );
};
