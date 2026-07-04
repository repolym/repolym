import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useNavigate } from 'react-router-dom'
import type { BaselineSurveyAnswers } from '../../types/database'

// ---------- Loader ----------
const Loader = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
)

// ---------- Intro Page ----------
const IntroPage: React.FC<{ onStart: () => void }> = ({ onStart }) => (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-lg w-full bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-10 border border-white/50 text-center">
            <div className="text-5xl mb-4">🧭</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">خوش آمدید به رپولیم</h1>
            <p className="text-gray-500 text-base mb-6">قبل از شروع، یک پرسشنامه کوتاه پر کن.</p>

            <div className="text-right text-gray-700 space-y-3 text-sm leading-relaxed">
                <p className="font-semibold text-indigo-700">چرا این پرسشنامه مهمه؟</p>
                <p>
                    این پرسشنامه به ما کمک می‌کنه تا <strong>عادت‌های فعلی</strong> تو رو بهتر درک کنیم
                    و در آینده <strong>پیشرفت واقعی</strong> رو بر اساس همون بسنجیم.
                </p>
                <p>
                    اطلاعاتت کاملاً <strong>محفوظ</strong> می‌مونه و فقط برای بهبود تجربه‌ات استفاده می‌شه.
                    هیچ قضاوتی در کار نیست – فقط می‌خواهیم مسیر بهتری برات بسازیم.
                </p>
                <ul className="space-y-1 text-sm">
                    <li>✅ فقط <strong>یک بار</strong> پر می‌شه</li>
                    <li>⏱️ کمتر از <strong>۲ دقیقه</strong> وقت می‌گیره</li>
                    <li>🔒 داده‌هات <strong>امن</strong> و خصوصی هستن</li>
                </ul>
                <p className="text-gray-400 text-xs mt-2">لطفاً با دقت بخون و بعد شروع کن.</p>
            </div>

            <button
                onClick={onStart}
                className="mt-8 w-full sm:w-auto px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:scale-105 active:scale-95"
            >
                متوجه شدم، شروع کنم
            </button>
        </div>
    </div>
)

// ---------- Survey Questions ----------
const questions = [
    {
        id: 'q1_experience',
        question: 'قبلاً چقدر برایت راحت بود که گزارش روزانه‌ات رو ثبت کنی؟',
        options: ['خیلی راحت', 'راحت', 'معمولی', 'سخت', 'خیلی سخت'],
    },
    {
        id: 'q2_feeling',
        question: 'بعد از ثبت گزارش روزانه، معمولاً چه حسی داشتی؟',
        options: ['احساس نظم و برنامه داشتم', 'پیشرفتم رو واضح می‌دیدم', 'فقط چون مجبور بودم انجامش می‌دادم', 'حس نمی‌کردم بهم کمک می‌کنه'],
    },
    {
        id: 'q3_distraction',
        question: 'وقتی از پیام‌رسون برای گزارش استفاده می‌کردی، معمولاً چی پیش می‌اومد؟',
        options: ['فقط گزارش رو می‌دادم و می‌رفتم', 'کمی می‌موندم و پیام‌ها رو چک می‌کردم', 'اغلب حواسم پرت می‌شد', 'تمرکزم رو از دست می‌دادم و وقت زیادی تلف می‌کردم'],
    },
    {
        id: 'q4_access',
        question: 'چقدر دسترسی به گزارش‌های قبلی‌ات برات راحت بود؟',
        options: ['خیلی راحت', 'راحت', 'سخت', 'خیلی سخت / تقریباً غیرممکن'],
    },
    {
        id: 'q5_sleep_consistency',
        question: 'برنامه خوابت چقدر منظمه؟',
        options: ['خیلی منظم', 'تا حد زیادی منظم', 'گاهی منظم', 'منظم نیست', 'خیلی نامنظم'],
    },
    {
        id: 'q6_open_reflection',
        question: 'اگر می‌تونستی یه چیز رو توی سیستم قبلی عوض کنی، چی بود؟',
        isText: true,
        placeholder: 'نظرت رو بنویس (اختیاری)',
    },
]

