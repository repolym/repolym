// src/components/admin/StudentExtraDetails.tsx
// Read-only extra details about one student: streak, tests, goals, plans, todos, baseline survey.
// Used on the user detail page (admin + AI consultant). Access is enforced by database policies.
import React, { useEffect, useState } from 'react';
import { supabase } from '../../config/supabase';
import { formatDate, formatMinutes } from '../../utils/date-utils';
import { toPersianDigits } from '../../utils/jalali';
import { Flame, ClipboardCheck, Target, CalendarDays, CheckSquare, FileQuestion, AlertCircle } from 'lucide-react';

type Tab = 'tests' | 'goals' | 'plans' | 'todos' | 'survey';

const SURVEY_LABELS: Record<string, string> = {
    q1_experience: 'قبلاً چقدر برایت راحت بود که گزارش روزانه‌ات رو ثبت کنی؟',
    q2_feeling: 'بعد از ثبت گزارش روزانه، معمولاً چه حسی داشتی؟',
    q3_distraction: 'وقتی از پیام‌رسون برای گزارش استفاده می‌کردی، معمولاً چی پیش می‌اومد؟',
    q4_access: 'چقدر دسترسی به گزارش‌های قبلی‌ات برات راحت بود؟',
    q5_sleep_consistency: 'برنامه خوابت چقدر منظمه؟',
    q6_open_reflection: 'اگر می‌تونستی یه چیز رو توی سیستم قبلی عوض کنی، چی بود؟',
};

const STATUS_LABELS: Record<string, string> = {
    pending: 'در انتظار',
    in_progress: 'در حال انجام',
    completed: 'انجام شده',
    cancelled: 'لغو شده',
    active: 'فعال',
    archived: 'بایگانی',
};

const PRIORITY_LABELS: Record<string, string> = { low: 'کم', medium: 'متوسط', high: 'زیاد' };
const PERIOD_LABELS: Record<string, string> = { day: 'روزانه', week: 'هفتگی', month: 'ماهانه' };

const num = (n: number | null | undefined) => (n === null || n === undefined ? '—' : toPersianDigits(n));
const dateOrDash = (d: string | null | undefined) => (d ? formatDate(d) : '—');

interface ExtraState {
    streak: any | null;
    tests: any[];
    goals: any[];
    plans: any[];
    todos: any[];
    survey: { answers: Record<string, unknown>; created_at: string } | null;
    failed: string[];
}

const EMPTY: ExtraState = { streak: null, tests: [], goals: [], plans: [], todos: [], survey: null, failed: [] };

