import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../config/supabase'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../utils/date-utils'
import { Button } from '../common/Button'
import { Textarea } from '../common/Input'
import { ArrowRight, Send } from 'lucide-react'

interface Message {
    id: string
    sender_id: string
    sender_role: 'student' | 'admin'
    content: string
    created_at: string
    read_at: string | null
}

interface ConversationViewProps {
    conversationId: string
    onBack: () => void
}

export const ConversationView: React.FC<ConversationViewProps> = ({ conversationId, onBack }) => {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [newMessage, setNewMessage] = useState('')
    const [sending, setSending] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true })
        if (error) {
            showToast('خطا در دریافت پیام‌ها', 'error')
        } else {
            setMessages(data || [])
            // Mark messages as read if admin
            if (user?.is_admin) {
                const unread = (data || []).filter(m => m.read_at === null && m.sender_id !== user.id)
                for (const m of unread) {
                    await supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('id', m.id)
                }
            }
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchMessages()
        const interval = setInterval(fetchMessages, 5000) // poll every 5s
        return () => clearInterval(interval)
    }, [conversationId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return
        setSending(true)
        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: user!.id,
                    sender_role: user!.is_admin ? 'admin' : 'student',
                    content: newMessage.trim(),
                })
            if (error) throw error
            setNewMessage('')
            fetchMessages()
        } catch (err) {
            showToast('خطا در ارسال پیام', 'error')
        } finally {
            setSending(false)
        }
    }

    if (loading) return <div className="p-6">در حال بارگذاری...</div>


    return (
        <div className="flex flex-col h-[80vh] max-h-[600px] bg-surface-1 rounded-2xl border border-border p-4" dir="rtl">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
                <button onClick={onBack} className="p-2 rounded-xl hover:bg-surface-2 transition">
                    <ArrowRight className="w-5 h-5" />
                </button>
                <h2 className="text-lg font-bold text-text-primary">مکالمه</h2>
            </div>
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
                {messages.length === 0 ? (
                    <div className="text-center text-text-tertiary">هنوز پیامی ارسال نشده است.</div>
                ) : (
                    messages.map((m) => {
                        const isMine = m.sender_id === user!.id
                        return (
                            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${isMine ? 'bg-accent text-white rounded-tr-none' : 'bg-surface-2 text-text-primary rounded-tl-none'}`}>
                                    <p>{m.content}</p>
                                    <p className="text-[10px] opacity-70 mt-1">{formatDate(m.created_at)}</p>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="flex gap-2 pt-3 border-t border-border">
                <Textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="پیام خود را بنویسید..."
                    rows={2}
                    className="flex-1 bg-surface-2 text-text-primary placeholder-text-tertiary"
                />
                <Button type="submit" variant="primary" loading={sending} className="shrink-0 self-end">
                    <Send className="w-4 h-4" />
                </Button>
            </form>
        </div>
    )
}