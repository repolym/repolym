import React, { useState } from 'react';
import { StudySession } from '../../../types/database';
import { SessionCard } from '../../sessions/SessionCard';
import { Button } from '../../common/Button';
import { toPersianDigits } from '../../../utils/jalali';

interface Props {
    sessions: StudySession[];
    loading: boolean;
}

const PAGE_SIZE = 20;

export const HistoryList: React.FC<Props> = ({ sessions, loading }) => {
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    const visibleSessions = sessions.slice(0, visibleCount);
    const hasMore = visibleCount < sessions.length;

    const loadMore = () => setVisibleCount(prev => prev + PAGE_SIZE);

    if (loading) {
        return <div className="text-center py-8 text-text-tertiary">در حال بارگذاری...</div>;
    }

    if (sessions.length === 0) {
        return <div className="text-center py-8 text-text-tertiary">هیچ جلسه‌ای با این فیلترها یافت نشد.</div>;
    }

    return (
        <div>
            <div className="text-sm text-text-secondary mb-4">
                {toPersianDigits(sessions.length)} جلسه یافت شد
            </div>
            <div className="space-y-1">
                {visibleSessions.map((s) => (
                    // src/components/study/HistorySection/HistoryList.tsx (line ~41)
                    <SessionCard
                        key={s.id}
                        session={s}
                        onEdit={() => { }}
                        onDelete={async () => { }}   // ✅ returns Promise<void>
                    />
                ))}
            </div>
            {hasMore && (
                <div className="mt-4 text-center">
                    <Button variant="secondary" onClick={loadMore}>
                        نمایش بیشتر ({toPersianDigits(sessions.length - visibleCount)} باقی‌مانده)
                    </Button>
                </div>
            )}
        </div>
    );
};
