import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { useNavigate } from 'react-router-dom'
import type { BaselineSurveyAnswers } from '../../types/database'
import { Button } from '../common/Button'

interface Question {
    id: keyof BaselineSurveyAnswers
    question: string
    type: 'single' | 'text'
    options?: { value: string; label: string }[]
    placeholder?: string
}

const questions: Question[] = [
    {
        id: 'q1_experience',
        question: 'قبلاً چقدر برایت راحت بود که گزارش روزانه‌ات رو ثبت کنی؟',
        type: 'single',
        options: [
            { value: 'very_easy', label: 'خیلی راحت' },
            { value: 'easy', label: 'راحت' },
            { value: 'normal', label: 'معمولی' },
            { value: 'hard', label: 'سخت' },
            { value: 'very_hard', label: 'خیلی سخت' },
        ],
    },
    {
        id: 'q2_feeling',
        question: 'بعد از ثبت گزارش روزانه، معمولاً چه حسی داشتی؟',
        type: 'single',
        options: [
            { value: 'organized', label: 'احساس نظم و برنامه داشتم' },
            { value: 'clear_progress', label: 'پیشرفتم رو واضح می‌دیدم' },
            { value: 'just_because', label: 'فقط چون مجبور بودم انجامش می‌دادم' },
            { value: 'not_helpful', label: 'حس نمی‌کردم بهم کمک می‌کنه' },
        ],
    },
    {
        id: 'q3_distraction',
        question: 'وقتی از پیام‌رسون برای گزارش استفاده می‌کردی، معمولاً چی پیش می‌اومد؟',
        type: 'single',
        options: [
            { value: 'only_report', label: 'فقط گزارش رو می‌دادم و می‌رفتم' },
            { value: 'check_messages', label: 'کمی می‌موندم و پیام‌ها رو چک می‌کردم' },
            { value: 'distracted', label: 'اغلب حواسم پرت می‌شد' },
            { value: 'lost_focus', label: 'تمرکزم رو از دست می‌دادم و وقت زیادی تلف می‌کردم' },
        ],
    },
    {
        id: 'q4_access',
        question: 'چقدر دسترسی به گزارش‌های قبلی‌ات برات راحت بود؟',
        type: 'single',
        options: [
            { value: 'very_easy', label: 'خیلی راحت' },
            { value: 'easy', label: 'راحت' },
            { value: 'difficult', label: 'سخت' },
            { value: 'very_difficult', label: 'خیلی سخت / تقریباً غیرممکن' },
        ],
    },
    {
        id: 'q5_sleep_consistency',
        question: 'برنامه خوابت چقدر منظمه؟',
        type: 'single',
        options: [
            { value: 'very_consistent', label: 'خیلی منظم' },
            { value: 'mostly_consistent', label: 'تا حد زیادی منظم' },
            { value: 'sometimes_consistent', label: 'گاهی منظم' },
            { value: 'not_consistent', label: 'منظم نیست' },
            { value: 'very_irregular', label: 'خیلی نامنظم' },
        ],
    },
    {
        id: 'q6_open_reflection',
        question: 'اگر می‌تونستی یه چیز رو توی سیستم قبلی عوض کنی، چی بود؟',
        type: 'text',
        placeholder: 'نظرت رو بنویس (اختیاری)',
    },
]

const BaselineSurvey: React.FC = () => {
    const { completeBaselineSurvey } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()

    const [currentStep, setCurrentStep] = useState(0)
    const [answers, setAnswers] = useState<Partial<BaselineSurveyAnswers>>({})
    const [loading, setLoading] = useState(false)
    const [direction, setDirection] = useState(1)

    const isLast = currentStep === questions.length - 1
    const currentQ = questions[currentStep]

    const handleSelect = (value: string) => {
        setAnswers(prev => ({ ...prev, [currentQ.id]: value }))
        if (currentQ.type === 'single') {
            setTimeout(() => {
                if (isLast) {
                    handleSubmit()
                } else {
                    goNext()
                }
            }, 300)
        }
    }

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setAnswers(prev => ({ ...prev, [currentQ.id]: e.target.value }))
    }

    const goNext = () => {
        if (!answers[currentQ.id] && currentQ.type === 'single') return
        setDirection(1)
        setCurrentStep(prev => prev + 1)
    }

    const goBack = () => {
        setDirection(-1)
        setCurrentStep(prev => prev - 1)
    }

    const handleSubmit = async () => {
        const required = questions.filter(q => q.type === 'single')
        const allAnswered = required.every(q => answers[q.id] !== undefined)
        if (!allAnswered) {
            showToast('لطفاً به همه سوالات پاسخ دهید', 'error')
            return
        }

        setLoading(true)
        try {
            await completeBaselineSurvey(answers as BaselineSurveyAnswers)
            showToast('ثبت شد! به داشبورد خوش آمدید 🎉', 'success')
            navigate('/dashboard', { replace: true })
        } catch (err) {
            showToast('خطا در ثبت اطلاعات، لطفاً دوباره تلاش کنید', 'error')
        } finally {
            setLoading(false)
        }
    }

    const progress = ((currentStep + 1) / questions.length) * 100

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4" dir="rtl">
            <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/50">
                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-gray-200 rounded-full mb-8 overflow-hidden">
                    <motion.div
                        className="h-full bg-indigo-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.4 }}
                    />
                </div>

                {/* Step Indicator */}
                <div className="flex justify-between items-center mb-8">
                    <span className="text-sm text-gray-400">
                        سوال {currentStep + 1} از {questions.length}
                    </span>
                    <span className="text-xs text-gray-400">
                        {Math.round(progress)}٪
                    </span>
                </div>

                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        initial={{ opacity: 0, x: direction > 0 ? 30 : -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction > 0 ? -30 : 30 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-6"
                    >
                        <h2 className="text-2xl font-bold text-gray-800">
                            {currentQ.question}
                        </h2>

                        {currentQ.type === 'single' && currentQ.options && (
                            <div className="space-y-3">
                                {currentQ.options.map(opt => {
                                    const selected = answers[currentQ.id] === opt.value
                                    return (
                                        <button
                                            key={opt.value}
                                            onClick={() => handleSelect(opt.value)}
                                            className={`w-full text-right px-5 py-4 rounded-2xl border-2 transition-all ${selected
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-800 shadow-md'
                                                : 'border-gray-200 hover:border-indigo-300 bg-white text-gray-700'
                                                }`}
                                        >
                                            {opt.label}
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {currentQ.type === 'text' && (
                            <textarea
                                className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none h-32"
                                placeholder={currentQ.placeholder}
                                value={(answers[currentQ.id] as string) || ''}
                                onChange={handleTextChange}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-4 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        onClick={goBack}
                        disabled={currentStep === 0}
                        className="text-sm"
                    >
                        قبلی
                    </Button>

                    {isLast ? (
                        <Button
                            variant="primary"
                            loading={loading}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            ثبت و رفتن به داشبورد
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={goNext}
                            disabled={currentQ.type === 'single' && !answers[currentQ.id]}
                        >
                            بعدی
                        </Button>
                    )}
                </div>

                {currentQ.id === 'q6_open_reflection' && (
                    <p className="text-xs text-gray-400 mt-3 text-center">
                        این سوال اختیاری است، می‌توانی خالی بگذاری
                    </p>
                )}
            </div>
        </div>
    )
}

export default BaselineSurvey