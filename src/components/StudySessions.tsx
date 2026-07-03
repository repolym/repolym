import React, { useState } from 'react';
import { useStudySessions } from '../hooks/useStudySessions';
import { useSubjects } from '../hooks/useSubjects';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Clock, FileText, PlusCircle, Loader2 } from 'lucide-react';
import { Button } from './common/Button';
import { useToast } from '../context/ToastContext';
import { today } from '../utils/date-utils';

export default function StudySessions() {
    const { user } = useAuth();

    const { createSession } = useStudySessions({ userId: user?.id || '' });
    const { data: subjects } = useSubjects(user?.id || '');

    const { showToast } = useToast();

    const [subjectId, setSubjectId] = useState('');
    const [duration, setDuration] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!subjectId || !duration) {
            showToast('لطفاً فیلدهای اجباری را تکمیل کنید.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            await createSession({
                subject_id: subjectId,
                date: today(),
                duration_minutes: parseInt(duration, 10),
                notes: description.trim() || '',
            });

            showToast('جلسه مطالعه با موفقیت ثبت شد. 📚', 'success');
            setSubjectId('');
            setDuration('');
            setDescription('');
        } catch (error: any) {
            showToast(error.message || 'خطا در ثبت جلسه مطالعه', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 dir-rtl text-right">
            <div className="flex items-center gap-2 mb-5 border-b border-slate-50 pb-3">
                <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                    <BookOpen size={20} />
                </div>
                <div>
                    <h2 className="font-bold text-slate-800 text-lg">ثبت جلسه مطالعه جدید</h2>
                    <p className="text-xs text-slate-400 mt-0.5">ساعات تلاش و مطالعه خود را با دقت وارد کنید</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <BookOpen size={16} className="text-emerald-500" />
                        انتخاب درس / مبحث <span className="text-rose-500">*</span>
                    </label>
                    <select
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
                        required
                    >
                        <option value="">-- انتخاب کنید --</option>
                        {subjects?.map((sub: any) => (
                            <option key={sub.id} value={sub.id}>
                                {sub.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Clock size={16} className="text-emerald-500" />
                        مدت زمان مطالعه (دقیقه) <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="number"
                        min="1"
                        placeholder="مثلاً 90"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-left focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <FileText size={16} className="text-emerald-500" />
                        توضیحات یا یادداشت (اختیاری)
                    </label>
                    <textarea
                        placeholder="تعداد تست، مباحث پوشش داده شده و..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-700 h-20 resize-none"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm shadow-emerald-100"
                >
                    {isSubmitting ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            در حال ثبت...
                        </>
                    ) : (
                        <>
                            <PlusCircle size={18} />
                            ثبت جلسه مطالعه
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}
