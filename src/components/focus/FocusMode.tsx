import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useStudySessions } from '../../hooks/useStudySessions'
import { useSubjects } from '../../hooks/useSubjects'
import { useToast } from '../../context/ToastContext'
import { formatMinutes } from '../../utils/date-utils'
import { today } from '../../utils/date-utils'
import {
    Play,
    Pause,
    RotateCcw,
    Settings,
    X,
    ArrowRight,
    Timer,
    Brain,
    Coffee,
    BookOpen
} from 'lucide-react'

type FocusModeType = 'pomodoro' | 'deep-focus'

const DEFAULT_FOCUS_MINUTES = 25
const DEFAULT_BREAK_MINUTES = 5
const DEEP_FOCUS_MINUTES = 50

// ------------------------------------------------------------------
// Web Audio Ringtone API
// ------------------------------------------------------------------
class Ringtone {
    private audioContext: AudioContext | null = null
    private oscillator: OscillatorNode | null = null
    private gainNode: GainNode | null = null
    private isPlaying = false

    async init(): Promise<void> {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume()
        }
    }

    play(duration: number = 3000): void {
        if (this.isPlaying) return
        if (!this.audioContext) {
            this.init().then(() => this.play(duration))
            return
        }

        this.stop()

        this.oscillator = this.audioContext.createOscillator()
        this.gainNode = this.audioContext.createGain()

        this.oscillator.type = 'sine'
        this.oscillator.frequency.value = 523 // C5 note

        const now = this.audioContext.currentTime
        this.gainNode.gain.setValueAtTime(0, now)
        this.gainNode.gain.linearRampToValueAtTime(0.3, now + 0.1)
        this.gainNode.gain.linearRampToValueAtTime(0.3, now + duration / 1000 - 0.5)
        this.gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000)

        this.oscillator.connect(this.gainNode)
        this.gainNode.connect(this.audioContext.destination)
        this.oscillator.start(now)
        this.oscillator.stop(now + duration / 1000 + 0.1)
        this.isPlaying = true
    }

    stop(): void {
        if (this.oscillator) {
            try {
                this.oscillator.stop()
            } catch { }
            this.oscillator.disconnect()
            this.oscillator = null
        }
        if (this.gainNode) {
            this.gainNode.disconnect()
            this.gainNode = null
        }
        this.isPlaying = false
    }

    destroy(): void {
        this.stop()
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close()
        }
    }
}

