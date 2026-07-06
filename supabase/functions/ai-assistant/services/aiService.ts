import { GeminiProvider } from '../providers/gemini.ts';
import { GroqProvider } from '../providers/groq.ts';
import { withRetry } from '../utils/retry.ts';
import { logger } from '../utils/logger.ts';
import { getCached, setCache, generateCacheKey } from './cacheService.ts';
import { config } from '../config.ts';

function isTemporaryError(error: unknown): boolean {
    const msg = error instanceof Error ? error.message : String(error);
    const lower = msg.toLowerCase();
    return (
        lower.includes('quota') ||
        lower.includes('rate limit') ||
        lower.includes('timeout') ||
        lower.includes('network') ||
        lower.includes('connection') ||
        lower.includes('500') ||
        lower.includes('503') ||
        lower.includes('unavailable') ||
        lower.includes('retry')
    );
}

export async function chatWithFallback(
    messages: Array<{ role: string; content: string }>,
    options?: { maxTokens?: number; temperature?: number },
    userId?: string
): Promise<{ content: string; provider: string; usage?: any }> {

    const dataToHash = { messages, options, userId };
    const cacheKey = await generateCacheKey('chat', dataToHash);

    const cached = await getCached<{ content: string; provider: string; usage?: any }>(cacheKey);
    if (cached) {
        logger.info('Cache hit', { userId });
        return cached;
    }

    const gemini = new GeminiProvider();
    const groq = new GroqProvider();
    let geminiError: any = null;
    let groqError: any = null;

    // تلاش با Gemini
    logger.info('Attempting Gemini provider...');
    try {
        const result = await withRetry(
            () => gemini.chat(messages, options),
            config.ai.maxRetries,
            500,
            isTemporaryError
        );
        logger.info('Gemini succeeded');
        const response = { content: result.content, provider: 'gemini', usage: result.usage };
        await setCache(cacheKey, response);
        return response;
    } catch (err) {
        geminiError = err;
        logger.error('Gemini failed', { error: String(err) });
    }

    // تلاش با Groq (fallback)
    logger.info('Attempting Groq provider (fallback)...');
    try {
        const result = await withRetry(
            () => groq.chat(messages, options),
            config.ai.maxRetries,
            500,
            isTemporaryError
        );
        logger.info('Groq succeeded');
        const response = { content: result.content, provider: 'groq', usage: result.usage };
        await setCache(cacheKey, response);
        return response;
    } catch (err) {
        groqError = err;
        logger.error('Groq also failed', { error: String(err) });
    }

    // هر دو شکست خوردند
    const errorMessage = `All AI providers failed.\nGemini error: ${String(geminiError)}\nGroq error: ${String(groqError)}`;
    const error = new Error(errorMessage);
    (error as any).details = { geminiError, groqError };
    throw error;
}