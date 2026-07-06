import Groq from 'groq-sdk';
import { config } from '../config.ts';
import { logger } from '../utils/logger.ts';
import { withTimeout } from '../utils/timeout.ts';

export class GroqProvider {
    private client: Groq;

    constructor() {
        this.client = new Groq({ apiKey: config.groq.apiKey });
    }

    async chat(
        messages: Array<{ role: string; content: string }>,
        options?: { maxTokens?: number; temperature?: number }
    ) {
        const start = Date.now();
        try {
            // افزودن کلمه‌ی "json" به system prompt یا آخرین پیام کاربر
            const modifiedMessages = messages.map((m, index) => {
                if (m.role === 'system') {
                    return { ...m, content: m.content + ' Please respond in JSON format.' };
                }
                return m;
            });

            const response = await withTimeout(
                this.client.chat.completions.create({
                    model: config.groq.model,
                    messages: modifiedMessages.map(m => ({
                        role: m.role as 'system' | 'user' | 'assistant',
                        content: m.content,
                    })),
                    response_format: { type: "json_object" },
                    max_tokens: options?.maxTokens ?? config.ai.maxOutputTokens,
                    temperature: options?.temperature ?? config.ai.temperature,
                }),
                config.ai.timeoutMs
            );

            const choice = response.choices[0];
            if (!choice?.message) throw new Error('No response from Groq');

            logger.debug('Groq success', { latency: Date.now() - start });
            return {
                content: choice.message.content || '',
                usage: {
                    inputTokens: response.usage?.prompt_tokens || 0,
                    outputTokens: response.usage?.completion_tokens || 0,
                },
            };
        } catch (error) {
            logger.error('Groq error', { latency: Date.now() - start }, error);
            throw error;
        }
    }
}