// ------------------------------------------------------------------
// Main FocusMode Component
// ------------------------------------------------------------------
export const FocusMode: React.FC = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { createSession } = useStudySessions({ userId: user?.id ?? null })
    const { data: subjects } = useSubjects(user?.id ?? null)
    const { showToast } = useToast()

    const [mode, setMode] = useState<FocusModeType>('pomodoro')
    const [focusMinutes, setFocusMinutes] = useState(DEFAULT_FOCUS_MINUTES)
    const [breakMinutes, setBreakMinutes] = useState(DEFAULT_BREAK_MINUTES)
    const [isRunning, setIsRunning] = useState(false)
    const [isBreak, setIsBreak] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState(focusMinutes * 60)
    const [showSettings, setShowSettings] = useState(false)
    const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null)
    const [sessionCount, setSessionCount] = useState(0)

    const timerRef = useRef<number | null>(null)
    const ringtoneRef = useRef<Ringtone | null>(null)

    // Dynamic Atmosphere Themes based on State
    const getThemeColors = () => {
        if (isBreak) return {
            bg: 'from-emerald-950 via-slate-950 to-teal-950',
            glow1: 'rgba(16,185,129,0.15)',
            glow2: 'rgba(20,184,166,0.15)',
            stroke1: '#10B981',
            stroke2: '#14B8A6',
            accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
        }
        if (mode === 'deep-focus') return {
            bg: 'from-purple-950 via-stone-950 to-indigo-950',
            glow1: 'rgba(147,51,234,0.15)',
            glow2: 'rgba(79,70,229,0.15)',
            stroke1: '#A855F7',
            stroke2: '#6366F1',
            accent: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
        }
        return {
            bg: 'from-rose-950 via-slate-950 to-indigo-950',
            glow1: 'rgba(244,63,94,0.15)',
            glow2: 'rgba(99,102,241,0.15)',
            stroke1: '#F43F5E',
            stroke2: '#6366F1',
            accent: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
        }
    }

    const theme = getThemeColors()

    useEffect(() => {
        const saved = localStorage.getItem('focus_session_state')
        if (saved) {
            try {
                const parsed = JSON.parse(saved)
                setMode(parsed.mode || 'pomodoro')
                setFocusMinutes(parsed.focusMinutes || DEFAULT_FOCUS_MINUTES)
                setBreakMinutes(parsed.breakMinutes || DEFAULT_BREAK_MINUTES)
                setIsBreak(parsed.isBreak || false)
                setTimeRemaining(parsed.timeRemaining || focusMinutes * 60)
                setSessionCount(parsed.sessionCount || 0)
                setSelectedSubjectId(parsed.selectedSubjectId || null)
                if (parsed.isRunning) setIsRunning(true)
            } catch { }
        }
    }, [])

    useEffect(() => {
        const state = {
            mode,
            focusMinutes,
            breakMinutes,
            isBreak,
            timeRemaining,
            sessionCount,
            selectedSubjectId,
            isRunning,
        }
        localStorage.setItem('focus_session_state', JSON.stringify(state))
    }, [mode, focusMinutes, breakMinutes, isBreak, timeRemaining, sessionCount, selectedSubjectId, isRunning])

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                window.clearInterval(timerRef.current)
                timerRef.current = null
            }
            if (ringtoneRef.current) ringtoneRef.current.destroy()
        }
    }, [])

    const startTimer = useCallback(() => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current)
            timerRef.current = null
        }
        setIsRunning(true)

        timerRef.current = window.setInterval(() => {
            setTimeRemaining((prev) => {
                if (prev <= 1) {
                    window.clearInterval(timerRef.current!)
                    timerRef.current = null
                    setIsRunning(false)

                    if (!ringtoneRef.current) ringtoneRef.current = new Ringtone()
                    ringtoneRef.current.play(3000)

                    if (!isBreak) {
                        handleSessionComplete()
                    } else {
                        showToast('وقت استراحت تمام شد!', 'info')
                        resetTimer()
                    }
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }, [isBreak, mode, focusMinutes, breakMinutes, selectedSubjectId])

    const pauseTimer = () => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current)
            timerRef.current = null
        }
        setIsRunning(false)
    }

    const resetTimer = () => {
        if (timerRef.current) {
            window.clearInterval(timerRef.current)
            timerRef.current = null
        }
        setIsRunning(false)
        setIsBreak(false)
        setTimeRemaining((mode === 'deep-focus' ? DEEP_FOCUS_MINUTES : focusMinutes) * 60)
        if (ringtoneRef.current) ringtoneRef.current.stop()
    }

    const handleSessionComplete = async () => {
        const duration = isBreak ? breakMinutes : (mode === 'deep-focus' ? DEEP_FOCUS_MINUTES : focusMinutes)
        const notes = isBreak
            ? `استراحت (${mode === 'pomodoro' ? 'پومودورو' : 'تمرکز عمیق'})`
            : `جلسه تمرکز - ${mode === 'pomodoro' ? 'پومودورو' : 'تمرکز عمیق'}`

        try {
            await createSession({
                subject_id: selectedSubjectId,
                date: today(),
                duration_minutes: duration,
                notes: `${notes}\nزمان: ${formatMinutes(duration)}`,
            })
            showToast('جلسه تمرکز با موفقیت ذخیره شد!', 'success')
            setSessionCount((prev) => prev + 1)

            if (mode === 'pomodoro' && !isBreak) {
                setIsBreak(true)
                setTimeRemaining(breakMinutes * 60)
                showToast('وقت استراحت!', 'info')
            } else {
                resetTimer()
            }
        } catch (err) {
            showToast('خطا در ذخیره جلسه', 'error')
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    }

    const totalSeconds = isBreak
        ? breakMinutes * 60
        : (mode === 'deep-focus' ? DEEP_FOCUS_MINUTES * 60 : focusMinutes * 60)
    const progress = totalSeconds > 0 ? (timeRemaining / totalSeconds) * 100 : 0

    const handleStartPause = () => {
        if (isRunning) {
            pauseTimer()
        } else {
            if (timeRemaining === 0) {
                setTimeRemaining(totalSeconds)
            }
            startTimer()
        }
    }

    const updateFocusMinutes = (val: number) => {
        const bounded = Math.max(1, Math.min(120, val))
        setFocusMinutes(bounded)
        if (!isRunning && !isBreak && mode === 'pomodoro') {
            setTimeRemaining(bounded * 60)
        }
    }

    const updateBreakMinutes = (val: number) => {
        const bounded = Math.max(1, Math.min(30, val))
        setBreakMinutes(bounded)
        if (!isRunning && isBreak) {
            setTimeRemaining(bounded * 60)
        }
    }

    const selectedSubjectName = subjects?.find(s => s.id === selectedSubjectId)?.name

    return (
        <motion.div
            className={`min-h-screen w-full bg-gradient-to-br ${theme.bg} text-white flex flex-col items-center justify-center p-6 relative overflow-hidden transition-colors duration-1000`}
            dir="rtl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Soft Breathing Ambient Lights */}
            <motion.div
                className="absolute inset-0 pointer-events-none"
                animate={{
                    background: [
                        `radial-gradient(circle at 15% 30%, ${theme.glow1} 0%, transparent 60%)`,
                        `radial-gradient(circle at 85% 70%, ${theme.glow2} 0%, transparent 60%)`,
                        `radial-gradient(circle at 50% 15%, ${theme.glow1} 0%, transparent 50%)`,
                        `radial-gradient(circle at 15% 30%, ${theme.glow1} 0%, transparent 60%)`,
                    ],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />

            <div className="relative z-10 w-full max-w-xl flex flex-col items-center backdrop-blur-3xl bg-white/[0.02] border border-white/5 shadow-[0_24px_80px_rgba(0,0,0,0.4)] rounded-[2.5rem] p-8 md:p-12">

                {/* Minimalist Top Nav */}
                <div className="flex items-center justify-between w-full mb-10">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-white/80 hover:text-white transition-all flex items-center justify-center shadow-sm"
                        title="بازگشت به داشبورد"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col items-center">
                        <span className="text-xs tracking-widest text-white/40 font-medium uppercase">Focus State</span>
                        <h1 className="text-lg font-bold tracking-wide mt-0.5 text-white/90">اتاق تمرکز</h1>
                    </div>

                    <div>
                        {mode === 'pomodoro' ? (
                            <button
                                onClick={() => setShowSettings(true)}
                                className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-white/80 hover:text-white transition-all flex items-center justify-center shadow-sm"
                                title="تنظیمات"
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        ) : (
                            <div className="w-11" /> /* Spacer to balance layout */
                        )}
                    </div>
                </div>

                {/* Glassmorphic Mode Switcher */}
                <div className="flex gap-1 mb-12 bg-black/40 border border-white/5 rounded-2xl p-1.5 shadow-inner w-full max-w-xs">
                    <button
                        onClick={() => {
                            if (isRunning) pauseTimer()
                            setMode('pomodoro')
                            setIsBreak(false)
                            setTimeRemaining(focusMinutes * 60)
                        }}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'pomodoro' && !isBreak
                            ? 'bg-white/[0.08] text-white shadow-md border border-white/10 backdrop-blur-md'
                            : 'text-white/40 hover:text-white/80'
                            }`}
                    >
                        <Timer className="w-4 h-4" />
                        پومودورو
                    </button>
                    <button
                        onClick={() => {
                            if (isRunning) pauseTimer()
                            setMode('deep-focus')
                            setIsBreak(false)
                            setTimeRemaining(DEEP_FOCUS_MINUTES * 60)
                        }}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 ${mode === 'deep-focus' && !isBreak
                            ? 'bg-white/[0.08] text-white shadow-md border border-white/10 backdrop-blur-md'
                            : 'text-white/40 hover:text-white/80'
                            }`}
                    >
                        <Brain className="w-4 h-4" />
                        تمرکز عمیق
                    </button>
                </div>

                {/* Immersive Animated Timer Display */}
                <div className="relative w-64 h-64 md:w-72 md:h-72 mb-10 flex items-center justify-center">
                    {/* Glowing outer radial effect */}
                    <div className="absolute inset-0 rounded-full blur-2xl opacity-20 transition-colors duration-1000" style={{ backgroundColor: theme.stroke1 }} />

                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r="44"
                            stroke="rgba(255,255,255,0.02)"
                            strokeWidth="3"
                            fill="none"
                        />
                        <motion.circle
                            cx="50"
                            cy="50"
                            r="44"
                            stroke="url(#focusGradient)"
                            strokeWidth="3.5"
                            fill="none"
                            strokeLinecap="round"
                            pathLength="100"
                            initial={{ strokeDashoffset: 0 }}
                            animate={{ strokeDashoffset: 100 - progress }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                        />
                        <defs>
                            <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor={theme.stroke1} />
                                <stop offset="100%" stopColor={theme.stroke2} />
                            </linearGradient>
                        </defs>
                    </svg>

                    <div className="absolute flex flex-col items-center justify-center text-center">
                        <motion.div
                            className="text-5xl md:text-6xl font-mono font-bold tracking-tight text-white drop-shadow-md select-none"
                            animate={{ scale: isRunning ? [1, 1.015, 1] : 1 }}
                            transition={{ duration: 2, repeat: isRunning ? Infinity : 0, ease: 'easeInOut' }}
                        >
                            {formatTime(timeRemaining)}
                        </motion.div>

                        <div className={`mt-4 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide border flex items-center gap-1.5 transition-all duration-500 ${theme.accent}`}>
                            {isBreak ? (
                                <>
                                    <Coffee className="w-3 h-3" />
                                    <span>زمان استراحت</span>
                                </>
                            ) : (
                                <>
                                    <Brain className="w-3 h-3" />
                                    <span>سیکل تمرکز</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Subtitle / Session Information */}
                {selectedSubjectName && (
                    <div className="flex items-center gap-2 text-white/50 text-xs mb-8 bg-white/[0.02] border border-white/5 px-4 py-1.5 rounded-full shadow-sm">
                        <BookOpen className="w-3.5 h-3.5 text-white/40" />
                        <span>مبحث فعال: <strong className="text-white/80 font-medium">{selectedSubjectName}</strong></span>
                    </div>
                )}

                {/* Elegant Control Actions */}
                <div className="flex items-center gap-6 justify-center w-full">
                    <motion.button
                        onClick={resetTimer}
                        className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.07] text-white/60 hover:text-white transition-all shadow-sm flex items-center justify-center"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <RotateCcw className="w-5 h-5" />
                    </motion.button>

                    <motion.button
                        onClick={handleStartPause}
                        className="h-16 w-32 rounded-2xl bg-white text-slate-950 flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(255,255,255,0.2)] font-semibold text-sm hover:bg-white/90 transition-all"
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        {isRunning ? (
                            <>
                                <Pause className="w-4 h-4 fill-current" />
                                <span>توقف</span>
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 fill-current" />
                                <span>شروع</span>
                            </>
                        )}
                    </motion.button>

                    <div className="w-12 text-center">
                        <div className="text-lg font-bold text-white/80 font-mono">{sessionCount}</div>
                        <div className="text-[10px] text-white/30 font-medium uppercase tracking-wider">جلسات</div>
                    </div>
                </div>

            </div>

            {/* Immersive Command-Palette Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl p-4"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.97, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.97, y: 10 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-black/90 rounded-3xl p-6 border border-white/10 shadow-2xl relative"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-3">
                                <h3 className="text-sm font-bold tracking-wide text-white/90">تنظیمات پومودورو</h3>
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="p-1.5 rounded-xl hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="text-[11px] font-semibold text-white/40 tracking-wider block mb-2">مدت زمان تمرکز (دقیقه)</label>
                                    <input
                                        type="number"
                                        value={focusMinutes}
                                        onChange={(e) => updateFocusMinutes(Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-white/[0.03] rounded-xl border border-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:bg-white/[0.06] transition-all font-mono"
                                        min={1}
                                        max={120}
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-white/40 tracking-wider block mb-2">مدت زمان استراحت (دقیقه)</label>
                                    <input
                                        type="number"
                                        value={breakMinutes}
                                        onChange={(e) => updateBreakMinutes(Number(e.target.value))}
                                        className="w-full px-4 py-3 bg-white/[0.03] rounded-xl border border-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:bg-white/[0.06] transition-all font-mono"
                                        min={1}
                                        max={30}
                                    />
                                </div>

                                <div>
                                    <label className="text-[11px] font-semibold text-white/40 tracking-wider block mb-2">درس مرتبط با این دوره</label>
                                    <div className="relative">
                                        <select
                                            value={selectedSubjectId || ''}
                                            onChange={(e) => setSelectedSubjectId(e.target.value || null)}
                                            className="w-full px-4 py-3 bg-slate-900 rounded-xl border border-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/50 appearance-none transition-all cursor-pointer"
                                        >
                                            <option value="" className="bg-slate-950 text-white/60">بدون درس (عمومی)</option>
                                            {subjects?.map((s) => (
                                                <option key={s.id} value={s.id} className="bg-slate-950 text-white">
                                                    {s.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="w-full mt-2 px-4 py-3 bg-white text-slate-950 hover:bg-white/90 rounded-xl text-xs font-bold tracking-wide transition-all shadow-md"
                                >
                                    ذخیره و اعمال تغییرات
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

export default FocusMode
