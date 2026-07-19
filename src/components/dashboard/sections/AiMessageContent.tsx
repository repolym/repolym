import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import { AlertTriangle } from 'lucide-react'
import { sanitizeAiResponse } from '../../../utils/ai-response-parser'

interface AiMessageContentProps {
    /** محتوای خام پیام (ممکن است متن ساده، Markdown، یا JSON خام/فنس‌شده باشد) */
    content: string
    /** true اگر پیام از سمت کاربر است (بدون رندر Markdown، فقط متن ساده) */
    isUser?: boolean
}

/**
 * رندرکنندهٔ مشترک محتوای چت دستیار هوشمند.
 * - هرگز JSON خام یا فنس ```json را به کاربر نشان نمی‌دهد (ر.ک. ai-response-parser.ts)
 * - Markdown استاندارد (بولد، لیست، تیتر، بلاک کد) را رندر می‌کند
 * - اگر بعد از پاک‌سازی محتوای قابل‌نمایشی باقی نماند، یک پیام خطای دوستانه نشان می‌دهد
 */
export const AiMessageContent: React.FC<AiMessageContentProps> = ({ content, isUser = false }) => {
    const safeText = useMemo(() => sanitizeAiResponse(content), [content])

    if (isUser) {
        // پیام‌های کاربر همیشه متن ساده هستند؛ نیازی به Markdown/پارس ندارند
        return <p className="whitespace-pre-line break-words">{content}</p>
    }

    if (!safeText.trim()) {
        return (
            <div className="flex items-center gap-2 text-amber-600 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>پاسخ دریافتی قابل نمایش نبود. لطفاً دوباره تلاش کنید.</span>
            </div>
        )
    }

    return (
        <div className="ai-markdown text-sm leading-relaxed break-words">
            <ReactMarkdown
                components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0 whitespace-pre-line">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pr-5 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pr-5 mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="text-text-primary">{children}</li>,
                    strong: ({ children }) => <strong className="font-bold text-text-primary">{children}</strong>,
                    em: ({ children }) => <em className="italic">{children}</em>,
                    h1: ({ children }) => <h1 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-bold mb-1.5 mt-2 first:mt-0">{children}</h3>,
                    a: ({ children, href }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent underline hover:text-accent-hover"
                        >
                            {children}
                        </a>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="border-r-2 border-accent-subtle pr-3 my-2 text-text-secondary">
                            {children}
                        </blockquote>
                    ),
                    code: ({ className, children, ...props }) => {
                        const isInline = !className
                        if (isInline) {
                            return (
                                <code
                                    className="bg-surface-3 text-accent-hover px-1.5 py-0.5 rounded-md text-xs font-mono"
                                    {...props}
                                >
                                    {children}
                                </code>
                            )
                        }
                        return (
                            <pre className="bg-surface-4/20 border border-border-subtle rounded-xl p-3 overflow-x-auto my-2 max-w-full">
                                <code className="text-xs font-mono text-text-primary whitespace-pre" {...props}>
                                    {children}
                                </code>
                            </pre>
                        )
                    },
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-2">
                            <table className="w-full text-xs border-collapse">{children}</table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th className="border border-border-subtle px-2 py-1 bg-surface-2 text-right">{children}</th>
                    ),
                    td: ({ children }) => <td className="border border-border-subtle px-2 py-1">{children}</td>,
                }}
            >
                {safeText}
            </ReactMarkdown>
        </div>
    )
}

export default AiMessageContent