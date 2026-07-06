import { chatWithFallback } from '../services/aiService.ts';
import { validateSummarizeRequest } from '../utils/validators.ts';
import { logger } from '../utils/logger.ts';

export async function handleSummarize(data: unknown) {
    try {
        const { text, maxLength } = validateSummarizeRequest(data);
        const prompt = `
Summarize the following text in about ${maxLength} characters. Keep the most important information and key points.

Text:
${text}

Provide the summary only, without any additional commentary.
    `;

        const result = await chatWithFallback(
            [
                { role: 'system', content: 'You are a concise summarizer. Provide only the summary.' },
                { role: 'user', content: prompt },
            ],
            { maxTokens: 400, temperature: 0.3 },
            undefined
        );

        return {
            success: true,
            data: {
                summary: result.content.trim(),
                originalLength: text.length,
                summaryLength: result.content.trim().length,
            },
            provider: result.provider,
        };
    } catch (error) {
        logger.error('Summarize handler error', undefined, error);
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}