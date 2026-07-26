import { OpenRouterProvider } from '../providers/openrouter.ts';
import { logger } from '../utils/logger.ts';
import { withRetry } from '../utils/retry.ts';
import { config } from '../config.ts';
import { getCached, setCache, generateCacheKey } from './cacheService.ts';

function isTemporaryError(error: unknown): boolean {
    const msg = error instanceof Error ? error.message : String(error);
    const lower = msg.toLowerCase();
    return (
        lower.includes('rate limit') ||
        lower.includes('429') ||
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
    options?: {
        maxTokens?: number;
        temperature?: number;
        complexity?: string;
        model?: string;
    },
    userId?: string
): Promise<{ content: string; provider: string; usage?: any; model?: string }> {

    const dataToHash = { messages, options, userId };
    const cacheKey = await generateCacheKey('chat', dataToHash);

    const cached = await getCached<{ content: string; provider: string; usage?: any; model?: string }>(cacheKey);
    if (cached) {
        logger.info('Cache hit', { userId });
        return cached;
    }

    const openrouter = new OpenRouterProvider();

    let lastError: any = null;

    // Try with OpenRouter
    logger.info('Attempting OpenRouter provider...');
    try {
        const result = await withRetry(
            () => openrouter.chat(messages, {
                maxTokens: options?.maxTokens ?? config.ai.maxOutputTokens,
                temperature: options?.temperature ?? config.ai.temperature,
                complexity: options?.complexity,
                model: options?.model as any,
            }),
            config.ai.maxRetries,
            500,
            isTemporaryError
        );
        logger.info('OpenRouter succeeded', { model: result.model });
        const response = {
            content: result.content,
            provider: result.provider,
            usage: result.usage,
            model: result.model,
        };
        await setCache(cacheKey, response);
        return response;
    } catch (err) {
        lastError = err;
        logger.error('OpenRouter failed', { error: String(err) });
    }

    // All providers failed
    const errorMessage = `All AI providers failed.\nOpenRouter error: ${String(lastError)}`;
    const error = new Error(errorMessage);
    (error as any).details = { lastError };
    throw error;
}