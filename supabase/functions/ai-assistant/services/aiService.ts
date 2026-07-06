import { GeminiProvider } from '../providers/gemini.ts';
import { GroqProvider } from '../providers/groq.ts';
import { withRetry } from '../utils/retry.ts';
import { logger } from '../utils/logger.ts';
import { getCached, setCache, generateCacheKey } from './cacheService.ts';
import { config } from '../config.ts';

// Error classification for retry
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

    // FIX: Execute caching universally, unlinking it from the requirement of a userId for stateless endpoints
    const dataToHash = { messages, options, userId };
    const cacheKey = await generateCacheKey('chat', dataToHash);

    const cached = await getCached<{ content: string; provider: string; usage?: any }>(cacheKey);
    if (cached) {
        logger.info('Cache hit', { userId });
        return cached;
    }

    const gemini = new GeminiProvider();
    const groq = new GroqProvider();

    // Try Gemini first with retry
    try {
        const result = await withRetry(
            () => gemini.chat(messages, options),
            config.ai.maxRetries,
            500,
            isTemporaryError
        );
        const response = { content: result.content, provider: 'gemini', usage: result.usage };
        await setCache(cacheKey, response);
        return response;
    } catch (error) {
        logger.warn('Gemini failed, fallback to Groq', { error: String(error) });
        if (!config.ai.fallbackEnabled) throw error;
        if (!isTemporaryError(error)) throw error;

        // Fallback to Groq
        try {
            const result = await withRetry(
                () => groq.chat(messages, options),
                config.ai.maxRetries,
                500,
                isTemporaryError
            );
            const response = { content: result.content, provider: 'groq', usage: result.usage };
            await setCache(cacheKey, response);
            return response;
        } catch (fallbackError) {
            logger.error('Both providers failed', { geminiError: String(error), groqError: String(fallbackError) });
            throw new Error('All AI providers failed');
        }
    }
}