export const StudentExtraDetails: React.FC<{ userId: string }> = ({ userId }) => {
    const [data, setData] = useState<ExtraState>(EMPTY);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('tests');

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            const [streakRes, testsRes, goalsRes, plansRes, todosRes, surveyRes] = await Promise.all([
                supabase.from('streaks').select('*').eq('user_id', userId).maybeSingle(),
                supabase.from('tests').select('*, subjects(name, color)').eq('user_id', userId).order('date', { ascending: false }).limit(500),
                supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(200),
                supabase.from('plans').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(200),
                supabase.from('todos').select('*, subjects(name, color)').eq('user_id', userId).order('created_at', { ascending: false }).limit(500),
                supabase.from('baseline_surveys').select('answers, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
            ]);
            if (cancelled) return;

            const failed: string[] = [];
            if (streakRes.error) failed.push('رکورد پیوستگی');
            if (testsRes.error) failed.push('آزمون‌ها');
            if (goalsRes.error) failed.push('اهداف');
            if (plansRes.error) failed.push('برنامه‌ها');
            if (todosRes.error) failed.push('وظایف');
            if (surveyRes.error) failed.push('پرسشنامه');

            setData({
                streak: streakRes.data ?? null,
                tests: testsRes.data ?? [],
                goals: goalsRes.data ?? [],
                plans: plansRes.data ?? [],
                todos: todosRes.data ?? [],
                survey: (surveyRes.data && surveyRes.data[0]) || null,
                failed,
            });
            setLoading(false);
        };
        load();
        return () => { cancelled = true; };
    }, [userId]);

    if (loading) {
        return <div className="text-sm text-text-tertiary">در حال بارگذاری جزئیات بیشتر...</div>;
    }

    const avgScore = data.tests.length
        ? data.tests.reduce((sum, t) => sum + (t.score / (t.max_score || 100)) * 100, 0) / data.tests.length
        : 0;

    const tabs: { id: Tab; label: string; count?: number; icon: React.ReactNode }[] = [
        { id: 'tests', label: 'آزمون‌ها', count: data.tests.length, icon: <ClipboardCheck className="w-4 h-4" /> },
        { id: 'goals', label: 'اهداف', count: data.goals.length, icon: <Target className="w-4 h-4" /> },
        { id: 'plans', label: 'برنامه‌ها', count: data.plans.length, icon: <CalendarDays className="w-4 h-4" /> },
        { id: 'todos', label: 'وظایف', count: data.todos.length, icon: <CheckSquare className="w-4 h-4" /> },
        { id: 'survey', label: 'پرسشنامه', icon: <FileQuestion className="w-4 h-4" /> },
    ];

    return (
        <div className="space-y-4">
            {data.failed.length > 0 && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>بخشی از اطلاعات بارگذاری نشد: {data.failed.join('، ')}. اگر مایگریشن دسترسی مشاور اجرا نشده، آن را اجرا کنید.</span>
                </div>
            )}

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4">
                    <p className="text-sm text-text-secondary flex items-center gap-1"><Flame className="w-4 h-4 text-orange-500" /> پیوستگی فعلی</p>
                    <p className="text-2xl font-bold">{num(data.streak?.current_streak ?? 0)} <span className="text-sm font-normal">روز</span></p>
                </div>
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4">
                    <p className="text-sm text-text-secondary">بیشترین پیوستگی</p>
                    <p className="text-2xl font-bold">{num(data.streak?.longest_streak ?? 0)} <span className="text-sm font-normal">روز</span></p>
                </div>
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4">
                    <p className="text-sm text-text-secondary">تعداد آزمون‌ها</p>
                    <p className="text-2xl font-bold">{num(data.tests.length)}</p>
                </div>
                <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle p-4">
                    <p className="text-sm text-text-secondary">میانگین نمره آزمون‌ها</p>
                    <p className="text-2xl font-bold">{data.tests.length ? `${toPersianDigits(Math.round(avgScore))}٪` : '—'}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-surface-1 rounded-2xl shadow-card border border-border-subtle overflow-hidden">
                <div className="flex gap-1 bg-surface-3 p-1 m-3 rounded-xl overflow-x-auto">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${tab === t.id
                                ? 'bg-surface-1 text-accent shadow-sm'
                                : 'text-text-secondary hover:text-text-primary'}`}
                        >
                            {t.icon}
                            {t.label}
                            {t.count !== undefined && <span className="text-text-tertiary">({toPersianDigits(t.count)})</span>}
                        </button>
                    ))}
                </div>

                <div className="overflow-x-auto">
                    {tab === 'tests' && (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-surface-2 text-text-secondary border-b border-border">
                                    <th className="text-right py-3 px-4 font-medium">تاریخ</th>
                                    <th className="text-right py-3 px-4 font-medium">نام آزمون</th>
                                    <th className="text-right py-3 px-4 font-medium">درس</th>
                                    <th className="text-right py-3 px-4 font-medium">نمره</th>
                                    <th className="text-right py-3 px-4 font-medium">درست / غلط / نزده</th>
                                    <th className="text-right py-3 px-4 font-medium">میانگین زمان هر سؤال</th>
                                    <th className="text-right py-3 px-4 font-medium">یادداشت</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.tests.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-text-tertiary">آزمونی ثبت نشده است</td></tr>
                                ) : data.tests.map(t => (
                                    <tr key={t.id} className="border-b border-border-subtle hover:bg-surface-2/50">
                                        <td className="py-3 px-4 text-xs whitespace-nowrap">{dateOrDash(t.date)}</td>
                                        <td className="py-3 px-4">{t.name}</td>
                                        <td className="py-3 px-4 text-xs">{t.subjects?.name || '—'}</td>
                                        <td className="py-3 px-4 whitespace-nowrap font-mono">
                                            {num(t.score)} / {num(t.max_score)}
                                            <span className="text-text-tertiary text-xs mr-1">
                                                ({toPersianDigits(Math.round((t.score / (t.max_score || 100)) * 100))}٪)
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                                            {num(t.correct_count)} / {num(t.wrong_count)} / {num(t.skipped_count)}
                                        </td>
                                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                                            {t.avg_time_seconds ? `${toPersianDigits(Math.round(t.avg_time_seconds))} ثانیه` : '—'}
                                        </td>
                                        <td className="py-3 px-4 text-xs max-w-xs">{t.notes || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {tab === 'goals' && (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-surface-2 text-text-secondary border-b border-border">
                                    <th className="text-right py-3 px-4 font-medium">عنوان</th>
                                    <th className="text-right py-3 px-4 font-medium">هدف</th>
                                    <th className="text-right py-3 px-4 font-medium">دوره</th>
                                    <th className="text-right py-3 px-4 font-medium">شروع</th>
                                    <th className="text-right py-3 px-4 font-medium">پایان</th>
                                    <th className="text-right py-3 px-4 font-medium">وضعیت</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.goals.length === 0 ? (
                                    <tr><td colSpan={6} className="text-center py-8 text-text-tertiary">هدفی ثبت نشده است</td></tr>
                                ) : data.goals.map(g => (
                                    <tr key={g.id} className="border-b border-border-subtle hover:bg-surface-2/50">
                                        <td className="py-3 px-4">{g.title}</td>
                                        <td className="py-3 px-4 whitespace-nowrap">{formatMinutes(g.target_minutes)}</td>
                                        <td className="py-3 px-4 text-xs">{PERIOD_LABELS[g.period] || g.period}</td>
                                        <td className="py-3 px-4 text-xs whitespace-nowrap">{dateOrDash(g.start_date)}</td>
                                        <td className="py-3 px-4 text-xs whitespace-nowrap">{dateOrDash(g.end_date)}</td>
                                        <td className="py-3 px-4 text-xs">{STATUS_LABELS[g.status] || g.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {tab === 'plans' && (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-surface-2 text-text-secondary border-b border-border">
                                    <th className="text-right py-3 px-4 font-medium">عنوان</th>
                                    <th className="text-right py-3 px-4 font-medium">اولویت</th>
                                    <th className="text-right py-3 px-4 font-medium">پیشرفت</th>
                                    <th className="text-right py-3 px-4 font-medium">وضعیت</th>
                                    <th className="text-right py-3 px-4 font-medium">شروع</th>
                                    <th className="text-right py-3 px-4 font-medium">مهلت</th>
                                    <th className="text-right py-3 px-4 font-medium">زمان تخمینی</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.plans.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-text-tertiary">برنامه‌ای ثبت نشده است</td></tr>
                                ) : data.plans.map(p => (
                                    <tr key={p.id} className="border-b border-border-subtle hover:bg-surface-2/50">
                                        <td className="py-3 px-4">
                                            {p.title}
                                            {p.description && <p className="text-xs text-text-tertiary max-w-xs truncate">{p.description}</p>}
                                        </td>
                                        <td className="py-3 px-4 text-xs">{PRIORITY_LABELS[p.priority] || p.priority}</td>
                                        <td className="py-3 px-4 text-xs">{num(p.progress)}٪</td>
                                        <td className="py-3 px-4 text-xs">{STATUS_LABELS[p.status] || p.status}</td>
                                        <td className="py-3 px-4 text-xs whitespace-nowrap">{dateOrDash(p.start_date)}</td>
                                        <td className="py-3 px-4 text-xs whitespace-nowrap">{dateOrDash(p.due_date || p.end_date)}</td>
                                        <td className="py-3 px-4 text-xs whitespace-nowrap">{p.estimated_duration ? formatMinutes(p.estimated_duration) : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {tab === 'todos' && (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-surface-2 text-text-secondary border-b border-border">
                                    <th className="text-right py-3 px-4 font-medium">عنوان</th>
                                    <th className="text-right py-3 px-4 font-medium">درس</th>
                                    <th className="text-right py-3 px-4 font-medium">اولویت</th>
                                    <th className="text-right py-3 px-4 font-medium">وضعیت</th>
                                    <th className="text-right py-3 px-4 font-medium">مهلت</th>
                                    <th className="text-right py-3 px-4 font-medium">تخمین / واقعی</th>
                                    <th className="text-right py-3 px-4 font-medium">تعداد سؤال</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.todos.length === 0 ? (
                                    <tr><td colSpan={7} className="text-center py-8 text-text-tertiary">وظیفه‌ای ثبت نشده است</td></tr>
                                ) : data.todos.map(t => (
                                    <tr key={t.id} className="border-b border-border-subtle hover:bg-surface-2/50">
                                        <td className="py-3 px-4">
                                            {t.title}
                                            {t.study_resource && <p className="text-xs text-text-tertiary">{t.study_resource}</p>}
                                        </td>
                                        <td className="py-3 px-4 text-xs">{t.subjects?.name || '—'}</td>
                                        <td className="py-3 px-4 text-xs">{PRIORITY_LABELS[t.priority] || t.priority}</td>
                                        <td className="py-3 px-4 text-xs">{STATUS_LABELS[t.status] || t.status}</td>
                                        <td className="py-3 px-4 text-xs whitespace-nowrap">{dateOrDash(t.deadline)}</td>
                                        <td className="py-3 px-4 text-xs whitespace-nowrap">
                                            {t.estimated_time ? formatMinutes(t.estimated_time) : '—'} / {t.actual_time ? formatMinutes(t.actual_time) : '—'}
                                        </td>
                                        <td className="py-3 px-4 text-xs">{num(t.question_count)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {tab === 'survey' && (
                        <div className="p-4 space-y-3">
                            {!data.survey ? (
                                <p className="text-center py-4 text-text-tertiary text-sm">پرسشنامه‌ای ثبت نشده است</p>
                            ) : (
                                <>
                                    <p className="text-xs text-text-tertiary">ثبت‌شده در {dateOrDash(data.survey.created_at)}</p>
                                    {Object.entries(data.survey.answers || {}).map(([key, value]) => (
                                        <div key={key} className="bg-surface-2 rounded-xl p-3">
                                            <p className="text-xs text-text-tertiary mb-1">{SURVEY_LABELS[key] || key}</p>
                                            <p className="text-sm text-text-primary">
                                                {value === null || value === '' ? '—' : String(value)}
                                            </p>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentExtraDetails;
