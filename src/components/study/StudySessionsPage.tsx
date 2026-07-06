import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useStudySessions } from '../../hooks/useStudySessions';
import { useDailyMetrics } from '../../hooks/useDailyMetrics';
import { useSubjects } from '../../hooks/useSubjects';
import { useToast } from '../../context/ToastContext';
import { SessionForm } from '../sessions/SessionForm';
import { SessionCard } from '../sessions/SessionCard';
import { TodaySummary } from './TodaySummary';
import { DailyCheckinSection } from './DailyCheckinSection';
import { HistorySection } from './HistorySection/HistorySection';
import { Button } from '../common/Button';
import { Tabs, TabList, Tab, TabPanels, TabPanel } from '../common/Tabs';
import { today } from '../../utils/date-utils';

export const StudySessionsPage: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingSession, setEditingSession] = useState<any>(null);

    const todayStr = today();

    // Today's sessions
    const {
        data: todaySessions,
        loading: todayLoading,
        refetch: refetchToday,
        createSession,
        updateSession,
        deleteSession,
    } = useStudySessions({
        userId: user?.id ?? null,
        dateFrom: todayStr,
        dateTo: todayStr,
    });

    // Daily metrics for today
    const { data: dailyMetrics, logDailyMetric } = useDailyMetrics({
        userId: user?.id ?? null,
        dateFrom: todayStr,
        dateTo: todayStr,
    });
    const todayMetric = dailyMetrics[0] || null;

    // Subjects
    const { data: subjects } = useSubjects(user?.id ?? null);

    // Handlers
    const handleCreate = async (data: any) => {
        const ok = await createSession({ ...data, date: todayStr });
        if (ok) {
            showToast('جلسه با موفقیت ثبت شد', 'success');
            refetchToday();
        }
        return ok;
    };

    const handleUpdate = async (data: any) => {
        if (!editingSession) return false;
        const ok = await updateSession(editingSession.id, data);
        if (ok) {
            showToast('جلسه به‌روزرسانی شد', 'success');
            setEditingSession(null);
            refetchToday();
        }
        return ok;
    };

    const handleDelete = async (id: string) => {
        await deleteSession(id);
        showToast('جلسه حذف شد', 'success');
        refetchToday();
    };

    const openEdit = (session: any) => {
        setEditingSession(session);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingSession(null);
    };

    return (
        <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-6" dir="rtl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">مطالعات من</h1>
                    <p className="text-text-secondary text-sm mt-1">ثبت و مدیریت جلسات مطالعه روزانه</p>
                </div>
                <Button variant="primary" onClick={() => setIsFormOpen(true)}>
                    <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    ثبت جلسه جدید
                </Button>
            </div>

            {/* Tabs: Today | History */}
            <Tabs defaultIndex={0}>
                <TabList>
                    <Tab>امروز</Tab>
                    <Tab>تاریخچه</Tab>
                </TabList>
                <TabPanels>
                    <TabPanel>
                        {/* Today's Summary */}
                        <TodaySummary sessions={todaySessions} loading={todayLoading} />

                        {/* Today's Sessions List */}
                        <div className="bg-surface-1 rounded-2xl border border-border shadow-sm p-6 mt-6">
                            <h2 className="text-lg font-bold text-text-primary mb-4">جلسات امروز</h2>
                            {todayLoading ? (
                                <div className="text-center py-8 text-text-tertiary">در حال بارگذاری...</div>
                            ) : todaySessions.length === 0 ? (
                                <div className="text-center py-8 text-text-tertiary">
                                    امروز هنوز جلسه‌ای ثبت نشده است.
                                    <Button variant="secondary" className="mt-3" onClick={() => setIsFormOpen(true)}>
                                        ثبت اولین جلسه امروز
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {todaySessions.map((s) => (
                                        <SessionCard
                                            key={s.id}
                                            session={s}
                                            onEdit={openEdit}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Daily Check-in Section */}
                        <div className="mt-6">
                            <DailyCheckinSection
                                metric={todayMetric}
                                onSave={logDailyMetric}
                                date={todayStr}
                            />
                        </div>
                    </TabPanel>

                    <TabPanel>
                        <HistorySection userId={user?.id ?? null} subjects={subjects} />
                    </TabPanel>
                </TabPanels>
            </Tabs>

            {/* Session Form Modal */}
            <SessionForm
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                onSubmit={editingSession ? handleUpdate : handleCreate}
                subjects={subjects}
                editing={editingSession}
            />
        </div>
    );
};