// ---------- Main Component ----------
const BaselineSurvey: React.FC = () => {
    const { user, completeBaselineSurvey, isLoading: authLoading } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()

    const [introSeen, setIntroSeen] = useState(() => {
        return sessionStorage.getItem('baseline_intro_seen') === 'true'
    })
    const [currentStep, setCurrentStep] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Redirects
    useEffect(() => {
        if (authLoading) return
        if (!user) {
            navigate('/login', { replace: true })
            return
        }
        if (!user.onboarding_completed) {
            navigate('/dashboard', { replace: true })
            return
        }
        if (user.has_completed_baseline_survey) {
            navigate('/dashboard', { replace: true })
            return
        }
    }, [user, authLoading, navigate])

    const handleIntroStart = () => {
        sessionStorage.setItem('baseline_intro_seen', 'true')
        setIntroSeen(true)
    }

    // Survey handlers
    const currentQ = questions[currentStep]
    const isLast = currentStep === questions.length - 1
    const progress = ((currentStep + 1) / questions.length) * 100

    const handleSelect = (value: string) => {
        setAnswers(prev => ({ ...prev, [currentQ.id]: value }))
        if (isLast) {
            setTimeout(() => handleSubmit(), 350)
        } else {
            setTimeout(() => setCurrentStep(prev => prev + 1), 350)
        }
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))
    }

    const goBack = () => {
        if (currentStep > 0) setCurrentStep(prev => prev - 1)
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
            const payload: BaselineSurveyAnswers = {
                q1_experience: answers.q1_experience as any,
                q2_feeling: answers.q2_feeling as any,
                q3_distraction: answers.q3_distraction as any,
                q4_access: answers.q4_access as any,
                q5_sleep_consistency: answers.q5_sleep_consistency as any,
                q6_open_reflection: answers.q6_open_reflection || null,
            }
            await completeBaselineSurvey(payload)
            showToast('ثبت شد! به داشبورد خوش آمدید 🎉', 'success')
            navigate('/dashboard', { replace: true })
        } catch (err: any) {
            const msg = err.message || 'خطا در ثبت اطلاعات'
            setError(msg)
            showToast(msg, 'error')
        } finally {
            setLoading(false)
        }
    }

    // Render
    if (authLoading) return <Loader />
    if (!user || !user.onboarding_completed || user.has_completed_baseline_survey) return null

    if (!introSeen) {
        return <IntroPage onStart={handleIntroStart} />
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-2xl bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-10 border border-white/50 transition-all">
                {/* Progress */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <span className="text-sm text-gray-400 font-medium">
                        سوال {currentStep + 1} از {questions.length}
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
                <div className="mb-8">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-snug">
                        {currentQ.question}
                    </h2>
                </div>

                {/* Options */}
                {currentQ.isText ? (
                    <textarea
                        className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all resize-none text-lg"
                        rows={4}
                        placeholder={currentQ.placeholder}
                        value={answers[currentQ.id] || ''}
                        onChange={handleTextChange}
                    />
                ) : (
                    <div className="grid grid-cols-1 gap-3">
                        {currentQ.options?.map((opt) => {
                            const selected = answers[currentQ.id] === opt
                            return (
                                <button
                                    key={opt}
                                    onClick={() => handleSelect(opt)}
                                    className={`w-full text-right px-5 py-4 rounded-2xl border-2 transition-all duration-200 text-base ${selected
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-800 shadow-md shadow-indigo-100/50'
                                        : 'border-gray-200 hover:border-indigo-300 bg-white text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    <span className="flex items-center justify-between">
                                        <span>{opt}</span>
                                        {selected && (
                                            <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs">
                                                ✓
                                            </span>
                                        )}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm">
                        {error}
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                    <button
                        onClick={goBack}
                        disabled={currentStep === 0}
                        className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${currentStep === 0
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                            }`}
                    >
                        ← قبلی
                    </button>

                    {isLast ? (
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-70 disabled:scale-100"
                        >
                            {loading ? 'در حال ثبت...' : 'ثبت و رفتن به داشبورد 🚀'}
                        </button>
                    ) : (
                        <button
                            onClick={() => {
                                if (!currentQ.isText && !answers[currentQ.id]) return
                                setCurrentStep(prev => prev + 1)
                            }}
                            disabled={!currentQ.isText && !answers[currentQ.id]}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100"
                        >
                            بعدی →
                        </button>
                    )}
                </div>

                {/* Optional hint */}
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