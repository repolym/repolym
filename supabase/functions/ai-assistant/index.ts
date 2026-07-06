import { logger } from './utils/logger.ts';
import { handleChat } from './routes/chat.ts';
import { handleAnalyze } from './routes/analyze.ts';
import { handleRecommend } from './routes/recommend.ts';
import { handleSummarize } from './routes/summarize.ts';
import { validateEnv } from './config.ts';

// اعتبارسنجی متغیرهای محیطی هنگام راه‌اندازی
try {
    validateEnv();
} catch (err) {
    console.error('Startup error:', err.message);
    Deno.exit(1);
}

// تعریف دامنه‌های مجاز
const ALLOWED_ORIGINS = [
    'https://repolym.github.io',  // دامنه اصلی شما
    'http://localhost:5173',      // برای توسعه محلی
];

// هدرهای پیش‌فرض CORS
const corsHeaders = (origin: string) => ({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
});

Deno.serve(async (req: Request) => {
    // 1. دریافت origin درخواست
    const origin = req.headers.get('origin') || '';
    const isAllowed = ALLOWED_ORIGINS.includes(origin);

    // 2. پاسخ به درخواست‌های preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
        if (isAllowed) {
            return new Response(null, {
                status: 204,
                headers: corsHeaders(origin),
            });
        } else {
            // برگشت خطا اگر origin مجاز نباشد
            return new Response('Origin not allowed', { status: 403 });
        }
    }

    // 3. فقط درخواست‌های POST مجازند
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
    }

    try {
        // احراز هویت: خواندن توکن از هدر Authorization
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ success: false, error: 'احراز هویت الزامی است' }), {
                status: 401,
                headers: corsHeaders(origin),
            });
        }
        const token = authHeader.substring(7);
        // (می‌توانید در اینجا توکن را با Supabase اعتبارسنجی کنید،
        // برای سادگی فعلاً توکن را قبول می‌کنیم،
        // اما در محیط واقعی باید validate شود.)

        const body = await req.json();
        const { action, data } = body;

        let result;
        switch (action) {
            case 'chat':
                result = await handleChat(data);
                break;
            case 'analyze':
                result = await handleAnalyze(data);
                break;
            case 'recommend':
                result = await handleRecommend(data);
                break;
            case 'summarize':
                result = await handleSummarize(data);
                break;
            default:
                return new Response(JSON.stringify({ success: false, error: 'عملیات نامعتبر' }), {
                    status: 400,
                    headers: corsHeaders(origin),
                });
        }

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });

    } catch (err) {
        logger.error('Request handler error', {}, err);
        return new Response(JSON.stringify({ success: false, error: err.message || 'خطای سرور' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
    }
});