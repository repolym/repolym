import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { config } from '../config.ts';
import { logger } from '../utils/logger.ts';
import { withTimeout } from '../utils/timeout.ts';

export class GeminiProvider {
    private client: GoogleGenerativeAI;

    constructor() {
        this.client = new GoogleGenerativeAI(config.gemini.apiKey);
    }

    async chat(
        messages: Array<{ role: string; content: string }>,
        options?: { maxTokens?: number; temperature?: number }
    ) {
        const start = Date.now();
        try {
            const systemMessage = messages.find(m => m.role === 'system');

            // FIX: Exclude the final message from the history array to prevent turn sequence violations
            const messagesWithoutSystem = messages.filter(m => m.role !== 'system');
            const history = messagesWithoutSystem
                .slice(0, -1)
                .map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }],
                }));

            const model = this.client.getGenerativeModel({
                model: config.gemini.model,
                systemInstruction: systemMessage?.content,
                safetySettings: [
                    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
                ],
                generationConfig: {
                    maxOutputTokens: options?.maxTokens ?? config.ai.maxOutputTokens,
                    temperature: options?.temperature ?? config.ai.temperature,
                    responseMimeType: "application/json", // FIX: Enforce native JSON generation for stable parsing
                },
            });

            const chat = model.startChat({ history });
            const lastMessage = messages[messages.length - 1];
            if (!lastMessage || lastMessage.role === 'system') {
                throw new Error('No user/assistant message to send');
            }

            const result = await withTimeout(chat.sendMessage(lastMessage.content), config.ai.timeoutMs);
            const response = result.response;
            const text = response.text();

            logger.debug('Gemini success', { latency: Date.now() - start });
            return { content: text, usage: { inputTokens: 0, outputTokens: 0 } };
        } catch (error) {
            logger.error('Gemini error', { latency: Date.now() - start }, error);
            throw error;
        }
    }
}