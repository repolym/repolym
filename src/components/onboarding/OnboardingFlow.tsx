import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import { ChevronLeft, SkipForward, Sparkles } from 'lucide-react'
import { PageLoader } from '../common/Loading'

interface OnboardingCard {
    id: string
    icon: React.ReactNode
    title: string
    description: string
    illustration: 'hero' | 'focus' | 'progress' | 'analytics' | 'privacy' | 'survey' | 'success'
}

const CARDS: OnboardingCard[] = [
    {
        id: 'welcome',
        icon: <Sparkles className="w-12 h-12 text-accent" />,
        title: 'به Repolym خوش آمدید 👋',
        description: 'فضای شخصی شما برای مطالعه، پیگیری پیشرفت و ساختن عادت‌های بهتر.',
        illustration: 'hero',
    },
    {
        id: 'focus',
        icon: (
            <svg className="w-12 h-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        title: 'بدون حواس‌پرتی مطالعه کن',
        description: 'دیگر خبری از چت‌های بی‌پایان، گزارش‌های گم‌شده و اسکرول بی‌مورد نیست. فقط تمرکز روی یادگیری.',
        illustration: 'focus',
    },
    {
        id: 'progress',
        icon: (
            <svg className="w-12 h-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        title: 'پیشرفتت را ببین',
        description: 'هر جلسه‌ی مطالعه، بخشی از مسیر شخصی تو می‌شود. ثبات خود را درک کن، نه اینکه فقط حدس بزنی.',
        illustration: 'progress',
    },
    {
        id: 'analytics',
        icon: (
            <svg className="w-12 h-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
        ),
        title: 'خودت را بهتر بشناس',
        description: 'الگوهای عادت‌های مطالعتی خود را کشف کن. ببین چگونه ثبات، خواب و استفاده از گوشی بر یادگیری‌ات تأثیر می‌گذارد.',
        illustration: 'analytics',
    },
    {
        id: 'privacy',
        icon: (
            <svg className="w-12 h-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        title: 'داده‌های تو متعلق به خودت است',
        description: 'اطلاعات تو فقط برای تولید بینش‌های شخصی مفید استفاده می‌شود. Repolym ساخته شده تا عادت‌های مطالعه را بهبود بخشد، نه برای نظارت بر دانش‌آموزان.',
        illustration: 'privacy',
    },
    {
        id: 'survey',
        icon: (
            <svg className="w-12 h-12 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
        ),
        title: 'یک مرحلهٔ آخر',
        description: 'به چند سؤال سریع پاسخ بده تا Repolym بتواند نقطهٔ شروع تو را بهتر درک کند. این نظرسنجی فقط یک بار انجام می‌شود و کمتر از یک دقیقه وقت می‌گیرد.',
        illustration: 'survey',
    },
]

// ---------- Individual Card ----------
const OnboardingCardComponent: React.FC<{
    card: OnboardingCard
    progress: number
    total: number
    onNext: () => void
    onSkip: () => void
    onPrevious: () => void
    isFirst: boolean
    isLast: boolean
}> = ({ card, progress, total, onNext, onSkip, onPrevious, isFirst, isLast }) => {
    const renderIllustration = (type: string) => {
        switch (type) {
            case 'hero':
                return (
                    <div className="w-full max-w-xs mx-auto aspect-square bg-gradient-to-br from-indigo-100 to-purple-100 rounded-3xl flex items-center justify-center">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full bg-accent/20 flex items-center justify-center">
                                <Sparkles className="w-16 h-16 text-accent" />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400/30 animate-pulse" />
                            <div className="absolute -bottom-2 -left-2 w-6 h-6 rounded-full bg-rose-400/30 animate-pulse delay-150" />
                        </div>
                    </div>
                )
            case 'focus':
                return (
                    <div className="w-full max-w-xs mx-auto aspect-square bg-gradient-to-br from-slate-100 to-indigo-100 rounded-3xl flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-1/4 left-1/4 w-16 h-16 rounded-full bg-accent blur-2xl" />
                            <div className="absolute bottom-1/4 right-1/4 w-24 h-24 rounded-full bg-purple-600 blur-2xl" />
                        </div>
                        <div className="relative flex flex-col items-center">
                            <div className="w-20 h-20 rounded-2xl bg-accent/20 flex items-center justify-center border-2 border-accent/30">
                                <svg className="w-10 h-10 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <div className="mt-4 flex gap-1">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <div key={i} className={`w-1.5 h-8 rounded-full ${i <= 3 ? 'bg-accent' : 'bg-surface-4'}`} />
                                ))}
                            </div>
                        </div>
                    </div>
                )
            case 'progress':
                return (
                    <div className="w-full max-w-xs mx-auto aspect-square bg-gradient-to-br from-emerald-100 to-teal-100 rounded-3xl flex items-center justify-center relative">
                        <div className="relative w-40 h-40">
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                                <circle cx="50" cy="50" r="40" fill="none" stroke="#059669" strokeWidth="8" strokeLinecap="round"
                                    strokeDasharray="251.2" strokeDashoffset="50" />
                                <text x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#065f46">78%</text>
                            </svg>
                            <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )
            case 'analytics':
                return (
                    <div className="w-full max-w-xs mx-auto aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl flex items-center justify-center relative">
                        <div className="flex items-end gap-2 h-32">
                            {[40, 65, 45, 80, 55, 70, 90].map((h, i) => (
                                <div key={i} className="w-6 rounded-t-lg bg-accent/30" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </div>
                )
            case 'privacy':
                return (
                    <div className="w-full max-w-xs mx-auto aspect-square bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center relative">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full bg-accent/10 border-2 border-accent/20 flex items-center justify-center">
                                <svg className="w-16 h-16 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-emerald-500/30 flex items-center justify-center">
                                <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                    </div>
                )
            case 'survey':
                return (
                    <div className="w-full max-w-xs mx-auto aspect-square bg-gradient-to-br from-amber-100 to-orange-100 rounded-3xl flex items-center justify-center relative">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-2xl bg-surface-1/60 border-2 border-amber-600/20 flex items-center justify-center">
                                <svg className="w-16 h-16 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-600/20 flex items-center justify-center">
                                <span className="text-xs font-bold text-amber-700">✓</span>
                            </div>
                        </div>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <motion.div
            key={card.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="flex flex-col items-center text-center px-4 py-6 w-full max-w-md mx-auto"
        >
            <div className="mb-8 w-full">{renderIllustration(card.illustration)}</div>
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-3 leading-tight">{card.title}</h2>
            <p className="text-sm md:text-base text-text-secondary max-w-sm leading-relaxed">{card.description}</p>
            <div className="mt-8 flex items-center gap-2">
                {Array.from({ length: total }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i <= progress ? 'w-6 bg-accent' : 'w-2 bg-surface-3'}`}
                    />
                ))}
            </div>
            <div className="mt-8 flex items-center justify-between w-full gap-3">
                <div className="flex-1 flex justify-start">
                    {!isFirst && (
                        <button
                            onClick={onPrevious}
                            className="p-2 rounded-xl text-text-tertiary hover:text-text-secondary hover:bg-surface-3 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    )}
                </div>
                <div className="flex-1 flex justify-center">
                    {!isLast && (
                        <button
                            onClick={onSkip}
                            className="text-xs text-text-tertiary hover:text-text-secondary transition-colors font-medium"
                        >
                            <SkipForward className="w-4 h-4 inline ml-1" />
                            رد کردن
                        </button>
                    )}
                </div>
                <div className="flex-1 flex justify-end">
                    <button
                        onClick={onNext}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
                    >
                        {isLast ? 'شروع نظرسنجی →' : 'بعدی →'}
                    </button>
                </div>
            </div>
        </motion.div>
    )
}

// ---------- Main Onboarding Flow ----------
const OnboardingFlow: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState(1)
    const { user, completeOnboarding, isLoading } = useAuth()
    const { showToast } = useToast()
    const navigate = useNavigate()

    useEffect(() => {
        if (!isLoading && user?.onboarding_completed) {
            navigate('/dashboard', { replace: true })
        }
    }, [user, isLoading, navigate])

    const total = CARDS.length
    const isFirst = currentIndex === 0
    const isLast = currentIndex === total - 1

    const goNext = useCallback(() => {
        if (isLast) {
            handleCompleteOnboarding()
            return
        }
        setDirection(1)
        setCurrentIndex(prev => Math.min(prev + 1, total - 1))
    }, [isLast])

    const goPrevious = useCallback(() => {
        if (isFirst) return
        setDirection(-1)
        setCurrentIndex(prev => Math.max(prev - 1, 0))
    }, [isFirst])

    const handleSkip = useCallback(() => {
        setDirection(1)
        setCurrentIndex(total - 1)
    }, [total])

    const handleCompleteOnboarding = useCallback(async () => {
        try {
            await completeOnboarding({
                olympiadId: user?.olympiad_id || '',
                subjects: [],
            })
            showToast('مرحلهٔ اول تکمیل شد!', 'success')
            navigate('/baseline', { replace: true })
        } catch (err) {
            showToast('خطا در تکمیل مرحله', 'error')
        }
    }, [completeOnboarding, user, navigate, showToast])

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <PageLoader />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            <div className="w-full max-w-2xl bg-surface-1/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-6 md:p-10">
                <AnimatePresence mode="wait" custom={direction}>
                    <OnboardingCardComponent
                        key={currentIndex}
                        card={CARDS[currentIndex]}
                        progress={currentIndex}
                        total={total}
                        onNext={goNext}
                        onSkip={handleSkip}
                        onPrevious={goPrevious}
                        isFirst={isFirst}
                        isLast={isLast}
                    />
                </AnimatePresence>
            </div>
        </div>
    )
}

export default OnboardingFlow
