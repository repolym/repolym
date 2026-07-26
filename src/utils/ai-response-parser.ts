/**
 * ai-response-parser.ts
 *
 * دستیار هوشمند گاهی به‌جای متن ساده، یک رشتهٔ JSON خام (یا JSON داخل فنس
 * ```json ... ```) برمی‌گرداند — مثلاً وقتی مدل زیرساخت به‌اشتباه در حالت
 * jsonMode پاسخ می‌دهد یا سرور نتوانسته parse کند و متن خام را fallback
 * کرده باشد (ر.ک. supabase/functions/ai-assistant/routes/analyze.ts و
 * recommend.ts). این ماژول یک لایهٔ دفاعیِ سمت کلاینت است تا در هیچ شرایطی
 * JSON خام مستقیم به کاربر نمایش داده نشود.
 *
 * این تابع API سرور را تغییر نمی‌دهد — فقط خروجی نهایی را قبل از رندر
 * پاک‌سازی می‌کند.
 */

// کلیدهایی که معمولاً پیام قابل‌نمایش داخلشان است (به ترتیب اولویت)
const TEXT_KEYS = [
    'message',
    'summary',
    'content',
    'text',
    'response',
    'answer',
] as const

const LIST_KEYS = ['recommendations', 'strengths', 'weaknesses'] as const

/** حذف فنس‌های ```json ... ``` یا ``` ... ``` دور یک متن، اگر وجود داشته باشند */
const stripCodeFence = (raw: string): string => {
    const trimmed = raw.trim()
    const fenceMatch = /^```(?:json|javascript|js)?\s*([\s\S]*?)\s*```$/i.exec(trimmed)
    if (fenceMatch) return fenceMatch[1].trim()
    return trimmed
}

