// src/components/dashboard/sections/AiAssistantSection.tsx
import React, { useState } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../context/ToastContext'
import { supabase } from '../../../config/supabase'
import {
    Sparkles,
    Send,
    BrainCircuit,
    MessageSquare,
    Loader2,
    Lightbulb,
} from 'lucide-react'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

type Action = 'chat' | 'analyze' | 'recommend' | 'summarize'

export const AiAssistantSection: React.FC = () => {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)

    // Use the environment variable directly
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const functionUrl = `${supabaseUrl}/functions/v1/ai-assistant`

    const callAiFunction = async (action: Action, payload: any): Promise<string> => {
        setLoading(true)
        try {
            // Get the current session token for authorization
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action, data: payload }),
            })

            const result = await response.json()
            if (!result.success) throw new Error(result.error || 'خطا در پاسخ هوش مصنوعی')

            // Extract the actual text based on the action
            if (action === 'chat') return result.data?.message || 'پاسخی دریافت نشد'
            if (action === 'analyze') {
                const d = result.data
                let summary = d.summary || ''
                if (d.strengths?.length) summary += '\n\nنقاط قوت:\n' + d.strengths.map((s: string) => `• ${s}`).join('\n')
                if (d.weaknesses?.length) summary += '\n\nنقاط ضعف:\n' + d.weaknesses.map((w: string) => `• ${w}`).join('\n')
                if (d.recommendations?.length) summary += '\n\nپیشنهادات:\n' + d.recommendations.map((r: string) => `• ${r}`).join('\n')
                return summary || 'تحلیل کامل شد، اما داده‌ای برای نمایش وجود ندارد.'
            }
            if (action === 'recommend') {
                const recs = result.data?.recommendations || []
                return recs.length ? 'پیشنهادات هوشمند:\n' + recs.map((r: string) => `• ${r}`).join('\n') : 'پیشنهادی برای نمایش وجود ندارد.'
            }
            if (action === 'summarize') {
                return result.data?.summary || 'خلاصه‌سازی انجام نشد.'
            }
            return 'عملیات ناشناخته'
        } catch (err: any) {
            showToast(err.message || 'خطا در ارتباط با هوش مصنوعی', 'error')
            return `⚠️ خطا: ${err.message}`
        } finally {
            setLoading(false)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!input.trim() || loading) return

        const userMsg: Message = { role: 'user', content: input }
        const updated = [...messages, userMsg]
        setMessages(updated)
        setInput('')

        // Build the conversation history for the AI
        const history = updated.map(m => ({ role: m.role, content: m.content }))
        const response = await callAiFunction('chat', {
            messages: history,
            userId: user?.id,
        })

        setMessages([...updated, { role: 'assistant', content: response }])
    }

    const quickActions = [
        {
            label: 'تحلیل عملکرد ماهانه',
            icon: <BrainCircuit className="w-4 h-4" />,
            action: async () => {
                const result = await callAiFunction('analyze', {
                    userId: user?.id,
                    period: 'month',
                })
                setMessages(prev => [...prev, { role: 'assistant', content: result }])
            },
        },
        {
            label: 'دریافت پیشنهادات شخصی‌سازی‌شده',
            icon: <Lightbulb className="w-4 h-4" />,
            action: async () => {
                const result = await callAiFunction('recommend', {
                    userId: user?.id,
                    goal: 'بهبود عملکرد کلی',
                })
                setMessages(prev => [...prev, { role: 'assistant', content: result }])
            },
        },
    ]

    return (
        <div className="bg-surface-1 rounded-2xl border border-border p-6 flex flex-col h-[600px] text-right font-sans" dir="rtl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-xl">
                        <Sparkles className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">دستیار هوشمند آموزشی</h2>
                        <p className="text-sm text-text-secondary">سوالات درسی خود را بپرسید یا روندهای مطالعاتی خود را ارزیابی کنید</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {quickActions.map((qa, idx) => (
                        <button
                            key={idx}
                            onClick={qa.action}
                            disabled={loading}
                            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 whitespace-nowrap"
                        >
                            {qa.icon}
                            {qa.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2 bg-surface-2 rounded-xl border border-border/50">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-text-secondary gap-2 p-6 text-center">
                        <MessageSquare className="w-12 h-12 text-text-secondary/40" />
                        <p className="font-medium">پیامی ارسال کنید تا گفتگو با هوش مصنوعی آغاز شود.</p>
                        <p className="text-xs max-w-sm">
                            می‌توانید درباره زمان‌بندی‌ها، اهداف درسی، و یا ضعف‌های کارنامه خود راهنمایی دریافت کنید.
                        </p>
                    </div>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user'
                                    ? 'bg-accent-muted text-accent-hover rounded-tr-none'
                                    : 'bg-surface-1 border border-border text-text-primary rounded-tl-none'
                                    }`}
                            >
                                <p className="whitespace-pre-line">{msg.content}</p>
                            </div>
                        </div>
                    ))
                )}
                {loading && (
                    <div className="flex justify-end">
                        <div className="bg-surface-1 border border-border rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-sm text-text-secondary">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                            <span>در حال پردازش داده‌ها...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="سوال خود را اینجا بنویسید..."
                    disabled={loading}
                    className="flex-1 bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50 text-right"
                />
                <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-40 flex items-center justify-center"
                >
                    <Send className="w-4 h-4 rotate-180" />
                </button>
            </form>
        </div>
    )
}

export default AiAssistantSection