import React, { useState, useEffect } from 'react'
import { supabase } from '../../config/supabase'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../utils/date-utils'
import { toPersianDigits } from '../../utils/jalali'
import { Button } from '../common/Button'

interface Submission {
    id: string
    date: string
    reported_minutes: number
    screenshot_path: string
    status: 'pending' | 'approved' | 'rejected'
    admin_note: string | null
    created_at: string
}

export const PhoneUsageSubmissions: React.FC<{ userId: string }> = ({ userId }) => {
    const { showToast } = useToast()
    const [submissions, setSubmissions] = useState<Submission[]>([])
    const [loading, setLoading] = useState(true)

    const fetchSubmissions = async () => {
        const { data, error } = await supabase
            .from('phone_usage_submissions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
        if (error) {
            showToast('خطا در دریافت داده', 'error')
        } else {
            setSubmissions(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchSubmissions()
    }, [userId])

    const handleReview = async (submissionId: string, status: 'approved' | 'rejected', note: string) => {
        const { error } = await supabase
            .from('phone_usage_submissions')
            .update({ status, admin_note: note, reviewed_at: new Date().toISOString() })
            .eq('id', submissionId)
        if (error) {
            showToast('خطا', 'error')
        } else {
            showToast('وضعیت به‌روز شد', 'success')
            fetchSubmissions()
        }
    }

    const getScreenshotUrl = (path: string) => {
        const { data } = supabase.storage.from('phone_screenshots').getPublicUrl(path)
        return data.publicUrl
    }

    if (loading) return <div className="text-sm text-text-tertiary">در حال بارگذاری...</div>

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">گزارش‌های استفاده از گوشی</h3>
            {submissions.length === 0 ? (
                <p className="text-sm text-text-tertiary">هیچ گزارشی ثبت نشده است.</p>
            ) : (
                <div className="space-y-4">
                    {submissions.map((sub) => (
                        <div key={sub.id} className="bg-surface-2 rounded-xl p-4 border border-border">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                                <div>
                                    <p className="text-sm font-medium">{formatDate(sub.date)}</p>
                                    <p className="text-sm text-text-secondary">گزارش شده: {toPersianDigits(sub.reported_minutes)} دقیقه</p>
                                    <p className="text-xs text-text-tertiary">وضعیت: {sub.status === 'pending' ? 'در انتظار بررسی' : sub.status === 'approved' ? 'تأیید شده' : 'رد شده'}</p>
                                    {sub.admin_note && <p className="text-xs text-text-secondary">یادداشت: {sub.admin_note}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <img src={getScreenshotUrl(sub.screenshot_path)} alt="گزارش" className="h-12 w-12 object-cover rounded" />
                                    {sub.status === 'pending' && (
                                        <>
                                            <Button variant="primary" size="sm" onClick={() => handleReview(sub.id, 'approved', '')}>تأیید</Button>
                                            <Button variant="danger" size="sm" onClick={() => {
                                                const note = window.prompt('دلیل رد:') || ''
                                                handleReview(sub.id, 'rejected', note)
                                            }}>رد</Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}