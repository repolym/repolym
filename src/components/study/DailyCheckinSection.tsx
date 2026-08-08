import React, { useState, useEffect } from 'react';
import { DailyMetric, DailyMetricFormData } from '../../types/analytics';
import { Button } from '../common/Button';
import { Moon, Smartphone, Sun, Upload } from 'lucide-react';
import { calculateSleepHours } from '../../utils/sleep-utils';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../config/supabase';
import { useToast } from '../../context/ToastContext';

interface Props {
    metric: DailyMetric | null;
    onSave: (data: DailyMetricFormData) => Promise<boolean>;
    date: string;
}

export const DailyCheckinSection: React.FC<Props> = ({ metric, onSave, date }) => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [wakeTime, setWakeTime] = useState<string>('');
    const [sleepTime, setSleepTime] = useState<string>('');
    const [phoneMinutes, setPhoneMinutes] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [screenshotFile, setScreenshotFile] = useState<File | null>(null);

    useEffect(() => {
        if (metric) {
            setWakeTime(metric.wake_time || '');
            setSleepTime(metric.bedtime || '');
            setPhoneMinutes(metric.phone_usage_minutes?.toString() ?? '');
        }
    }, [metric]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const sleepHours = calculateSleepHours(sleepTime, wakeTime);
            const payload: DailyMetricFormData = {
                date,
                sleep_hours: sleepHours,
                phone_usage_minutes: phoneMinutes ? parseInt(phoneMinutes) : undefined,
                bedtime: sleepTime || null,
                wake_time: wakeTime || null,
            };
            const ok = await onSave(payload);
            if (!ok) throw new Error('ذخیره متریک روزانه با خطا مواجه شد');

            if (screenshotFile && user) {
                const fileExt = screenshotFile.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('phone_screenshots')
                    .upload(fileName, screenshotFile);
                if (uploadError) throw uploadError;
                const { error: insertError } = await supabase
                    .from('phone_usage_submissions')
                    .insert({
                        user_id: user.id,
                        date: date,
                        reported_minutes: parseInt(phoneMinutes) || 0,
                        screenshot_path: fileName,
                    });
                if (insertError) throw insertError;
                showToast('گزارش استفاده از گوشی با موفقیت ثبت شد', 'success');
                setScreenshotFile(null);
            }
            showToast('وضعیت امروز با موفقیت ذخیره شد. ✅', 'success');
        } catch (error: any) {
            showToast(error.message || 'خطا در ذخیره وضعیت امروز', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-surface-1 rounded-2xl border border-border shadow-sm p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4 flex items-center gap-2">
                <span>چک‌این روزانه</span>
                <span className="text-sm text-text-tertiary font-normal">(پایان روز)</span>
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-2">
                            <Sun className="w-4 h-4 text-amber-500" />
                            ساعت بیداری
                        </label>
                        <input
                            type="time"
                            value={wakeTime}
                            onChange={(e) => setWakeTime(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-surface-2 text-text-primary"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-2">
                            <Moon className="w-4 h-4 text-accent" />
                            ساعت خواب
                        </label>
                        <input
                            type="time"
                            value={sleepTime}
                            onChange={(e) => setSleepTime(e.target.value)}
                            className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-surface-2 text-text-primary"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-2">
                            <Smartphone className="w-4 h-4 text-rose-500" />
                            استفاده از موبایل (دقیقه)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="1440"
                            value={phoneMinutes}
                            onChange={(e) => setPhoneMinutes(e.target.value)}
                            placeholder="مثلاً 120"
                            className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-surface-2 text-text-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-1 flex items-center gap-2">
                            <Upload className="w-4 h-4 text-accent" />
                            عکس صفحه Digital Wellbeing
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setScreenshotFile(e.target.files?.[0] || null)}
                            className="w-full px-3 py-2 border border-border rounded-xl bg-surface-2 text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-accent file:text-white hover:file:bg-accent-hover"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-text-secondary mb-1">یادداشت روزانه (اختیاری)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="هر نکته‌ای که می‌خواهید ثبت کنید..."
                        className="w-full px-3 py-2 border border-border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-surface-2 text-text-primary resize-none"
                    />
                </div>
                <Button type="submit" variant="primary" loading={saving} className="w-full md:w-auto">
                    ذخیره وضعیت امروز
                </Button>
            </form>
        </div>
    );
};