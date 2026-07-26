import { logger } from '../utils/logger.ts';
import { withTimeout } from '../utils/timeout.ts';
import { config } from '../config.ts';

export const MODELS = {
    'deepseek-r1': 'deepseek/deepseek-r1',
    'deepseek-chat': 'deepseek/deepseek-chat',
    'llama-4': 'meta-llama/llama-4-maverick',
    'gemma-2': 'google/gemma-2-27b-it',
    'qwen-2.5': 'qwen/qwen-2.5-72b-instruct',
} as const;

export type ModelName = keyof typeof MODELS;

const COMPLEXITY_MODEL_MAP: Record<string, ModelName> = {
    'simple': 'deepseek-chat',
    'medium': 'deepseek-chat',
    'advanced': 'deepseek-r1',
    'chat': 'deepseek-chat',
    'analyze': 'deepseek-r1',
    'recommend': 'deepseek-r1',
    'summarize': 'deepseek-chat',
};

const FALLBACK_MODELS: ModelName[] = [
    'deepseek-r1',
    'deepseek-chat',
    'llama-4',
    'gemma-2',
    'qwen-2.5',
];

export class OpenRouterProvider {
    private apiKeys: string[];
    private currentKeyIndex: number = 0;
    private requestCounts: Map<string, number> = new Map();
    private dailyLimit: number = 50;
    private lastResetDate: string = '';

    constructor() {
        const keysEnv = Deno.env.get('OPENROUTER_API_KEYS');
        if (!keysEnv) {
            throw new Error('OPENROUTER_API_KEYS environment variable is required');
        }
        this.apiKeys = keysEnv.split(',').map(k => k.trim()).filter(k => k.length > 0);
        if (this.apiKeys.length === 0) {
            throw new Error('At least one OpenRouter API key is required');
        }
        logger.info(`OpenRouterProvider initialized with ${this.apiKeys.length} API keys`);
    }

    private getNextKey(): string {
        const key = this.apiKeys[this.currentKeyIndex];
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        return key;
    }

    private getModelForComplexity(complexity: string = 'medium'): ModelName {
        const key = complexity.toLowerCase();
        return COMPLEXITY_MODEL_MAP[key] || 'deepseek-chat';
    }

    private getModelName(modelKey: ModelName): string {
        return MODELS[modelKey] || MODELS['deepseek-chat'];
    }

    private getFallbackModels(primaryModel: ModelName): ModelName[] {
        const primaryIndex = FALLBACK_MODELS.indexOf(primaryModel);
        return FALLBACK_MODELS.slice(primaryIndex + 1);
    }

    private resetDailyCountsIfNeeded() {
        const today = new Date().toISOString().split('T')[0];
        if (this.lastResetDate !== today) {
            this.requestCounts.clear();
            this.lastResetDate = today;
            logger.info('Daily request counts reset');
        }
    }

    private canMakeRequest(key: string): boolean {
        this.resetDailyCountsIfNeeded();
        const count = this.requestCounts.get(key) || 0;
        return count < this.dailyLimit;
    }

    private incrementRequestCount(key: string) {
        const count = this.requestCounts.get(key) || 0;
        this.requestCounts.set(key, count + 1);
    }

    private getAvailableKeys(): string[] {
        return this.apiKeys.filter(key => this.canMakeRequest(key));
    }

    // NEW: Streaming chat method
    async chatStream(
        messages: Array<{ role: string; content: string }>,
        options?: {
            maxTokens?: number;
            temperature?: number;
            complexity?: string;
            model?: ModelName;
            onChunk: (chunk: string) => void;
        }
    ): Promise<{ content: string; usage?: any; model: string }> {
        const start = Date.now();
        const complexity = options?.complexity || 'medium';
        const requestedModel = options?.model || this.getModelForComplexity(complexity);

        const modelsToTry = [requestedModel, ...this.getFallbackModels(requestedModel)];
        const availableKeys = this.getAvailableKeys();
        if (availableKeys.length === 0) {
            throw new Error('All API keys have reached their daily limit. Please try again tomorrow.');
        }

        let lastError: Error | null = null;

        for (const modelName of modelsToTry) {
            const modelId = this.getModelName(modelName);

            for (const key of availableKeys) {
                if (!this.canMakeRequest(key)) continue;

                try {
                    const result = await this.sendStreamRequest(
                        modelId,
                        messages,
                        key,
                        options,
                        (chunk) => {
                            options?.onChunk?.(chunk);
                        }
                    );

                    this.incrementRequestCount(key);
                    logger.debug('OpenRouter stream success', {
                        latency: Date.now() - start,
                        model: modelId,
                    });

                    return {
                        content: result.content,
                        usage: result.usage,
                        model: modelId,
                    };
                } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));
                    const errorMsg = lastError.message.toLowerCase();

                    if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
                        this.requestCounts.set(key, this.dailyLimit);
                        logger.warn(`API key exhausted due to rate limit`, { keyIndex: this.apiKeys.indexOf(key) });
                        continue;
                    }

