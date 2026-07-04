// src/components/DailyCheckIn.tsx
import React, { useState, useEffect } from 'react';
import { useDailyMetrics } from '../hooks/useDailyMetrics';
import { Moon, PhoneOff, CheckCircle, Save, Loader2 } from 'lucide-react';
import { Button } from './common/Button';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { today } from '../utils/date-utils';

export default function DailyCheckIn() {
    const { user } = useAuth();
    const todayStr = today();
    const { data, loading, logDailyMetric } = useDailyMetrics({
        userId: user?.id ?? null,
        dateFrom: todayStr,
        dateTo: todayStr,
    });
    const [sleepHours, setSleepHours] = useState<string>('');
    const [mobileUsage, setMobileUsage] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    const metrics = data?.[0] || null;

    useEffect(() => {
        if (metrics) {
            setSleepHours(metrics.sleep_hours?.toString() || '');
            setMobileUsage(metrics.phone_usage_minutes?.toString() || '');
        }
    }, [metrics]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await logDailyMetric({
                date: todayStr,
                sleep_hours: sleepHours ? parseFloat(sleepHours) : undefined,
                phone_usage_minutes: mobileUsage ? parseInt(mobileUsage) : undefined,
            });
            showToast('وضعیت امروز با موفقیت ذخیره شد. ✅', 'success');
        } catch (error: any) {
            showToast(error.message || 'خطا در ذخیره وضعیت امروز', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex justify-center items-center h-48">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 dir-rtl text-right">
            <div className="flex items-center gap-2 mb-5 border-b border-slate-50 pb-3">
                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                    <CheckCircle size={20} />
                </div>
                <div>
                    <h2 className="font-bold text-slate-800 text-lg">چک‌این امروز</h2>
                    <p className="text-xs text-slate-400 mt-0.5">وضعیت سلامتی و تمرکز خود را ثبت کنید</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Moon size={16} className="text-indigo-500" />
                        ساعت خواب
                    </label>
                    <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        placeholder="مثلاً 7.5"
                        value={sleepHours}
                        onChange={(e) => setSleepHours(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <PhoneOff size={16} className="text-indigo-500" />
                        استفاده از موبایل (دقیقه)
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="1440"
                        placeholder="مثلاً 120"
                        value={mobileUsage}
                        onChange={(e) => setMobileUsage(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-left focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
                    />
                </div>

                <Button
                    type="submit"
                    disabled={saving}
                    className="w-full justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm shadow-indigo-100"
                >
                    {saving ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            در حال ذخیره...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            ذخیره وضعیت امروز
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}

