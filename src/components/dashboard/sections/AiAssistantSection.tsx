import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { supabase } from '../../../config/supabase';
import { useChatSessions, ChatMessage, ChatSession } from '../../../hooks/useChatSessions';
import {
    Sparkles,
    Send,
    BrainCircuit,
    MessageSquare,
    Loader2,
    Lightbulb,
    Plus,
    Trash2,
    Menu,
    X,
    History,
} from 'lucide-react';

type Action = 'chat' | 'analyze' | 'recommend' | 'summarize';

export const AiAssistantSection: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { sessions, loading: sessionsLoading, createSession, updateSession, deleteSession, refetch } =
        useChatSessions(user?.id ?? null);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/ai-assistant`;

    // Load session when selected
    const loadSession = (session: ChatSession) => {
        setCurrentSessionId(session.id);
        setMessages(session.messages || []);
        setSidebarOpen(false);
    };

    // Create a new chat session
    const startNewChat = async () => {
        const newSession = await createSession({ title: 'گفتگوی جدید' });
        if (newSession) {
            setCurrentSessionId(newSession.id);
            setMessages([]);
            setSidebarOpen(false);
        }
    };

    // Delete a session
    const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('آیا از حذف این گفتگو اطمینان دارید؟')) return;
        const ok = await deleteSession(id);
        if (ok) {
            showToast('گفتگو حذف شد', 'success');
            if (currentSessionId === id) {
                setCurrentSessionId(null);
                setMessages([]);
            }
        } else {
            showToast('خطا در حذف گفتگو', 'error');
        }
    };

    // Auto-save messages to the current session after each exchange
    const saveMessagesToSession = async (sessionId: string, newMessages: ChatMessage[]) => {
        await updateSession(sessionId, { messages: newMessages });
    };

    // Call the AI function
    const callAiFunction = async (action: Action, payload: any): Promise<string> => {
        setLoading(true);
        const isDev = import.meta.env.MODE === 'development';
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action, data: payload }),
            });

            const result = await response.json();
            if (!result.success) {
                const errorMsg = isDev
                    ? (result.error || 'خطا در پاسخ هوش مصنوعی')
                    : 'ارتباط با دستیار هوشمند برقرار نشد. لطفاً دوباره تلاش کنید.';
                throw new Error(errorMsg);
            }

            if (action === 'chat') return result.data?.message || 'پاسخی دریافت نشد';
            if (action === 'analyze') {
                const d = result.data;
                let summary = d.summary || '';
                if (d.strengths?.length) summary += '\n\nنقاط قوت:\n' + d.strengths.map((s: string) => `• ${s}`).join('\n');
                if (d.weaknesses?.length) summary += '\n\nنقاط ضعف:\n' + d.weaknesses.map((w: string) => `• ${w}`).join('\n');
                if (d.recommendations?.length) summary += '\n\nپیشنهادات:\n' + d.recommendations.map((r: string) => `• ${r}`).join('\n');
                return summary || 'تحلیل کامل شد، اما داده‌ای برای نمایش وجود ندارد.';
            }
            if (action === 'recommend') {
                const recs = result.data?.recommendations || [];
                return recs.length ? 'پیشنهادات هوشمند:\n' + recs.map((r: string) => `• ${r}`).join('\n') : 'پیشنهادی برای نمایش وجود ندارد.';
            }
            if (action === 'summarize') {
                return result.data?.summary || 'خلاصه‌سازی انجام نشد.';
            }
            return 'عملیات ناشناخته';
        } catch (err: any) {
            const errorMsg = isDev
                ? err.message
                : 'ارتباط با دستیار هوشمند برقرار نشد. لطفاً دوباره تلاش کنید.';
            showToast(errorMsg, 'error');
            return `⚠️ ${errorMsg}`;
        } finally {
            setLoading(false);
        }
    };

    // Handle sending a user message
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        // Ensure we have a session
        let sessionId = currentSessionId;
        if (!sessionId) {
            const newSession = await createSession({ title: input.trim().slice(0, 50) });
            if (!newSession) {
                showToast('خطا در ایجاد گفتگو', 'error');
                return;
            }
            sessionId = newSession.id;
            setCurrentSessionId(sessionId);
        }

        const userMsg: ChatMessage = { role: 'user', content: input };
        const updatedMessages = [...messages, userMsg];
        setMessages(updatedMessages);
        setInput('');

        // Save user message immediately
        await saveMessagesToSession(sessionId, updatedMessages);

        // Get AI response
        const history = updatedMessages.map(m => ({ role: m.role, content: m.content }));
        const response = await callAiFunction('chat', {
            messages: history,
            userId: user?.id,
        });

        const assistantMsg: ChatMessage = { role: 'assistant', content: response };
        const finalMessages = [...updatedMessages, assistantMsg];
        setMessages(finalMessages);

        // Save assistant response and update session
        await saveMessagesToSession(sessionId, finalMessages);

        // If title is still default and we have user message, update title
        const session = sessions.find(s => s.id === sessionId);
        if (session && (!session.title || session.title === 'گفتگوی جدید') && userMsg.content.length > 10) {
            await updateSession(sessionId, { title: userMsg.content.slice(0, 50) + '...' });
            refetch(); // refresh list to show updated title
        }
    };

    // Quick actions (they add a message to the chat)
    const quickActions = [
        {
            label: 'تحلیل عملکرد ماهانه',
            icon: <BrainCircuit className="w-4 h-4" />,
            action: async () => {
                let sessionId = currentSessionId;
                if (!sessionId) {
                    const newSession = await createSession({ title: 'تحلیل عملکرد' });
                    if (!newSession) return;
                    sessionId = newSession.id;
                    setCurrentSessionId(sessionId);
                }
                const result = await callAiFunction('analyze', {
                    userId: user?.id,
                    period: 'month',
                });
                const msg: ChatMessage = { role: 'assistant', content: result };
                const newMessages = [...messages, msg];
                setMessages(newMessages);
                await saveMessagesToSession(sessionId, newMessages);
            },
        },
        {
            label: 'دریافت پیشنهادات شخصی‌سازی‌شده',
            icon: <Lightbulb className="w-4 h-4" />,
            action: async () => {
                let sessionId = currentSessionId;
                if (!sessionId) {
                    const newSession = await createSession({ title: 'پیشنهادات' });
                    if (!newSession) return;
                    sessionId = newSession.id;
                    setCurrentSessionId(sessionId);
                }
                const result = await callAiFunction('recommend', {
                    userId: user?.id,
                    goal: 'بهبود عملکرد کلی',
                });
                const msg: ChatMessage = { role: 'assistant', content: result };
                const newMessages = [...messages, msg];
                setMessages(newMessages);
                await saveMessagesToSession(sessionId, newMessages);
            },
        },
    ];

    // Auto-scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Load most recent session on mount
    useEffect(() => {
        if (sessions.length > 0 && !currentSessionId) {
            const latest = sessions[0];
            loadSession(latest);
        }
    }, [sessions]);

    return (
        <div className="bg-surface-1 rounded-2xl border border-border p-6 flex flex-col h-[600px] text-right font-sans" dir="rtl">
            {/* Header with session management */}
            <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-xl hover:bg-surface-2 transition-colors"
                        title="تاریخچه گفتگوها"
                    >
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <div className="p-2 bg-purple-500/10 rounded-xl">
                        <Sparkles className="w-6 h-6 text-purple-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-text-primary">دستیار هوشمند آموزشی</h2>
                        <p className="text-sm text-text-secondary">سوالات درسی خود را بپرسید</p>
                    </div>
                </div>
                <button
                    onClick={startNewChat}
                    className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    گفتگوی جدید
                </button>
            </div>

            <div className="flex flex-1 min-h-0 relative">
                {/* Sidebar - session list */}
                {sidebarOpen && (
                    <div className="absolute inset-0 z-10 bg-surface-1 rounded-2xl border border-border p-3 flex flex-col gap-2 overflow-y-auto">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                                <History className="w-4 h-4" />
                                تاریخچه گفتگوها
                            </h3>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className="p-1 rounded-lg hover:bg-surface-2"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        {sessionsLoading ? (
                            <div className="text-center py-4 text-text-tertiary">در حال بارگذاری...</div>
                        ) : sessions.length === 0 ? (
                            <div className="text-center py-8 text-text-tertiary text-sm">
                                هنوز گفتگویی ندارید.
                                <br />
                                با دکمه «گفتگوی جدید» شروع کنید.
                            </div>
                        ) : (
                            sessions.map((s) => (
                                <div
                                    key={s.id}
                                    onClick={() => loadSession(s)}
                                    className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors ${s.id === currentSessionId ? 'bg-accent-muted' : 'hover:bg-surface-2'
                                        }`}
                                >
                                    <span className="text-sm truncate max-w-[80%]">
                                        {s.title || 'گفتگوی جدید'}
                                    </span>
                                    <button
                                        onClick={(e) => handleDeleteSession(s.id, e)}
                                        className="p-1 rounded-lg text-text-tertiary hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* Main chat area */}
                <div className="flex-1 flex flex-col min-h-0">
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-2 bg-surface-2 rounded-xl border border-border/50">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-text-secondary gap-2 p-6 text-center">
                                <MessageSquare className="w-12 h-12 text-text-secondary/40" />
                                <p className="font-medium">پیامی ارسال کنید تا گفتگو با هوش مصنوعی آغاز شود.</p>
                                <p className="text-xs max-w-sm">
                                    می‌توانید درباره زمان‌بندی‌ها، اهداف درسی، و یا ضعف‌های کارنامه خود راهنمایی دریافت کنید.
                                </p>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {quickActions.map((qa, idx) => (
                                        <button
                                            key={idx}
                                            onClick={qa.action}
                                            disabled={loading}
                                            className="flex items-center gap-2 bg-purple-600 text-white px-3 py-2 rounded-xl text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                                        >
                                            {qa.icon}
                                            {qa.label}
                                        </button>
                                    ))}
                                </div>
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
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input bar */}
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
            </div>
        </div>
    );
};

export default AiAssistantSection;