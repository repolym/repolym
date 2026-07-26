import React, { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { AlertTriangle, Copy, Check } from 'lucide-react'
import { sanitizeAiResponse } from '../../../utils/ai-response-parser'
import { useTheme } from '../../../context/ThemeContext'

// Import KaTeX CSS
import 'katex/dist/katex.min.css'

interface AiMessageContentProps {
    content: string
    isUser?: boolean
}

// تابعی برای تبدیل فرمول‌های بدون $ به فرمت قابل قبول
// این تابع به‌عنوان یک لایه امنیتی عمل می‌کند
const normalizeMathNotation = (text: string): string => {
    if (!text) return text

    // 1. ابتدا فرمول‌هایی که با \(...\) یا \[...\] نوشته شده‌اند را حفظ می‌کنیم
    // 2. سپس فرمول‌هایی که با $...$ یا $$...$$ نوشته شده‌اند را حفظ می‌کنیم
    // 3. برای فرمول‌هایی که بدون هیچ delimiter نوشته شده‌اند، تلاش می‌کنیم تشخیص دهیم

    let result = text

    // الگوهای ریاضی رایج که ممکن است بدون $ نوشته شوند:
    // - توابع با f(x), g(x), ...
    // - توان‌ها: x^2, x^{n+1}
    // - کسرها: a/b
    // - مشتقات: f'(x), dy/dx
    // - انتگرال‌ها: ∫
    // - بردارها: \vec{v}
    // - مجموعه‌ها: \mathbb{R}

    // تشخیص و تبدیل patternهای رایج ریاضی به LaTeX با $
    // این کار را با دقت بالا انجام می‌دهیم تا متن عادی را خراب نکند

    // ابتدا اطمینان حاصل می‌کنیم که هیچ $ اضافی در متن نیست
    // اگر متن از قبل $ دارد، آن را تغییر نمی‌دهیم

    // اگر متن حداقل یک $ دارد، فرض می‌کنیم که کاربر/مدل از LaTeX استفاده کرده
    if (text.includes('$') || text.includes('\\(') || text.includes('\\[')) {
        return text
    }

    // در غیر این صورت، سعی می‌کنیم فرمول‌های آشکار را تشخیص دهیم
    // مثال: f(x) = x^2 + 2x + 1 → $f(x) = x^2 + 2x + 1$
    // اما خیلی محافظه‌کارانه عمل می‌کنیم تا متن عادی تغییر نکند


    // فقط اگر الگوی ریاضی واضحی تشخیص داده شد، آن را به $ $ تبدیل می‌کنیم
    // اما برای جلوگیری از تغییرات ناخواسته، این بخش را محدود می‌کنیم
    // بهتر است کاربر و مدل خودشان از $ استفاده کنند

    return result
}

const mathStyles = `
  .ai-markdown .katex {
    direction: ltr !important;
    unicode-bidi: embed;
  }
  .ai-markdown .katex-display {
    direction: ltr !important;
    unicode-bidi: embed;
    text-align: center !important;
    margin: 0.75em 0;
    overflow-x: auto;
    overflow-y: hidden;
  }
  .ai-markdown .katex-display > .katex {
    display: inline-block;
    text-align: left;
  }
  .ai-markdown .katex .mathnormal,
  .ai-markdown .katex .mord,
  .ai-markdown .katex .mbin,
  .ai-markdown .katex .mrel,
  .ai-markdown .katex .mopen,
  .ai-markdown .katex .mclose,
  .ai-markdown .katex .mpunct,
  .ai-markdown .katex .minner {
    direction: ltr !important;
    unicode-bidi: embed;
  }
  .dark .ai-markdown {
    color: #e5e7eb !important;
  }
  .dark .ai-markdown .text-text-primary {
    color: #e5e7eb !important;
  }
  .dark .ai-markdown .text-text-secondary {
    color: #9ca3af !important;
  }
  .dark .ai-markdown h1,
  .dark .ai-markdown h2,
  .dark .ai-markdown h3,
  .dark .ai-markdown strong {
    color: #f3f4f6 !important;
  }
  .dark .ai-markdown code {
    background: #374151 !important;
    color: #e5e7eb !important;
  }
  .dark .ai-markdown blockquote {
    background: rgba(55, 65, 81, 0.5) !important;
    color: #d1d5db !important;
  }
  .dark .ai-markdown table th {
    background: #374151 !important;
    color: #f3f4f6 !important;
  }
  .dark .ai-markdown table td {
    color: #d1d5db !important;
  }
  .dark .ai-markdown table {
    border-color: #4b5563 !important;
  }
  .dark .ai-markdown .border-border-subtle {
    border-color: #374151 !important;
  }
`

export const AiMessageContent: React.FC<AiMessageContentProps> = ({ content, isUser = false }) => {
    const { theme } = useTheme()

    // ابتدا متن را از JSON پاک می‌کنیم (اگر JSON باشد)
    const rawText = useMemo(() => sanitizeAiResponse(content), [content])

    // سپس فرمول‌های بدون $ را normalize می‌کنیم
    const safeText = useMemo(() => normalizeMathNotation(rawText), [rawText])

    const [copiedMessage, setCopiedMessage] = React.useState(false)

    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    const codeStyle = isDark ? vscDarkPlus : vs

    const handleCopyMessage = async () => {
        try {
            await navigator.clipboard.writeText(content)
            setCopiedMessage(true)
            setTimeout(() => setCopiedMessage(false), 2000)
        } catch {
            const textarea = document.createElement('textarea')
            textarea.value = content
            document.body.appendChild(textarea)
            textarea.select()
            document.execCommand('copy')
            document.body.removeChild(textarea)
            setCopiedMessage(true)
            setTimeout(() => setCopiedMessage(false), 2000)
        }
    }

    // پیام‌های کاربر هم از Markdown + KaTeX عبور می‌کنند تا فرمول‌ها رندر شوند
    // اما ظاهر پیام کاربر با AI فرق دارد
    if (isUser) {
        return (
            <div className="relative group">
                <div className="ai-markdown prose prose-sm max-w-none text-text-primary">
                    <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[
                            [rehypeKatex, {
                                throwOnError: false,
                                trust: false,
                                macros: {
                                    "\\R": "\\mathbb{R}",
                                    "\\N": "\\mathbb{N}",
                                    "\\Z": "\\mathbb{Z}",
                                    "\\Q": "\\mathbb{Q}",
                                }
                            }]
                        ]}
                    >
                        {safeText}
                    </ReactMarkdown>
                </div>
                <button
                    onClick={handleCopyMessage}
                    className="absolute -left-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border text-text-tertiary hover:text-text-primary"
                    title="کپی پیام"
                >
                    {copiedMessage ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
            </div>
        )
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
        <div className="ai-markdown text-sm leading-relaxed break-words w-full max-w-full text-text-primary relative group">
            <style>{mathStyles}</style>

            <button
                onClick={handleCopyMessage}
                className="absolute -left-2 -top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-border text-text-tertiary hover:text-text-primary z-10"
                title="کپی پیام"
            >
                {copiedMessage ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[
                    [rehypeKatex, {
                        throwOnError: false,
                        trust: false,
                        macros: {
                            "\\R": "\\mathbb{R}",
                            "\\N": "\\mathbb{N}",
                            "\\Z": "\\mathbb{Z}",
                            "\\Q": "\\mathbb{Q}",
                        }
                    }]
                ]}
                components={{
                    p: ({ children }) => (
                        <p className="mb-3 last:mb-0 whitespace-pre-line leading-relaxed text-text-primary">
                            {children}
                        </p>
                    ),
                    ul: ({ children }) => (
                        <ul className="list-disc pr-5 mb-3 space-y-1.5 text-text-primary">
                            {children}
                        </ul>
                    ),
                    ol: ({ children }) => (
                        <ol className="list-decimal pr-5 mb-3 space-y-1.5 text-text-primary">
                            {children}
                        </ol>
                    ),
                    li: ({ children }) => (
                        <li className="text-text-primary leading-relaxed">{children}</li>
                    ),
                    strong: ({ children }) => (
                        <strong className="font-bold text-text-primary">{children}</strong>
                    ),
                    em: ({ children }) => <em className="italic text-text-secondary">{children}</em>,
                    h1: ({ children }) => (
                        <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 text-text-primary border-b border-border-subtle pb-2">
                            {children}
                        </h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className="text-lg font-bold mb-2.5 mt-3 first:mt-0 text-text-primary">
                            {children}
                        </h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className="text-base font-bold mb-2 mt-2.5 first:mt-0 text-text-primary">
                            {children}
                        </h3>
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className="border-r-4 border-accent pr-4 my-3 py-1 bg-surface-2/30 rounded-r-lg text-text-secondary">
                            {children}
                        </blockquote>
                    ),
                    code: ({ className, children, ...props }) => {
                        const isInline = !className
                        if (isInline) {
                            return (
                                <code
                                    className="bg-surface-3 dark:bg-gray-700 text-accent-hover dark:text-gray-200 px-1.5 py-0.5 rounded-md text-xs font-mono whitespace-pre-wrap break-words"
                                    {...props}
                                >
                                    {children}
                                </code>
                            )
                        }
                        const match = /language-(\w+)/.exec(className || '')
                        const language = match ? match[1] : 'text'
                        const code = String(children).replace(/\n$/, '')

                        return (
                            <div className="relative my-3 rounded-xl overflow-hidden border border-border-subtle dark:border-gray-700">
                                <div className="flex items-center justify-between px-4 py-2 bg-surface-3/50 dark:bg-gray-800 border-b border-border-subtle dark:border-gray-700 text-xs text-text-secondary dark:text-gray-400">
                                    <span className="font-mono uppercase text-[10px] tracking-wider">
                                        {language}
                                    </span>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(code)}
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-surface-3 dark:hover:bg-gray-700 transition-colors text-text-tertiary dark:text-gray-400 hover:text-text-primary dark:hover:text-gray-200"
                                    >
                                        <Copy className="w-3.5 h-3.5" />
                                        <span className="text-[10px]">کپی کد</span>
                                    </button>
                                </div>
                                <SyntaxHighlighter
                                    language={language}
                                    style={codeStyle}
                                    customStyle={{
                                        margin: 0,
                                        padding: '16px',
                                        fontSize: '13px',
                                        lineHeight: '1.6',
                                        background: isDark ? '#1e1e1e' : '#f8f8f8',
                                        borderRadius: 0,
                                    }}
                                    wrapLines={true}
                                    wrapLongLines={true}
                                >
                                    {code}
                                </SyntaxHighlighter>
                            </div>
                        )
                    },
                    pre: ({ children }) => <>{children}</>,
                    table: ({ children }) => (
                        <div className="overflow-x-auto my-3 rounded-xl border border-border-subtle dark:border-gray-700">
                            <table className="w-full text-sm border-collapse">
                                {children}
                            </table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th className="border border-border-subtle dark:border-gray-700 px-4 py-2.5 bg-surface-2 dark:bg-gray-800 text-right font-semibold text-text-primary dark:text-gray-200">
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td className="border border-border-subtle dark:border-gray-700 px-4 py-2.5 text-text-secondary dark:text-gray-300">
                            {children}
                        </td>
                    ),
                    hr: () => <hr className="my-4 border-border-subtle dark:border-gray-700" />,
                    a: ({ href, children }) => (
                        <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:text-accent-hover underline transition-colors"
                        >
                            {children}
                        </a>
                    ),
                }}
            >
                {safeText}
            </ReactMarkdown>
        </div>
    )
}

export default AiMessageContent