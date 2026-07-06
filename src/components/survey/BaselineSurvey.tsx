import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

// ---------- FULL SURVEY ----------
const questions = [
    {
        id: 'q1_experience',
        label: 'قبلاً چقدر برایت راحت بود که گزارش روزانه‌ات رو ثبت کنی؟',
        options: ['خیلی راحت', 'راحت', 'معمولی', 'سخت', 'خیلی سخت'],
    },
    {
        id: 'q2_feeling',
        label: 'بعد از ثبت گزارش روزانه، معمولاً چه حسی داشتی؟',
        options: ['احساس نظم و برنامه داشتم', 'پیشرفتم رو واضح می‌دیدم', 'فقط چون مجبور بودم انجامش می‌دادم', 'حس نمی‌کردم بهم کمک می‌کنه'],
    },
    {
        id: 'q3_distraction',
        label: 'وقتی از پیام‌رسون برای گزارش استفاده می‌کردی، معمولاً چی پیش می‌اومد؟',
        options: ['فقط گزارش رو می‌دادم و می‌رفتم', 'کمی می‌موندم و پیام‌ها رو چک می‌کردم', 'اغلب حواسم پرت می‌شد', 'تمرکزم رو از دست می‌دادم و وقت زیادی تلف می‌کردم'],
    },
    {
        id: 'q4_access',
        label: 'چقدر دسترسی به گزارش‌های قبلی‌ات برات راحت بود؟',
        options: ['خیلی راحت', 'راحت', 'سخت', 'خیلی سخت / تقریباً غیرممکن'],
    },
    {
        id: 'q5_sleep_consistency',
        label: 'برنامه خوابت چقدر منظمه؟',
        options: ['خیلی منظم', 'تا حد زیادی منظم', 'گاهی منظم', 'منظم نیست', 'خیلی نامنظم'],
    },
    {
        id: 'q6_open_reflection',
        label: 'اگر می‌تونستی یه چیز رو توی سیستم قبلی عوض کنی، چی بود؟',
        isText: true,
        placeholder: 'نظرت رو بنویس (اختیاری)',
    },
]

const BaselineSurvey: React.FC = () => {
    const { completeBaselineSurvey } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()

    const [step, setStep] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const currentQ = questions[step]
    const isLast = step === questions.length - 1
    const progress = ((step + 1) / questions.length) * 100

    const handleSelect = (value: string) => {
        if (loading) return
        setAnswers(prev => ({ ...prev, [currentQ.id]: value }))
        if (isLast) {
            setTimeout(() => handleSubmit(), 350)
        } else {
            setTimeout(() => setStep(prev => Math.min(prev + 1, questions.length - 1)), 350)
        }
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))
    }

    const handleSubmit = async () => {
        const required = questions.filter(q => !q.isText)
        const allAnswered = required.every(q => answers[q.id] && answers[q.id].trim() !== '')
        if (!allAnswered) {
            showToast('لطفاً به همه سوالات پاسخ دهید', 'error')
            return
        }

        setLoading(true)
        setError(null)
        try {
            const payload = {
                q1_experience: answers.q1_experience as any,
                q2_feeling: answers.q2_feeling as any,
                q3_distraction: answers.q3_distraction as any,
                q4_access: answers.q4_access as any,
                q5_sleep_consistency: answers.q5_sleep_consistency as any,
                q6_open_reflection: answers.q6_open_reflection || null,
            }
            await completeBaselineSurvey(payload)
            showToast('ثبت شد! به داشبورد می‌روید 🎉', 'success')
            navigate('/dashboard', { replace: true })
        } catch (err: any) {
            setError(err.message || 'خطا در ثبت')
            showToast(err.message || 'خطا', 'error')
        } finally {
            setLoading(false)
        }
    }

    const goBack = () => {
        if (step > 0) setStep(prev => prev - 1)
    }

    // Render
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-6 md:p-10">
                {/* Progress */}
                <div className="flex items-center gap-4 mb-6">
                    <span className="text-sm text-gray-400 font-medium">
                        سوال {step + 1} از {questions.length}
                    </span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="text-sm text-gray-400 font-medium">{Math.round(progress)}%</span>
                </div>

                {/* Question */}
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{currentQ.label}</h2>

                {currentQ.isText ? (
                    <textarea
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all resize-none text-lg"
                        rows={4}
                        placeholder={currentQ.placeholder}
                        value={answers[currentQ.id] || ''}
                        onChange={handleTextChange}
                    />
                ) : (
                    <div className="space-y-3">
                        {/* TypeScript fix: ensure options is defined before mapping */}
                        {currentQ.options && currentQ.options.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => handleSelect(opt)}
                                className="w-full text-right px-5 py-4 border-2 border-gray-200 rounded-2xl hover:border-indigo-400 hover:bg-indigo-50 transition-all text-base font-medium"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                    <button
                        onClick={goBack}
                        disabled={step === 0}
                        className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${step === 0
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        ← قبلی
                    </button>

                    {isLast ? (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-70"
                        >
                            {loading ? 'در حال ثبت...' : 'ثبت و رفتن به داشبورد 🚀'}
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                if (!currentQ.isText && !answers[currentQ.id]) return
                                setStep(prev => Math.min(prev + 1, questions.length - 1))
                            }}
                            disabled={!currentQ.isText && !answers[currentQ.id]}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all disabled:opacity-50"
                        >
                            بعدی →
                        </button>
                    )}
                </div>

                {isLast && (
                    <p className="text-center text-gray-400 text-sm mt-4">
                        سوال آخر اختیاری است، می‌توانی خالی بگذاری
                    </p>
                )}
            </div>
        </div>
    )
}

export default BaselineSurvey