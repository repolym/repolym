import React, { useState, useEffect } from 'react';
import { DailyMetric, DailyMetricFormData } from '../../types/analytics';
import { Button } from '../common/Button';
import { Moon, Smartphone, Sun } from 'lucide-react';
import { calculateSleepHours } from '../../utils/sleep-utils';

interface Props {
    metric: DailyMetric | null;
    onSave: (data: DailyMetricFormData) => Promise<boolean>;
    date: string;
}

export const DailyCheckinSection: React.FC<Props> = ({ metric, onSave, date }) => {
    const [wakeTime, setWakeTime] = useState<string>('');
    const [sleepTime, setSleepTime] = useState<string>('');
    const [phoneMinutes, setPhoneMinutes] = useState<string>('');
    const [notes, setNotes] = useState<string>('');
    const [saving, setSaving] = useState(false);

    // بارگذاری داده‌های موجود
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
            // محاسبه خودکار ساعت خواب از روی زمان‌ها
            const sleepHours = calculateSleepHours(sleepTime, wakeTime);

            const payload: DailyMetricFormData = {
                date,
                sleep_hours: sleepHours,
                phone_usage_minutes: phoneMinutes ? parseInt(phoneMinutes) : undefined,
                bedtime: sleepTime || null,
                wake_time: wakeTime || null,
            };
            const ok = await onSave(payload);
            if (ok) {
                // (اختیاری) پاک کردن فرم بعد از ذخیره موفق
                // setWakeTime(''); setSleepTime(''); setPhoneMinutes(''); setNotes('');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>چک‌این روزانه</span>
                <span className="text-sm text-gray-400 font-normal">(پایان روز)</span>
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Sun className="w-4 h-4 text-amber-500" />
                            ساعت بیداری
                        </label>
                        <input
                            type="time"
                            value={wakeTime}
                            onChange={(e) => setWakeTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Moon className="w-4 h-4 text-indigo-500" />
                            ساعت خواب
                        </label>
                        <input
                            type="time"
                            value={sleepTime}
                            onChange={(e) => setSleepTime(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
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
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        {/* فضای خالی برای هم‌ترازی */}
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">یادداشت روزانه (اختیاری)</label>
                    <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        placeholder="هر نکته‌ای که می‌خواهید ثبت کنید..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                </div>
                <Button type="submit" variant="primary" loading={saving} className="w-full md:w-auto">
                    ذخیره وضعیت امروز
                </Button>
            </form>
        </div>
    );
};