import React, { useMemo } from 'react';
import { StudySession } from '../../types/database';
import { formatMinutes } from '../../utils/date-utils';
import { toPersianDigits } from '../../utils/jalali';
import { Clock, BookOpen, Zap } from 'lucide-react';
import { Skeleton } from '../common/Loading';

interface Props {
    sessions: StudySession[];
    loading: boolean;
}

export const TodaySummary: React.FC<Props> = ({ sessions, loading }) => {
    const stats = useMemo(() => {
        const totalMinutes = sessions.reduce((acc, s) => acc + s.duration_minutes, 0);
        const sessionCount = sessions.length;
        const avg = sessionCount > 0 ? Math.round(totalMinutes / sessionCount) : 0;
        return { totalMinutes, sessionCount, avg };
    }, [sessions]);

    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-5 border border-accent-subtle shadow-sm">
                <div className="flex items-center gap-3">
                    <Clock className="w-6 h-6 text-accent" />
                    <div>
                        <p className="text-xs text-accent font-medium">زمان مطالعه امروز</p>
                        <p className="text-2xl font-bold text-accent-hover">
                            {formatMinutes(stats.totalMinutes)}
                        </p>
                    </div>
                </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <BookOpen className="w-6 h-6 text-emerald-600" />
                    <div>
                        <p className="text-xs text-emerald-600 font-medium">تعداد جلسات</p>
                        <p className="text-2xl font-bold text-emerald-900">
                            {toPersianDigits(stats.sessionCount)}
                        </p>
                    </div>
                </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-100 shadow-sm">
                <div className="flex items-center gap-3">
                    <Zap className="w-6 h-6 text-amber-600" />
                    <div>
                        <p className="text-xs text-amber-600 font-medium">میانگین مدت</p>
                        <p className="text-2xl font-bold text-amber-900">
                            {stats.sessionCount > 0 ? formatMinutes(stats.avg) : '—'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
