// src/components/admin/StudySessionDetails.tsx - COMPLETE FIXED
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatDate, formatMinutes } from '../../utils/date-utils';
import { toPersianDigits } from '../../utils/jalali';
import { Skeleton } from '../common/Loading';
import { Button } from '../common/Button';
import {
    ArrowRight,
    Clock,
    BookOpen,
    FileText,
    Code,
    Copy,
    Check,
    ChevronDown,
    ChevronUp,
    Sparkles,
    Database,
    Activity,
    User,
    AlertCircle,
    Download,
    Link as LinkIcon,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from '../../context/ThemeContext';

// ============================================================
// Types
// ============================================================

interface SessionDetail {
    id: string;
    user_id: string;
    subject_id: string | null;
    plan_id: string | null;
    date: string;
    duration_minutes: number;
    activities: string | null;
    resource: string | null;
    question_count: number | null;
    question_difficulty: string | null;
    estimated_difficulty: number | null;
    question_type: string | null;
    tags: string | null;
    todo_relation: string | null;
    created_at: string;
    updated_at: string;
    phone_hours: number | null;
    internal_status: string | null;
    metadata: Record<string, unknown> | null;
    revision_history: Record<string, unknown>[] | null;
    // Related data
    subjects?: { id: string; name: string; color: string } | null;
    plans?: { id: string; title: string; status: string } | null;
    users?: { id: string; name: string; email: string } | null;
}

// ============================================================
// Utilities
// ============================================================

const formatJson = (data: any): string => {
    try {
        return JSON.stringify(data, null, 2);
    } catch {
        return String(data);
    }
};

// ============================================================
// Section Component
// ============================================================

interface SectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    badge?: string | number;
    className?: string;
}

