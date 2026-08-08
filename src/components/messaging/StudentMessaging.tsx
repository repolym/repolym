// src/components/messaging/StudentMessaging.tsx
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../config/supabase'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../utils/date-utils'
import { Button } from '../common/Button'
import { Input, Select, Textarea } from '../common/Input'
import { Skeleton } from '../common/Loading'

interface Admin {
    id: string
    name: string
    email: string
}

interface Conversation {
    id: string
    admin_id: string
    admin_name: string
    subject: string
    priority: string
    status: string
    last_message: string
    last_message_time: string
    unread_count: number
}

export const StudentMessaging: React.FC = () => {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [admins, setAdmins] = useState<Admin[]>([])
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [loading, setLoading] = useState(true)
    const [showNewMessage, setShowNewMessage] = useState(false)
    const [selectedAdmin, setSelectedAdmin] = useState('')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [priority, setPriority] = useState('normal')
    const [sending, setSending] = useState(false)

    const fetchAdmins = async () => {
        const { data, error } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('is_admin', true)
        if (error) {
            showToast('خطا در دریافت لیست ادمین‌ها', 'error')
            console.error(error)
        } else {
            setAdmins(data || [])
        }
    }

    const fetchConversations = async () => {
        if (!user) return
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                id,
                admin_id,
                subject,
                priority,
                status,
                users:admin_id(name),
                messages:messages(created_at, content, read_at)
            `)
            .eq('student_id', user.id)
            .order('created_at', { ascending: false })
        if (error) {
            showToast('خطا در دریافت مکالمات', 'error')
            console.error(error)
        } else {
            const convs = (data || []).map((c: any) => ({
                id: c.id,
                admin_id: c.admin_id,
                admin_name: c.users?.name || 'ناشناس',
                subject: c.subject,
                priority: c.priority,
                status: c.status,
                last_message: c.messages?.[0]?.content || '',
                last_message_time: c.messages?.[0]?.created_at || '',
                unread_count: (c.messages || []).filter((m: any) => m.read_at === null && m.sender_id !== user.id).length,
            }))
            setConversations(convs)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchAdmins()
        fetchConversations()
    }, [user])

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAdmin || !message.trim()) return
        setSending(true)
        try {
            const { data: existing } = await supabase
                .from('conversations')
                .select('id')
                .eq('student_id', user!.id)
                .eq('admin_id', selectedAdmin)
                .single()
            let conversationId = existing?.id
            if (!conversationId) {
                const { data: newConv, error: convError } = await supabase
                    .from('conversations')
                    .insert({
                        student_id: user!.id,
                        admin_id: selectedAdmin,
                        subject: subject.trim() || 'بدون موضوع',
                        priority,
                    })
                    .select()
                    .single()
                if (convError) throw convError
                conversationId = newConv.id
            }
            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    conversation_id: conversationId,
                    sender_id: user!.id,
                    sender_role: 'student',
                    content: message.trim(),
                })
            if (msgError) throw msgError

            showToast('پیام ارسال شد', 'success')
            setMessage('')
            setSubject('')
            setSelectedAdmin('')
            setPriority('normal')
            setShowNewMessage(false)
            fetchConversations()

            try {
                const admin = admins.find(a => a.id === selectedAdmin)
                if (admin?.email) {
                    const { data: { session } } = await supabase.auth.getSession()
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
                    await fetch(`${supabaseUrl}/functions/v1/send-email`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${session?.access_token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            to: admin.email,
                            subject: `📩 پیام جدید از ${user?.name}`,
                            html: `
                                <h2>پیام جدید از دانش‌آموز</h2>
                                <p><strong>از:</strong> ${user?.name}</p>
                                <p><strong>موضوع:</strong> ${subject || 'بدون موضوع'}</p>
                                <p><strong>اولویت:</strong> ${priority}</p>
                                <p><strong>پیام:</strong><br>${message}</p>
                                <p><a href="${window.location.origin}${import.meta.env.BASE_URL}#/admin/inbox">مشاهده در داشبورد</a></p>
                            `
                        })
                    })
                }
            } catch (emailErr) {
                console.warn('Email notification failed:', emailErr)
            }

        } catch (err) {
            showToast('خطا در ارسال پیام', 'error')
            console.error(err)
        } finally {
            setSending(false)
        }
    }

    if (loading) return <div className="p-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-32 w-full mt-4" /></div>

    return (
        <div className="p-5 md:p-8 max-w-4xl mx-auto" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-text-primary">ارتباط با ادمین</h1>
                <Button variant="primary" onClick={() => setShowNewMessage(!showNewMessage)}>
                    {showNewMessage ? 'بستن' : 'پیام جدید'}
                </Button>
            </div>

            {showNewMessage && (
                <div className="bg-surface-1 rounded-2xl p-6 border border-border mb-6">
                    <form onSubmit={handleSendMessage} className="space-y-4">
                        <Select
                            label="ادمین"
                            value={selectedAdmin}
                            onChange={(e) => setSelectedAdmin(e.target.value)}
                            options={[
                                { value: '', label: 'انتخاب ادمین...' },
                                ...admins.map(a => ({ value: a.id, label: a.name })),
                            ]}
                            required
                        />
                        <Input
                            label="موضوع"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="موضوع پیام"
                        />
                        <Select
                            label="اولویت"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                            options={[
                                { value: 'low', label: 'کم' },
                                { value: 'normal', label: 'معمولی' },
                                { value: 'high', label: 'بالا' },
                                { value: 'urgent', label: 'فوری' },
                            ]}
                        />
                        <Textarea
                            label="متن پیام"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="متن پیام خود را بنویسید..."
                            rows={4}
                            required
                        />
                        <div className="flex gap-2 justify-end">
                            <Button type="button" variant="ghost" onClick={() => setShowNewMessage(false)}>انصراف</Button>
                            <Button type="submit" variant="primary" loading={sending}>ارسال</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-3">
                {conversations.length === 0 ? (
                    <div className="text-center py-12 text-text-tertiary">هیچ مکالمه‌ای ندارید. پیام جدید ارسال کنید.</div>
                ) : (
                    conversations.map((c) => (
                        <div key={c.id} className="bg-surface-1 rounded-2xl p-4 border border-border hover:border-accent transition cursor-pointer" onClick={() => window.location.href = `#/messaging/${c.id}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-text-primary">{c.admin_name}</p>
                                    <p className="text-sm text-text-secondary">{c.subject}</p>
                                    <p className="text-xs text-text-tertiary truncate max-w-xs">{c.last_message}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${c.priority === 'urgent' ? 'bg-red-100 text-red-700' : c.priority === 'high' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {c.priority === 'low' ? 'کم' : c.priority === 'normal' ? 'معمولی' : c.priority === 'high' ? 'بالا' : 'فوری'}
                                    </span>
                                    {c.unread_count > 0 && <span className="bg-accent text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{c.unread_count}</span>}
                                    <span className="text-xs text-text-tertiary">{formatDate(c.last_message_time)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}