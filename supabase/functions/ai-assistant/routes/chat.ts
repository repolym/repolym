import { chatWithFallback } from '../services/aiService.ts';
import { validateChatRequest } from '../utils/validators.ts';
import { logger } from '../utils/logger.ts';

export async function handleChat(data: unknown) {
    try {
        const { messages, userId } = validateChatRequest(data);
        const result = await chatWithFallback(messages, { maxTokens: 1024, temperature: 0.7 }, userId);
        return { success: true, data: { message: result.content, usage: result.usage }, provider: result.provider };
    } catch (error) {
        logger.error('Chat handler error', undefined, error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}