/** آیا رشته با { یا [ شروع می‌شود؟ (سیگنال احتمالی JSON بودن) */
const looksLikeJson = (raw: string): boolean => {
    const t = raw.trim()
    return (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'))
}

/**
 * تلاش می‌کند از یک آبجکت JSON پارس‌شده، متنی که باید به کاربر نمایش داده
 * شود را استخراج کند. اگر ساختار شناخته‌شده‌ای پیدا نشد، JSON را به شکل
 * خوانا (bullet list) تبدیل می‌کند تا حداقل هیچ‌گاه {..."key":"val"...}
 * خام دیده نشود.
 */
const extractDisplayText = (parsed: unknown): string => {
    if (typeof parsed === 'string') return parsed
    if (parsed === null || parsed === undefined) return ''

    if (Array.isArray(parsed)) {
        return parsed.map((item) => `• ${typeof item === 'string' ? item : JSON.stringify(item)}`).join('\n')
    }

    if (typeof parsed === 'object') {
        const obj = parsed as Record<string, unknown>

        // اولویت با کلیدهای متنی شناخته‌شده
        for (const key of TEXT_KEYS) {
            const val = obj[key]
            if (typeof val === 'string' && val.trim()) {
                let out = val.trim()
                // اگر خود این مقدار هم JSON باشد (تودرتو)، دوباره پردازش کن
                if (looksLikeJson(out)) {
                    try {
                        return extractDisplayText(JSON.parse(out))
                    } catch {
                        return out
                    }
                }
                // بخش‌های لیستی را هم به انتهای پیام اضافه کن (مثل analyze.ts)
                const extraSections: string[] = []
                for (const listKey of LIST_KEYS) {
                    const list = obj[listKey]
                    if (Array.isArray(list) && list.length > 0) {
                        const label =
                            listKey === 'strengths' ? 'نقاط قوت' : listKey === 'weaknesses' ? 'نقاط ضعف' : 'پیشنهادات'
                        extraSections.push(`\n\n**${label}:**\n` + list.map((s) => `- ${s}`).join('\n'))
                    }
                }
                return out + extraSections.join('')
            }
        }

        // اگر فقط کلیدهای لیستی موجود بودند (مثل پاسخ recommend)
        for (const listKey of LIST_KEYS) {
            const list = obj[listKey]
            if (Array.isArray(list) && list.length > 0) {
                return list.map((s) => `- ${s}`).join('\n')
            }
        }

        // fallback نهایی: خوانا کردن آبجکت به‌جای نمایش JSON خام
        return Object.entries(obj)
            .filter(([, v]) => v !== null && v !== undefined && v !== '')
            .map(([k, v]) => `**${k}:** ${typeof v === 'string' ? v : JSON.stringify(v)}`)
            .join('\n')
    }

    return String(parsed)
}

/**
 * نرمال‌سازی فرمول‌های ریاضی تولیدشده توسط AI
 *
 * مدل‌های مختلف ممکن است به‌جای:
 *
 * $$ ... $$
 *
 * از:
 *
 * [ ... ]
 *
 * یا:
 *
 * ( ... )
 *
 * استفاده کنند.
 *
 * این تابع فرمت‌های رایج را به Markdown Math تبدیل می‌کند.
 */
const normalizeMathDelimiters = (text: string): string => {
    if (!text) return text

    let result = text

    // ---------------------------------------------------------
    // 1. تبدیل بلاک‌های [ ... ] به $$ ... $$
    //
    // مثال:
    //
    // [
    // \nabla f = (...)
    // ]
    //
    // تبدیل می‌شود به:
    //
    // $$
    // \nabla f = (...)
    // $$
    // ---------------------------------------------------------

    result = result.replace(
        /(?:^|\n)\[\s*\n?([\s\S]*?)\n?\s*\](?=\n|$)/g,
        (_, formula: string) => {
            const clean = formula.trim()
            // فقط اگر واقعاً شبیه فرمول LaTeX باشد
            if (
                /\\(frac|partial|nabla|sum|int|sqrt|sin|cos|tan|theta|alpha|beta|gamma|mathbb|vec|lim|left|right)/.test(clean) ||
                /[=^_{}]/.test(clean)
            ) {
                return `\n\n$$\n${clean}\n$$\n\n`
            }
            return `\n${clean}\n`
        }
    )

    // ---------------------------------------------------------
    // 2. تبدیل \( ... \) به $ ... $
    // ---------------------------------------------------------

    result = result.replace(
        /\\\(([\s\S]*?)\\\)/g,
        (_, formula: string) => `$${formula.trim()}$`
    )

    // ---------------------------------------------------------
    // 3. تبدیل \[ ... \] به $$ ... $$
    // ---------------------------------------------------------

    result = result.replace(
        /\\\[([\s\S]*?)\\\]/g,
        (_, formula: string) => `\n\n$$\n${formula.trim()}\n$$\n\n`
    )

    // ---------------------------------------------------------
    // 4. تبدیل ( ... ) به $ ... $ فقط در صورتی که داخل آن فرمول باشد
    // این کار را با دقت انجام می‌دهیم تا متن عادی تغییر نکند
    // ---------------------------------------------------------

    result = result.replace(
        /\(([^)]*)\)/g,
        (fullMatch: string, inner: string) => {
            const trimmed = inner.trim()
            // اگر داخل پرانتز شامل الگوی ریاضی باشد
            if (
                /\\(frac|partial|nabla|sum|int|sqrt|sin|cos|tan|theta|alpha|beta|gamma|mathbb|vec|lim|left|right)/.test(trimmed) ||
                /[=^_{}]/.test(trimmed)
            ) {
                // اگر پرانتز تنها چیزی است که در خط وجود دارد، به‌عنوان display در نظر بگیر
                if (fullMatch.trim() === fullMatch && !fullMatch.includes(' ')) {
                    return `\n\n$$\n${trimmed}\n$$\n\n`
                }
                return `$${trimmed}$`
            }
            // اگر داخل پرانتز فقط یک عدد یا متغیر ساده باشد، می‌توانیم آن را هم فرمول کنیم
            if (/^[a-zA-Z0-9_\s]+$/.test(trimmed) && trimmed.length < 20) {
                return `$${trimmed}$`
            }
            // در غیر این صورت، پرانتز را به‌عنوان متن عادی نگه دار
            return fullMatch
        }
    )

    // ---------------------------------------------------------
    // 5. تبدیل متن‌هایی که با تگ‌های ریاضی شروع می‌شوند ولی delimiter ندارند
    // مثال: \frac{...}{...} → $ \frac{...}{...} $
    // ---------------------------------------------------------

    // الگوهای ریاضی که معمولاً باید با دلار محصور شوند
    result = result.replace(
        /(?<![$\\])(\\frac{[^}]*}{[^}]*}|\\nabla|\\partial|\\sum|\\int|\\sqrt{[^}]*}|\\mathbb{[A-Z]}|\\vec{[a-zA-Z]}|\\lim)/g,
        (match) => `$${match}$`
    )

    return result
}

/**
 * ورودی: هر متنی که ممکن است از AI برگردد (متن ساده، JSON خام، یا JSON
 * داخل فنس کد). خروجی: متنی امن و قابل‌نمایش به کاربر (Markdown-friendly)،
 * هرگز JSON خام.
 */
export const sanitizeAiResponse = (raw: string | null | undefined): string => {
    if (!raw) return ''

    const unfenced = stripCodeFence(raw)

    // اگر شبیه JSON نبود، مستقیماً برگردان (اما ابتدا normalizer را اعمال کن)
    if (!looksLikeJson(unfenced)) {
        return normalizeMathDelimiters(unfenced)
    }

    try {
        const parsed = JSON.parse(unfenced)
        const text = extractDisplayText(parsed)
        // بعد از استخراج متن، normalizer را اعمال کن
        return normalizeMathDelimiters(text || unfenced)
    } catch {
        // JSON نامعتبر بود؛ حداقل فنس کد را حذف کرده‌ایم — همان را برگردان با normalizer
        return normalizeMathDelimiters(unfenced)
    }
}