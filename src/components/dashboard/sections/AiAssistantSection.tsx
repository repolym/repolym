// src/components/dashboard/sections/AiAssistantSection.tsx (complete)
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { supabase } from '../../../config/supabase';
import { useChatSessions, ChatMessage, ChatSession } from '../../../hooks/useChatSessions';
import { AiMessageContent } from './AiMessageContent';
import { sanitizeAiResponse } from '../../../utils/ai-response-parser';
import {
    Sparkles,
    Send,
    BrainCircuit,
    Loader2,
    Plus,
    Trash2,
    Menu,
    X,
    History,
    Target,
    Award,
    Zap,
    SlidersHorizontal,
    Maximize2,
    Minimize2,
    Search,
    Copy,
    Check,
} from 'lucide-react';

type Action = 'chat' | 'analyze' | 'recommend' | 'summarize';
type ComplexityLevel = 'simple' | 'medium' | 'advanced';

export const AiAssistantSection: React.FC = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const { sessions, loading: sessionsLoading, createSession, updateSession, deleteSession, refetch } =
        useChatSessions(user?.id ?? null);

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [streamingContent, setStreamingContent] = useState('');
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [complexity, setComplexity] = useState<ComplexityLevel>('medium');
    const [showComplexitySelector, setShowComplexitySelector] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedAll, setCopiedAll] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/ai-assistant`;

    const toggleFullScreen = () => {
        setIsFullScreen(!isFullScreen);
    };

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isFullScreen) {
                setIsFullScreen(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [isFullScreen]);

    const loadSession = (session: ChatSession) => {
        setCurrentSessionId(session.id);
        setMessages(session.messages || []);
        setSidebarOpen(false);
        setSearchTerm('');
    };

    const startNewChat = async () => {
        const newSession = await createSession({ title: 'گفتگوی جدید' });
        if (newSession) {
            setCurrentSessionId(newSession.id);
            setMessages([]);
            setSidebarOpen(false);
            setSearchTerm('');
        }
    };

    const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('آیا از حذف این گفتگو اطمینان دارید؟')) return;
        const ok = await deleteSession(id);
        if (ok) {
            showToast('گفتگو حذف شد', 'success');
            if (currentSessionId === id) {
                setCurrentSessionId(null);
                setMessages([]);
                setSearchTerm('');
            }
        } else {
            showToast('خطا در حذف گفتگو', 'error');
        }
    };

    const saveMessagesToSession = async (sessionId: string, newMessages: ChatMessage[]) => {
        await updateSession(sessionId, { messages: newMessages });
    };

    const callAiFunctionStream = async (action: Action, payload: any): Promise<string> => {
        setLoading(true);
        setStreamingContent('');
        const isDev = import.meta.env.MODE === 'development';

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const payloadWithComplexity = { ...payload, complexity, stream: true };

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action, data: payloadWithComplexity }),
            });

            if (!response.ok) {
                let errorText = `HTTP error ${response.status}`;
                try {
                    const errJson = await response.json();
                    errorText = errJson.error || errorText;
                } catch {
                    errorText = await response.text();
                }
                throw new Error(errorText);
            }

            const contentType = response.headers.get('content-type') || '';
            if (contentType.includes('application/json')) {
                // Non-streaming fallback
                const json = await response.json();
                if (json.success) {
                    if (action === 'chat') {
                        return json.data?.message || 'پاسخی دریافت نشد';
                    }
                    return sanitizeAiResponse(JSON.stringify(json.data)) || 'پاسخی دریافت نشد';
                } else {
                    throw new Error(json.error || 'Unknown error');
                }
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No response body');
            }

            const decoder = new TextDecoder();
            let fullContent = '';
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.type === 'chunk' && data.content) {
                                fullContent += data.content;
                                setStreamingContent(fullContent);
                            } else if (data.type === 'done') {
                                return fullContent;
                            } else if (data.type === 'error') {
                                throw new Error(data.message || 'Unknown error');
                            }
                        } catch (e) {
                            if (isDev) console.warn('SSE parse error:', e);
                        }
                    }
                }
            }

            return sanitizeAiResponse(fullContent) || 'پاسخی دریافت نشد';

        } catch (err: any) {
            const errorMsg = isDev
                ? err.message
                : 'ارتباط با دستیار هوشمند برقرار نشد. لطفاً دوباره تلاش کنید.';
            showToast(errorMsg, 'error');
            return `⚠️ ${errorMsg}`;
        } finally {
            setLoading(false);
            setStreamingContent('');
        }
    };

    const callAiFunction = async (action: Action, payload: any): Promise<string> => {
        setLoading(true);
        const isDev = import.meta.env.MODE === 'development';
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;

            const payloadWithComplexity = { ...payload, complexity };

            const response = await fetch(functionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ action, data: payloadWithComplexity }),
            });

            const result = await response.json();
            if (!result.success) {
                const errorMsg = isDev
                    ? (result.error || 'خطا در پاسخ هوش مصنوعی')
                    : 'ارتباط با دستیار هوشمند برقرار نشد. لطفاً دوباره تلاش کنید.';
                throw new Error(errorMsg);
            }

            if (action === 'chat') {
                return sanitizeAiResponse(result.data?.message) || 'پاسخی دریافت نشد';
            }
            if (action === 'analyze') {
                const d = result.data;
                let summary = sanitizeAiResponse(d.summary) || '';
                if (d.strengths?.length) summary += '\n\n**نقاط قوت:**\n' + d.strengths.map((s: string) => `- ${s}`).join('\n');
                if (d.weaknesses?.length) summary += '\n\n**نقاط ضعف:**\n' + d.weaknesses.map((w: string) => `- ${w}`).join('\n');
                if (d.recommendations?.length) summary += '\n\n**پیشنهادات:**\n' + d.recommendations.map((r: string) => `- ${r}`).join('\n');
                if (d.motivation) summary += '\n\n---\n\n' + d.motivation;
                return summary || 'تحلیل کامل شد، اما داده‌ای برای نمایش وجود ندارد.';
            }
            if (action === 'recommend') {
                const data = result.data || {};
                const recs = data.recommendations || [];
                let output = '**پیشنهادات هوشمند:**\n' + recs.map((r: string) => `- ${r}`).join('\n');
                if (data.insight) output += '\n\n**بینش کلی:** ' + data.insight;
                if (data.next_step) output += '\n\n**گام بعدی شما:** ' + data.next_step;
                return output || 'پیشنهادی برای نمایش وجود ندارد.';
            }
            if (action === 'summarize') {
                return sanitizeAiResponse(result.data?.summary) || 'خلاصه‌سازی انجام نشد.';
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

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

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

        await saveMessagesToSession(sessionId, updatedMessages);

        const history = updatedMessages.map(m => ({ role: m.role, content: m.content }));
        const response = await callAiFunctionStream('chat', {
            messages: history,
            userId: user?.id,
        });

        const finalContent = response;
        const assistantMsg: ChatMessage = { role: 'assistant', content: finalContent };
        const finalMessages = [...updatedMessages, assistantMsg];
        setMessages(finalMessages);
        setStreamingContent('');

        await saveMessagesToSession(sessionId, finalMessages);

        const session = sessions.find(s => s.id === sessionId);
        if (session && (!session.title || session.title === 'گفتگوی جدید') && userMsg.content.length > 10) {
            await updateSession(sessionId, { title: userMsg.content.slice(0, 50) + '...' });
            refetch();
        }
    };

    const quickActions = [
        {
            label: 'تحلیل عملکرد ماهانه',
            icon: <BrainCircuit className="w-4 h-4" />,
            description: 'دریافت تحلیل کامل عملکرد و نقاط قوت و ضعف',
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
            label: 'برنامه مطالعه شخصی‌سازی‌شده',
            icon: <Target className="w-4 h-4" />,
            description: 'دریافت برنامه مطالعه اختصاصی بر اساس داده‌های شما',
            action: async () => {
                let sessionId = currentSessionId;
                if (!sessionId) {
                    const newSession = await createSession({ title: 'برنامه مطالعه' });
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
        {
            label: 'نکته انگیزشی روز',
            icon: <Zap className="w-4 h-4" />,
            description: 'یک پیام انگیزشی متناسب با سطح شما',
            action: async () => {
                let sessionId = currentSessionId;
                if (!sessionId) {
                    const newSession = await createSession({ title: 'انگیزش' });
                    if (!newSession) return;
                    sessionId = newSession.id;
                    setCurrentSessionId(sessionId);
                }
                const result = await callAiFunction('analyze', {
                    userId: user?.id,
                    period: 'week',
                });
                const lines = result.split('\n');
                const motivationLines = lines.filter(line => line.includes('---') || line.includes('💪') || line.includes('🚀'));
                const msg: ChatMessage = {
                    role: 'assistant',
                    content: motivationLines.length > 0 ? motivationLines.join('\n') : 'به راه خود ادامه دهید. هر روز قدمی به جلو! 💪'
                };
                const newMessages = [...messages, msg];
                setMessages(newMessages);
                await saveMessagesToSession(sessionId, newMessages);
            },
        },
        {
            label: 'پرسش درسی',
            icon: <Award className="w-4 h-4" />,
            description: 'سوالات درسی خود را بپرسید و پاسخ دقیق دریافت کنید',
            action: async () => {
                const inputElement = document.querySelector('input[type="text"]') as HTMLInputElement;
                if (inputElement) inputElement.focus();
            },
        },
    ];

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, streamingContent]);

    useEffect(() => {
        if (sessions.length > 0 && !currentSessionId) {
            const latest = sessions[0];
            loadSession(latest);
        }
    }, [sessions]);

    const complexityLabels: Record<ComplexityLevel, string> = {
        simple: 'ساده و سریع',
        medium: 'متوسط',
        advanced: 'پیشرفته و تحلیلی',
    };

    const complexityDescriptions: Record<ComplexityLevel, string> = {
        simple: 'پاسخ‌های مختصر و سریع',
        medium: 'پاسخ‌های متعادل',
        advanced: 'تحلیل عمیق با مدل پیشرفته',
    };

    const allMessages = useMemo(() => {
        const base = [...messages];
        if (loading && streamingContent) {
            const lastMsg = base[base.length - 1];
            if (lastMsg?.role === 'assistant') {
                const updated = [...base];
                updated[updated.length - 1] = { ...lastMsg, content: streamingContent };
                return updated;
            } else {
                return [...base, { role: 'assistant' as const, content: streamingContent }];
            }
        }
        return base;
    }, [messages, loading, streamingContent]);

    const filteredMessages = useMemo(() => {
        if (!searchTerm.trim()) return allMessages;
        const term = searchTerm.trim().toLowerCase();
        return allMessages.filter(msg =>
            msg.content.toLowerCase().includes(term)
        );
    }, [allMessages, searchTerm]);

    const handleCopyAll = async () => {
        const text = filteredMessages
            .map(m => `${m.role === 'user' ? '👤 کاربر' : '🤖 Repolym'}:\n${m.content}`)
            .join('\n\n---\n\n');
        try {
            await navigator.clipboard.writeText(text);
            setCopiedAll(true);
            setTimeout(() => setCopiedAll(false), 2000);
            showToast('مکالمه کپی شد!', 'success');
        } catch {
            showToast('خطا در کپی کردن', 'error');
        }
    };

    const containerClass = isFullScreen
        ? 'fixed inset-0 z-50 bg-surface-1 rounded-none border-0 p-4 sm:p-6 flex flex-col h-screen max-h-none min-h-screen'
        : 'bg-surface-1 rounded-2xl border border-border p-4 sm:p-6 flex flex-col h-[75vh] max-h-[700px] min-h-[450px]';

    return (
        <div ref={containerRef} className={containerClass} dir="rtl">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3 flex-wrap gap-2 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-2 rounded-xl hover:bg-surface-2 transition-colors flex-shrink-0"
                    >
                        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base sm:text-lg font-bold text-text-primary truncate">مربی هوشمند Repolym</h2>
                        <p className="text-xs sm:text-sm text-text-secondary truncate">دستیار شخصی شما برای موفقیت در المپیاد</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={toggleFullScreen}
                        className="p-2 rounded-xl hover:bg-surface-2 transition-colors text-text-secondary hover:text-text-primary"
                        title={isFullScreen ? 'خروج از تمام صفحه' : 'تمام صفحه'}
                    >
                        {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowComplexitySelector(!showComplexitySelector)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${showComplexitySelector
                                ? 'border-accent bg-accent-muted text-accent-hover'
                                : 'border-border hover:bg-surface-2 text-text-secondary'
                                }`}
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            <span className="hidden sm:inline">{complexityLabels[complexity]}</span>
                        </button>
                        {showComplexitySelector && (
                            <div className="absolute left-0 top-full mt-2 w-52 bg-surface-1 border border-border rounded-xl shadow-lg p-2 z-20">
                                {(['simple', 'medium', 'advanced'] as ComplexityLevel[]).map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => {
                                            setComplexity(level);
                                            setShowComplexitySelector(false);
                                        }}
                                        className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${complexity === level
                                            ? 'bg-accent-muted text-accent-hover'
                                            : 'hover:bg-surface-2 text-text-secondary'
                                            }`}
                                    >
                                        <div className="font-medium">{complexityLabels[level]}</div>
                                        <div className="text-xs text-text-tertiary">{complexityDescriptions[level]}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <button
                        onClick={startNewChat}
                        className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors flex-shrink-0 shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">گفتگوی جدید</span>
                    </button>
                </div>
            </div>

            <div className="flex items-center gap-2 mb-3 shrink-0">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="جستجو در مکالمات..."
                        className="w-full bg-surface-2 border border-border rounded-xl px-9 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                </div>
                <button
                    onClick={handleCopyAll}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 border border-border transition-colors text-sm text-text-secondary hover:text-text-primary"
                    title="کپی کل مکالمه"
                >
                    {copiedAll ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    <span className="hidden sm:inline text-xs">کپی همه</span>
                </button>
                {searchTerm && (
                    <span className="text-xs text-text-tertiary whitespace-nowrap">
                        {filteredMessages.length} از {allMessages.length}
                    </span>
                )}
            </div>

            <div className="flex flex-1 min-h-0 relative">
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
                                        className="p-1 rounded-lg text-text-tertiary hover:text-red-500 transition-colors flex-shrink-0"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 mb-4 p-2 bg-surface-2 rounded-xl border border-border/50">
                        {filteredMessages.length === 0 && !loading ? (
                            <div className="h-full flex flex-col items-center justify-center text-text-secondary gap-3 p-4 sm:p-6 text-center">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-indigo-600" />
                                </div>
                                <p className="font-bold text-lg text-text-primary">به مربی هوشمند Repolym خوش آمدید</p>
                                <p className="text-sm max-w-sm text-text-secondary">
                                    سوالات درسی، تحلیل عملکرد، برنامه مطالعه و نکات انگیزشی — همه در یک جا
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 w-full max-w-md">
                                    {quickActions.map((qa, idx) => (
                                        <button
                                            key={idx}
                                            onClick={qa.action}
                                            disabled={loading}
                                            className="flex items-center gap-3 bg-surface-1 border border-border hover:border-accent hover:shadow-md rounded-xl px-4 py-3 text-right transition-all disabled:opacity-50"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-indigo-600">
                                                {qa.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-text-primary">{qa.label}</p>
                                                <p className="text-2xs text-text-tertiary truncate">{qa.description}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            filteredMessages.map((msg, index) => {
                                const isUser = msg.role === 'user';
                                return (
                                    <div
                                        key={index}
                                        className={`flex ${isUser ? 'justify-start' : 'justify-end'} w-full`}
                                    >
                                        <div
                                            className={`max-w-[90%] sm:max-w-[85%] min-w-0 rounded-2xl px-3 sm:px-4 py-3 text-sm leading-relaxed shadow-sm ${isUser
                                                ? 'bg-accent-muted text-accent-hover rounded-tr-none border border-accent-subtle/30'
                                                : 'bg-surface-1 border border-border text-text-primary rounded-tl-none'
                                                }`}
                                        >
                                            <AiMessageContent
                                                content={msg.content}
                                                isUser={isUser}
                                            />
                                            {index === filteredMessages.length - 1 && loading && streamingContent && !isUser && (
                                                <span className="inline-block w-1.5 h-4 bg-accent animate-pulse ml-1" />
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {loading && !streamingContent && (
                            <div className="flex justify-end">
                                <div className="bg-surface-1 border border-border rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-2 text-sm text-text-secondary shadow-sm">
                                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                                    <span>در حال نوشتن پاسخ...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="سوال خود را اینجا بنویسید..."
                            disabled={loading}
                            className="flex-1 min-w-0 bg-surface-2 border border-border rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors disabled:opacity-50 text-right placeholder-text-tertiary"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center flex-shrink-0 shadow-md"
                        >
                            <Send className="w-4 h-4 rotate-180" />
                        </button>
                    </form>
                </div>
            </div>

            {isFullScreen && (
                <button
                    onClick={toggleFullScreen}
                    className="absolute top-4 left-4 p-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text-primary transition-colors z-50"
                    title="خروج از تمام صفحه"
                >
                    <X className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};

export default AiAssistantSection;