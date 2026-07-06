import { chatWithFallback } from '../services/aiService.ts';
import { validateChatRequest } from '../utils/validators.ts';
import { logger } from '../utils/logger.ts';

function detectRequestedLanguage(messages: Array<{ role: string; content: string }>): string | null {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) return null;
    const text = lastUserMessage.content;
    const patterns = [
        { lang: 'english', regex: /\b(answer|respond|speak|write|reply|translate)\s+(in\s+)?(english|en)\b/i },
        { lang: 'german', regex: /\b(answer|respond|speak|write|reply|translate)\s+(in\s+)?(german|de|deutsch)\b/i },
    ];
    for (const p of patterns) {
        if (p.regex.test(text)) {
            return p.lang;
        }
    }
    return null;
}

export async function handleChat(data: unknown) {
    try {
        const { messages, userId } = validateChatRequest(data);
        const requestedLang = detectRequestedLanguage(messages);

        let systemPrompt = 'You are an educational AI assistant. ';
        if (requestedLang === 'english') {
            systemPrompt += 'Always respond in English. ';
        } else if (requestedLang === 'german') {
            systemPrompt += 'Always respond in German. ';
        } else {
            systemPrompt += 'Default language is Persian. Always respond in Persian unless the user explicitly requests another language. Do not switch languages automatically. ';
        }
        systemPrompt += 'Provide helpful, accurate, and concise responses.';

        let finalMessages = messages;
        const systemIndex = messages.findIndex(m => m.role === 'system');
        if (systemIndex !== -1) {
            finalMessages = [...messages];
            finalMessages[systemIndex] = { role: 'system', content: systemPrompt };
        } else {
            finalMessages = [{ role: 'system', content: systemPrompt }, ...messages];
        }

        const result = await chatWithFallback(finalMessages, { maxTokens: 1024, temperature: 0.7 }, userId);
        return { success: true, data: { message: result.content, usage: result.usage }, provider: result.provider };
    } catch (error) {
        logger.error('Chat handler error', undefined, error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}