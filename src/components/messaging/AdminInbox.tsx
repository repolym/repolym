import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../config/supabase'
import { useToast } from '../../context/ToastContext'
import { formatDate } from '../../utils/date-utils'
import { Skeleton } from '../common/Loading'
import { ConversationView } from './ConversationView'

interface ConversationItem {
    id: string
    student_id: string
    student_name: string
    subject: string
    priority: string
    status: string
    last_message: string
    last_message_time: string
    unread_count: number
}

export const AdminInbox: React.FC = () => {
    const { user } = useAuth()
    const { showToast } = useToast()
    const [conversations, setConversations] = useState<ConversationItem[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedConv, setSelectedConv] = useState<string | null>(null)

    const fetchConversations = async () => {
        if (!user) return
        const { data, error } = await supabase
            .from('conversations')
            .select(`
                id,
                student_id,
                subject,
                priority,
                status,
                users:student_id(name),
                messages:messages(created_at, content, read_at, sender_id)
            `)
            .eq('admin_id', user.id)
            .order('created_at', { ascending: false })
        if (error) {
            showToast('خطا در دریافت پیام‌ها', 'error')
        } else {
            const convs = (data || []).map((c: any) => ({
                id: c.id,
                student_id: c.student_id,
                student_name: c.users?.name || 'ناشناس',
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
        fetchConversations()
    }, [user])

    if (loading) return <div className="p-6"><Skeleton className="h-12 w-full" /><Skeleton className="h-32 w-full mt-4" /></div>

    if (selectedConv) {
        return <ConversationView conversationId={selectedConv} onBack={() => setSelectedConv(null)} />
    }

    return (
        <div className="p-5 md:p-8 max-w-4xl mx-auto" dir="rtl">
            <h1 className="text-2xl font-bold text-text-primary mb-6">صندوق پیام‌ها</h1>
            <div className="space-y-3">
                {conversations.length === 0 ? (
                    <div className="text-center py-12 text-text-tertiary">هیچ پیامی دریافت نشده است.</div>
                ) : (
                    conversations.map((c) => (
                        <div key={c.id} className="bg-surface-1 rounded-2xl p-4 border border-border hover:border-accent transition cursor-pointer" onClick={() => setSelectedConv(c.id)}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-text-primary">{c.student_name}</p>
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