
import React, { useEffect, useState } from 'react'
import { Moon, Smartphone, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useDailyMetrics } from '../../hooks/useDailyMetrics'
import { useToast } from '../../context/ToastContext'
import { today } from '../../utils/date-utils'

export const DailyCheckInCard: React.FC = () => {
    const { user } = useAuth()
    const { showToast } = useToast()
    const todayStr = today()
    const { data, logDailyMetric } = useDailyMetrics({ userId: user?.id ?? null, dateFrom: todayStr, dateTo: todayStr })
    const existing = data.find((d) => d.date === todayStr) ?? null

    const [sleepHours, setSleepHours] = useState('')
    const [phoneMinutes, setPhoneMinutes] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (existing) {
            setSleepHours(existing.sleep_hours != null ? String(existing.sleep_hours) : '')
            setPhoneMinutes(existing.phone_usage_minutes != null ? String(existing.phone_usage_minutes) : '')
        }
    }, [existing])

    const handleSave = async () => {
        const sleep = sleepHours.trim() ? Number(sleepHours) : null
        const phone = phoneMinutes.trim() ? Number(phoneMinutes) : null

        if (sleep !== null && (Number.isNaN(sleep) || sleep < 0 || sleep > 24)) {
            showToast('ساعت خواب باید بین ۰ تا ۲۴ باشد', 'error')
            return
        }
        if (phone !== null && (Number.isNaN(phone) || phone < 0 || phone > 1440)) {
            showToast('زمان استفاده از موبایل نامعتبر است', 'error')
            return
        }

        setSaving(true)
        const ok = await logDailyMetric({ date: todayStr, sleep_hours: sleep, phone_usage_minutes: phone })
        setSaving(false)

        if (ok) {
            showToast('وضعیت امروز ثبت شد', 'success')
        } else {
            showToast('ثبت وضعیت امروز با خطا مواجه شد', 'error')
        }
    }

    return (
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100" dir="rtl">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">چک‌این امروز</h3>
                {existing && (
                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        ثبت شده
                    </span>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label htmlFor="checkin-sleep" className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                        <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                        ساعت خواب
                    </label>
                    <input
                        id="checkin-sleep"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={24}
                        step={0.5}
                        value={sleepHours}
                        onChange={(e) => setSleepHours(e.target.value)}
                        placeholder="مثلاً ۷"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                </div>
                <div>
                    <label htmlFor="checkin-phone" className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                        <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                        استفاده از موبایل (دقیقه)
                    </label>
                    <input
                        id="checkin-phone"
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={1440}
                        step={5}
                        value={phoneMinutes}
                        onChange={(e) => setPhoneMinutes(e.target.value)}
                        placeholder="مثلاً ۹۰"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                aria-busy={saving}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium py-2.5 rounded-xl transition-all disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
            >
                {saving ? 'در حال ذخیره...' : 'ذخیره وضعیت امروز'}
            </button>
        </div>
    )
}