const Section: React.FC<SectionProps> = ({
    title,
    icon,
    children,
    defaultOpen = true,
    badge,
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`border border-border-subtle rounded-xl overflow-hidden bg-surface-1 ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-surface-2 hover:bg-surface-3 transition-colors text-right"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-3">
                    {icon}
                    <span className="text-sm font-semibold text-text-primary">{title}</span>
                    {badge !== undefined && badge !== null && badge !== 0 && (
                        <span className="text-xs text-text-tertiary bg-surface-3 px-2 py-0.5 rounded-full">
                            {typeof badge === 'number' ? toPersianDigits(badge) : badge}
                        </span>
                    )}
                </div>
                {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-text-tertiary" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-text-tertiary" />
                )}
            </button>
            {isOpen && <div className="p-4">{children}</div>}
        </div>
    );
};

// ============================================================
// Main Component
// ============================================================

export const StudySessionDetails: React.FC = () => {
    const { userId, sessionId } = useParams<{ userId: string; sessionId: string }>();
    const { user } = useAuth();
    const { showToast } = useToast();
    const { theme } = useTheme();

    const [session, setSession] = useState<SessionDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    const isAdmin = user?.is_admin || user?.role === 'admin';
    const isConsultant = user?.role === 'ai_olympiad_consultant';

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const codeStyle = isDark ? vscDarkPlus : vs;

    // ============================================================
    // Fetch Session Data
    // ============================================================

    useEffect(() => {
        const fetchSession = async () => {
            if (!sessionId || !userId) {
                setError('شناسه جلسه یا کاربر نامعتبر است');
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                // Fetch the session with related data
                const { data, error: fetchError } = await supabase
                    .from('study_sessions')
                    .select(`
            *,
            subjects(id, name, color),
            plans(id, title, status),
            users(id, name, email)
          `)
                    .eq('id', sessionId)
                    .eq('user_id', userId)
                    .single();

                if (fetchError) {
                    throw new Error(fetchError.message);
                }

                if (!data) {
                    throw new Error('جلسه مطالعه یافت نشد');
                }

                // For consultant, verify the user is in AI Olympiad
                if (isConsultant) {
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('olympiad_id, role')
                        .eq('id', userId)
                        .single();

                    if (userError || !userData || userData.olympiad_id !== 'ai' || userData.role !== 'student') {
                        throw new Error('شما دسترسی به این جلسه مطالعه را ندارید');
                    }
                }

                // Parse metadata if it's a string
                let metadata = data.metadata;
                if (typeof metadata === 'string') {
                    try {
                        metadata = JSON.parse(metadata);
                    } catch {
                        metadata = { raw: metadata };
                    }
                }

                // Parse revision_history if it's a string
                let revisionHistory = data.revision_history;
                if (typeof revisionHistory === 'string') {
                    try {
                        revisionHistory = JSON.parse(revisionHistory);
                    } catch {
                        revisionHistory = null;
                    }
                }

                setSession({
                    ...data,
                    metadata: metadata as Record<string, unknown> | null,
                    revision_history: revisionHistory as Record<string, unknown>[] | null,
                });
            } catch (err) {
                setError(err instanceof Error ? err.message : 'خطا در دریافت اطلاعات جلسه');
                console.error('Session fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSession();
    }, [sessionId, userId, isConsultant]);

    // ============================================================
    // Handlers
    // ============================================================

    const handleCopy = (text: string, key: string) => {
        if (!text) return;
        navigator.clipboard
            .writeText(text)
            .then(() => {
                setCopied(key);
                setTimeout(() => setCopied(null), 2000);
                showToast('کپی شد!', 'success');
            })
            .catch(() => {
                showToast('خطا در کپی کردن', 'error');
            });
    };

    const handleExportJson = () => {
        if (!session) return;
        const json = JSON.stringify(session, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session_${sessionId}_${session.date}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('خروجی JSON دانلود شد', 'success');
    };

    const handleExportMarkdown = () => {
        if (!session) return;
        const lines = [
            `# جلسه مطالعه - ${formatDate(session.date)}`,
            '',
            `**مدت:** ${formatMinutes(session.duration_minutes)}`,
            `**درس:** ${session.subjects?.name || 'بدون درس'}`,
            '',
            '## فعالیت‌ها',
            session.activities || '—',
            '',
            '## جزئیات',
            `**منبع:** ${session.resource || '—'}`,
            `**تعداد سوالات:** ${session.question_count ?? '—'}`,
            `**دشواری:** ${session.question_difficulty || '—'}`,
            `**نوع سوالات:** ${session.question_type || '—'}`,
            `**برچسب‌ها:** ${session.tags || '—'}`,
            '',
            '## متادیتا',
            session.metadata ? formatJson(session.metadata) : '—',
        ];
        const md = lines.join('\n');
        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `session_${sessionId}_${session.date}.md`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('خروجی Markdown دانلود شد', 'success');
    };

    // ============================================================
    // Render Helpers
    // ============================================================

    const renderValue = (value: any, key: string): React.ReactNode => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'string' && value.trim() === '') return null;

        if (typeof value === 'object') {
            const json = formatJson(value);
            return (
                <div className="relative">
                    <button
                        onClick={() => handleCopy(json, key)}
                        className="absolute left-2 top-2 p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors z-10"
                        title="کپی"
                    >
                        {copied === key ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <div className="bg-surface-2 rounded-xl p-4 overflow-x-auto max-h-80 overflow-y-auto">
                        <SyntaxHighlighter
                            language="json"
                            style={codeStyle}
                            customStyle={{ margin: 0, fontSize: '12px', borderRadius: '8px' }}
                        >
                            {json}
                        </SyntaxHighlighter>
                    </div>
                </div>
            );
        }

        if (typeof value === 'string' && (value.startsWith('http') || value.startsWith('https'))) {
            return (
                <a
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:text-accent-hover underline break-all"
                >
                    {value}
                </a>
            );
        }

        // Check if it's a markdown-like string
        if (typeof value === 'string' && (value.includes('\n') || value.includes('**') || value.includes('```') || value.includes('$'))) {
            return (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                        components={{
                            code: ({ className, children }) => {
                                const match = /language-(\w+)/.exec(className || '');
                                const code = String(children).replace(/\n$/, '');
                                if (match) {
                                    return (
                                        <SyntaxHighlighter language={match[1]} style={codeStyle}>
                                            {code}
                                        </SyntaxHighlighter>
                                    );
                                }
                                return <code className="bg-surface-3 px-1 py-0.5 rounded text-xs">{children}</code>;
                            },
                        }}
                    >
                        {value}
                    </ReactMarkdown>
                </div>
            );
        }

        return <span className="text-text-secondary">{String(value)}</span>;
    };

    const renderField = (label: string, value: any, key: string, format?: (v: any) => string): React.ReactNode => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'string' && value.trim() === '') return null;

        const displayValue = format ? format(value) : String(value);
        return (
            <div className="flex items-start gap-2 py-1.5 border-b border-border-subtle last:border-b-0">
                <span className="text-xs font-medium text-text-tertiary min-w-[120px] flex-shrink-0">{label}</span>
                <span className="text-sm text-text-primary break-all flex-1">{renderValue(value, key)}</span>
                {typeof displayValue === 'string' && displayValue.length > 0 && (
                    <button
                        onClick={() => handleCopy(displayValue, key)}
                        className="ml-auto p-1 rounded-lg hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors flex-shrink-0"
                        title="کپی"
                    >
                        {copied === key ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                )}
            </div>
        );
    };

    // ============================================================
    // Loading / Error States
    // ============================================================

    if (loading) {
        return (
            <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-xl" />
                    <Skeleton className="h-8 w-48" />
                </div>
                <Skeleton className="h-64 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Skeleton className="h-40 rounded-2xl" />
                    <Skeleton className="h-40 rounded-2xl" />
                </div>
            </div>
        );
    }

    if (error || !session) {
        return (
            <div className="p-5 md:p-8 max-w-4xl mx-auto">
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error || 'جلسه مطالعه یافت نشد'}</span>
                </div>
                <Link
                    to={isConsultant ? `/admin/ai/users/${userId}` : `/admin/users/${userId}`}
                    className="mt-4 inline-flex items-center gap-2 text-accent hover:text-accent-hover"
                >
                    <ArrowRight className="w-4 h-4" />
                    بازگشت به پروفایل کاربر
                </Link>
            </div>
        );
    }

    // ============================================================
    // Main Render
    // ============================================================

    const metadata = session.metadata || {};
    const revisionHistory = session.revision_history || [];

    // Check if there's AI conversation data
    const hasAIData = !!(metadata.ai_conversation || metadata.ai_prompt || metadata.ai_response);

    // Helper to render metadata fields
    const renderMetadataFields = () => {
        const entries = Object.entries(metadata).filter(([key]) => !['ai_conversation', 'ai_prompt', 'ai_response'].includes(key));
        if (entries.length === 0) return null;
        return (
            <Section title="داده‌های فراداده" icon={<Database className="w-4 h-4 text-amber-500" />} defaultOpen={false}>
                <div className="space-y-1">
                    {entries.map(([key, value]) => renderField(key, value, `metadata_${key}`))}
                </div>
            </Section>
        );
    };

    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6" dir="rtl">
            {/* ===== Header ===== */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        to={isConsultant ? `/admin/ai/users/${userId}` : `/admin/users/${userId}`}
                        className="p-2 rounded-xl hover:bg-surface-2 text-text-tertiary hover:text-text-primary transition-colors"
                    >
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-text-primary">جزئیات جلسه مطالعه</h1>
                        <p className="text-sm text-text-secondary mt-1 flex items-center gap-2 flex-wrap">
                            <span>{formatDate(session.date)}</span>
                            <span className="text-text-tertiary">·</span>
                            <span>{formatMinutes(session.duration_minutes)}</span>
                            {session.subjects && (
                                <>
                                    <span className="text-text-tertiary">·</span>
                                    <span
                                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                                        style={{
                                            backgroundColor: session.subjects.color + '20',
                                            color: session.subjects.color,
                                        }}
                                    >
                                        {session.subjects.name}
                                    </span>
                                </>
                            )}
                            {session.plans && (
                                <>
                                    <span className="text-text-tertiary">·</span>
                                    <span className="text-xs text-text-secondary">
                                        برنامه: {session.plans.title}
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="secondary" size="sm" onClick={handleExportJson}>
                        <Download className="w-4 h-4" />
                        JSON
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleExportMarkdown}>
                        <FileText className="w-4 h-4" />
                        Markdown
                    </Button>
                    <Link to={isConsultant ? `/admin/ai/users/${userId}` : `/admin/users/${userId}`}>
                        <Button variant="secondary" size="sm">
                            بازگشت
                        </Button>
                    </Link>
                </div>
            </div>

            {/* ===== General Section ===== */}
            <Section title="اطلاعات عمومی" icon={<FileText className="w-4 h-4 text-accent" />} defaultOpen={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {renderField('شناسه جلسه', session.id, 'id')}
                    {renderField('شناسه کاربر', session.user_id, 'user_id')}
                    {renderField('کاربر', session.users?.name, 'user_name')}
                    {renderField('ایمیل کاربر', session.users?.email, 'user_email')}
                    {renderField('تاریخ', session.date, 'date', (v) => formatDate(v))}
                    {renderField('مدت (دقیقه)', session.duration_minutes, 'duration', (v) => formatMinutes(v))}
                    {renderField('درس', session.subjects?.name, 'subject_name')}
                    {renderField('برنامه', session.plans?.title, 'plan_name')}
                    {renderField('وضعیت برنامه', session.plans?.status, 'plan_status')}
                    {renderField('تاریخ ایجاد', session.created_at, 'created_at', (v) => formatDate(v))}
                    {renderField('آخرین بروزرسانی', session.updated_at, 'updated_at', (v) => formatDate(v))}
                    {renderField('وضعیت داخلی', session.internal_status, 'internal_status')}
                </div>
            </Section>

            {/* ===== Activities Section ===== */}
            {session.activities ? (
                <Section title="فعالیت‌ها" icon={<Activity className="w-4 h-4 text-emerald-500" />} defaultOpen={true}>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                        <ReactMarkdown
                            remarkPlugins={[remarkMath]}
                            rehypePlugins={[rehypeKatex]}
                            components={{
                                code: ({ className, children }) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    const code = String(children).replace(/\n$/, '');
                                    if (match) {
                                        return (
                                            <SyntaxHighlighter language={match[1]} style={codeStyle}>
                                                {code}
                                            </SyntaxHighlighter>
                                        );
                                    }
                                    return <code className="bg-surface-3 px-1 py-0.5 rounded text-xs">{children}</code>;
                                },
                            }}
                        >
                            {session.activities}
                        </ReactMarkdown>
                    </div>
                    <button
                        onClick={() => handleCopy(session.activities || '', 'activities')}
                        className="mt-3 text-xs text-accent hover:text-accent-hover flex items-center gap-1"
                    >
                        {copied === 'activities' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        کپی فعالیت‌ها
                    </button>
                </Section>
            ) : null}

            {/* ===== Study Data Section ===== */}
            <Section title="داده‌های مطالعه" icon={<BookOpen className="w-4 h-4 text-blue-500" />} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {renderField('منبع', session.resource, 'resource')}
                    {renderField('تعداد سوالات', session.question_count, 'question_count')}
                    {renderField('دشواری سوالات', session.question_difficulty, 'question_difficulty')}
                    {renderField('دشواری تخمینی', session.estimated_difficulty, 'estimated_difficulty')}
                    {renderField('نوع سوالات', session.question_type, 'question_type')}
                    {renderField('برچسب‌ها', session.tags, 'tags')}
                    {renderField('ارتباط با وظیفه', session.todo_relation, 'todo_relation')}
                    {renderField('ساعت گوشی', session.phone_hours, 'phone_hours')}
                </div>
            </Section>

            {/* ===== AI Analysis Section ===== */}
            {hasAIData ? (
                <Section title="تحلیل هوش مصنوعی" icon={<Sparkles className="w-4 h-4 text-purple-500" />} defaultOpen={false}>
                    {metadata.ai_conversation ? renderField('مکالمه AI', metadata.ai_conversation, 'ai_conversation') : null}
                    {metadata.ai_prompt ? renderField('پرامپت AI', metadata.ai_prompt, 'ai_prompt') : null}
                    {metadata.ai_response ? renderField('پاسخ AI', metadata.ai_response, 'ai_response') : null}
                </Section>
            ) : null}

            {/* ===== Metadata Section ===== */}
            {renderMetadataFields()}

            {/* ===== Revision History ===== */}
            {revisionHistory.length > 0 ? (
                <Section
                    title="تاریخچه تغییرات"
                    icon={<Clock className="w-4 h-4 text-gray-500" />}
                    defaultOpen={false}
                    badge={revisionHistory.length}
                >
                    <div className="space-y-3">
                        {revisionHistory.map((revision, index) => (
                            <div key={index} className="bg-surface-2 rounded-xl p-3 border border-border-subtle">
                                <div className="flex items-center justify-between text-xs text-text-tertiary mb-2">
                                    <span>نسخه {index + 1}</span>
                                    {revision.timestamp ? <span>{formatDate(String(revision.timestamp))}</span> : null}
                                    {revision.user ? <span>توسط: {String(revision.user)}</span> : null}
                                    {revision.action ? <span className="px-2 py-0.5 bg-surface-3 rounded-full">{String(revision.action)}</span> : null}
                                </div>
                                <pre className="text-xs whitespace-pre-wrap break-words bg-surface-1 p-2 rounded-lg max-h-40 overflow-y-auto">
                                    {formatJson(revision)}
                                </pre>
                            </div>
                        ))}
                    </div>
                </Section>
            ) : null}

            {/* ===== Raw JSON Section ===== */}
            <Section title="داده‌های خام JSON" icon={<Code className="w-4 h-4 text-indigo-500" />} defaultOpen={false}>
                <div className="relative">
                    <button
                        onClick={() => handleCopy(formatJson(session), 'raw_json')}
                        className="absolute left-2 top-2 p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 text-text-tertiary hover:text-text-primary transition-colors z-10"
                        title="کپی"
                    >
                        {copied === 'raw_json' ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <div className="bg-surface-2 rounded-xl p-4 overflow-x-auto max-h-96 overflow-y-auto">
                        <SyntaxHighlighter language="json" style={codeStyle} customStyle={{ margin: 0, fontSize: '12px' }}>
                            {formatJson(session)}
                        </SyntaxHighlighter>
                    </div>
                </div>
            </Section>

            {/* ===== Related Data (links to other entities) ===== */}
            {(session.plan_id || session.subject_id) ? (
                <Section title="داده‌های مرتبط" icon={<LinkIcon className="w-4 h-4 text-cyan-500" />} defaultOpen={false}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {session.subject_id && session.subjects ? (
                            <div className="bg-surface-2 rounded-xl p-3">
                                <span className="text-xs text-text-tertiary">درس</span>
                                <p className="text-sm font-medium text-text-primary flex items-center gap-2">
                                    <span
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: session.subjects.color }}
                                    />
                                    {session.subjects.name}
                                    <span className="text-xs text-text-tertiary font-normal">({session.subject_id})</span>
                                </p>
                            </div>
                        ) : null}
                        {session.plan_id && session.plans ? (
                            <div className="bg-surface-2 rounded-xl p-3">
                                <span className="text-xs text-text-tertiary">برنامه</span>
                                <p className="text-sm font-medium text-text-primary">
                                    {session.plans.title}
                                    <span className="text-xs text-text-tertiary font-normal mr-2">({session.plans.status})</span>
                                </p>
                            </div>
                        ) : null}
                    </div>
                </Section>
            ) : null}

            {/* ===== Actions ===== */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-border-subtle">
                <Link to={isConsultant ? `/admin/ai/users/${userId}` : `/admin/users/${userId}`}>
                    <Button variant="secondary">
                        <ArrowRight className="w-4 h-4" />
                        بازگشت به پروفایل کاربر
                    </Button>
                </Link>
                <Button variant="secondary" onClick={handleExportJson}>
                    <Download className="w-4 h-4" />
                    دانلود JSON
                </Button>
                <Button variant="secondary" onClick={handleExportMarkdown}>
                    <FileText className="w-4 h-4" />
                    دانلود Markdown
                </Button>
                {isAdmin ? (
                    <Link to={`/admin/users/${userId}`}>
                        <Button variant="primary">
                            <User className="w-4 h-4" />
                            مشاهده کاربر
                        </Button>
                    </Link>
                ) : null}
            </div>
        </div>
    );
};

export default StudySessionDetails;