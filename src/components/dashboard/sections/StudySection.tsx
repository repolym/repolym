import StudySessions from '../../StudySessions';
import DailyCheckIn from '../../DailyCheckIn';
import { useStudySessions } from '../../../hooks/useStudySessions';
import { useAuth } from '../../../context/AuthContext';
import { Trash2, BookOpen } from 'lucide-react';

export default function StudySection() {
    const { user } = useAuth();
    // ✅ اصلاح: ارسال null به جای رشته خالی
    const { data: sessions, deleteSession } = useStudySessions({ userId: user?.id ?? null });

    return (
        <div className="space-y-6 dir-rtl text-right">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <DailyCheckIn />
                </div>
                <div className="lg:col-span-2">
                    <StudySessions />
                </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                        <BookOpen size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-base">تاریخچه مطالعات امروز</h3>
                        <p className="text-xs text-slate-400 mt-0.5">لیست تمام پارت‌های مطالعی که ثبت کرده‌اید</p>
                    </div>
                </div>

                {sessions && sessions.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        هنوز هیچ جلسه مطالعه‌ای برای امروز ثبت نشده است. ماراتن امروز را شروع کنید! 🚀
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 rounded-xl">
                                <tr>
                                    <th scope="col" className="px-4 py-3 rounded-r-xl">نام درس</th>
                                    <th scope="col" className="px-4 py-3">زمان (دقیقه)</th>
                                    <th scope="col" className="px-4 py-3">یادداشت</th>
                                    <th scope="col" className="px-4 py-3">زمان ثبت</th>
                                    <th scope="col" className="px-4 py-3 rounded-l-xl text-center">عملیات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {sessions?.map((session: any) => (
                                    <tr key={session.id} className="bg-white hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3.5 font-semibold text-slate-800">
                                            {session.subjects?.name || 'درس نامشخص'}
                                        </td>
                                        {/* ✅ اصلاح: استفاده از duration_minutes */}
                                        <td className="px-4 py-3.5 font-mono text-emerald-600 font-bold">
                                            {session.duration_minutes}
                                        </td>
                                        {/* ✅ اصلاح: استفاده از notes */}
                                        <td className="px-4 py-3.5 text-slate-400 max-w-xs truncate">
                                            {session.notes || '—'}
                                        </td>
                                        <td className="px-4 py-3.5 text-slate-400 text-xs">
                                            {new Date(session.created_at).toLocaleTimeString('fa-IR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </td>
                                        <td className="px-4 py-3.5 text-center">
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('آیا از حذف این جلسه مطالعه مطمئن هستید؟')) {
                                                        deleteSession(session.id);
                                                    }
                                                }}
                                                className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
