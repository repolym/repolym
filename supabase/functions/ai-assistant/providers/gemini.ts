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
            const messagesWithoutSystem = messages.filter(m => m.role !== 'system');
            let history = messagesWithoutSystem
                .slice(0, -1)
                .map(m => ({
                    role: m.role === 'user' ? 'user' : 'model',
                    parts: [{ text: m.content }],
                }));

            // Ensure the history starts with a user message, otherwise trim leading model messages
            if (history.length > 0 && history[0].role !== 'user') {
                const firstUserIdx = history.findIndex(m => m.role === 'user');
                if (firstUserIdx !== -1) {
                    history = history.slice(firstUserIdx);
                } else {
                    // No user message at all – prepend a dummy user message to satisfy Gemini
                    history = [{ role: 'user', parts: [{ text: 'Hello' }] }];
                }
            }

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
                    responseMimeType: "application/json",
                },
            });

            const chat = model.startChat({ history });
            const lastMessage = messages[messages.length - 1];
            if (!lastMessage || lastMessage.role === 'system') {
                throw new Error('No user/assistant message to send');
            }

            const result = await withTimeout(
                chat.sendMessage(lastMessage.content),
                config.ai.timeoutMs
            ) as Awaited<ReturnType<typeof chat.sendMessage>>;
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