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

Deno.serve(async (req: Request) => {
    // ... ادامه کد بدون تغییر (cors، احراز هویت، مسیریابی و غیره)
});