                    logger.warn(`Model ${modelId} failed with key ${this.apiKeys.indexOf(key)}`, { error: lastError.message });
                }
            }

            logger.info(`All keys failed for model ${modelId}, trying fallback`);
        }

        if (lastError) {
            throw new Error(`All OpenRouter models and API keys failed: ${lastError.message}`);
        }
        throw new Error('No available OpenRouter models or API keys');
    }

    private async sendStreamRequest(
        modelId: string,
        messages: Array<{ role: string; content: string }>,
        apiKey: string,
        options?: { maxTokens?: number; temperature?: number },
        onChunk?: (chunk: string) => void
    ): Promise<{ content: string; usage?: any }> {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://repolym.github.io',
                'X-Title': 'Repolym AI Assistant',
            },
            body: JSON.stringify({
                model: modelId,
                messages: messages.map(m => ({
                    role: m.role as 'system' | 'user' | 'assistant',
                    content: m.content,
                })),
                max_tokens: options?.maxTokens || 1024,
                temperature: options?.temperature || 0.7,
                stream: true, // Enable streaming
            }),
        });

        if (!response.ok) {
            let errorText: string;
            try {
                const errorData = await response.json();
                errorText = errorData.error?.message || String(errorData);
            } catch {
                errorText = await response.text();
            }
            throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('No response body');
        }

        const decoder = new TextDecoder();
        let fullContent = '';
        let usage: any = null;

        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const delta = parsed.choices?.[0]?.delta?.content;
                            if (delta) {
                                fullContent += delta;
                                onChunk?.(delta);
                            }
                            if (parsed.usage) {
                                usage = parsed.usage;
                            }
                        } catch (e) {
                            // Ignore parse errors for incomplete JSON
                        }
                    }
                }
            }
        } finally {
            reader.releaseLock();
        }

        return {
            content: fullContent,
            usage: usage ? {
                inputTokens: usage.prompt_tokens || 0,
                outputTokens: usage.completion_tokens || 0,
            } : undefined,
        };
    }

    // Legacy non-streaming method (kept for backward compatibility)
    async chat(
        messages: Array<{ role: string; content: string }>,
        options?: {
            maxTokens?: number;
            temperature?: number;
            complexity?: string;
            model?: ModelName;
        }
    ) {
        const start = Date.now();
        const complexity = options?.complexity || 'medium';
        const requestedModel = options?.model || this.getModelForComplexity(complexity);

        const modelsToTry = [requestedModel, ...this.getFallbackModels(requestedModel)];
        const availableKeys = this.getAvailableKeys();
        if (availableKeys.length === 0) {
            throw new Error('All API keys have reached their daily limit. Please try again tomorrow.');
        }

        let lastError: Error | null = null;

        for (const modelName of modelsToTry) {
            const modelId = this.getModelName(modelName);

            for (const key of availableKeys) {
                if (!this.canMakeRequest(key)) continue;

                try {
                    const result = await withTimeout(
                        this.sendRequest(modelId, messages, key, options),
                        config.ai.timeoutMs || 30000
                    );

                    this.incrementRequestCount(key);
                    logger.debug('OpenRouter success', {
                        latency: Date.now() - start,
                        model: modelId,
                    });

                    return {
                        content: result.content,
                        usage: result.usage,
                        model: modelId,
                        provider: 'openrouter',
                    };
                } catch (error) {
                    lastError = error instanceof Error ? error : new Error(String(error));
                    const errorMsg = lastError.message.toLowerCase();

                    if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
                        this.requestCounts.set(key, this.dailyLimit);
                        logger.warn(`API key exhausted due to rate limit`, { keyIndex: this.apiKeys.indexOf(key) });
                        continue;
                    }

                    logger.warn(`Model ${modelId} failed with key ${this.apiKeys.indexOf(key)}`, { error: lastError.message });
                }
            }

            logger.info(`All keys failed for model ${modelId}, trying fallback`);
        }

        if (lastError) {
            throw new Error(`All OpenRouter models and API keys failed: ${lastError.message}`);
        }
        throw new Error('No available OpenRouter models or API keys');
    }

    private async sendRequest(
        modelId: string,
        messages: Array<{ role: string; content: string }>,
        apiKey: string,
        options?: { maxTokens?: number; temperature?: number }
    ) {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://repolym.github.io',
                'X-Title': 'Repolym AI Assistant',
            },
            body: JSON.stringify({
                model: modelId,
                messages: messages.map(m => ({
                    role: m.role as 'system' | 'user' | 'assistant',
                    content: m.content,
                })),
                max_tokens: options?.maxTokens || 1024,
                temperature: options?.temperature || 0.7,
            }),
        });

        if (!response.ok) {
            let errorText: string;
            try {
                const errorData = await response.json();
                errorText = errorData.error?.message || String(errorData);
            } catch {
                errorText = await response.text();
            }
            throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const choice = data.choices?.[0];
        if (!choice?.message?.content) {
            throw new Error('Invalid response from OpenRouter: missing content');
        }

        return {
            content: choice.message.content,
            usage: {
                inputTokens: data.usage?.prompt_tokens || 0,
                outputTokens: data.usage?.completion_tokens || 0,
            },
        };
    }

    getStats() {
        this.resetDailyCountsIfNeeded();
        const stats: Record<string, { used: number; limit: number }> = {};
        this.apiKeys.forEach((key, index) => {
            stats[`key_${index + 1}`] = {
                used: this.requestCounts.get(key) || 0,
                limit: this.dailyLimit,
            };
        });
        return stats;
    }
}