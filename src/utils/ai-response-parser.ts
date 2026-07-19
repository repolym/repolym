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
 * ورودی: هر متنی که ممکن است از AI برگردد (متن ساده، JSON خام، یا JSON
 * داخل فنس کد). خروجی: متنی امن و قابل‌نمایش به کاربر (Markdown-friendly)،
 * هرگز JSON خام.
 */
export const sanitizeAiResponse = (raw: string | null | undefined): string => {
    if (!raw) return ''

    const unfenced = stripCodeFence(raw)

    if (!looksLikeJson(unfenced)) {
        return unfenced
    }

    try {
        const parsed = JSON.parse(unfenced)
        const text = extractDisplayText(parsed)
        return text || unfenced
    } catch {
        // JSON نامعتبر بود؛ حداقل فنس کد را حذف کرده‌ایم — همان را برگردان
        return unfenced
    }
}