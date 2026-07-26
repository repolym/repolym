import { config } from '../config.ts';

export function validateChatRequest(data: unknown): { messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>; userId?: string; complexity?: string } {
    if (!data || typeof data !== 'object') throw new Error('Invalid request data');
    const { messages, userId, complexity } = data as any;
    if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error('Messages array is required and must not be empty');
    }
    for (const msg of messages) {
        if (typeof msg.role !== 'string' || !['system', 'user', 'assistant'].includes(msg.role)) {
            throw new Error('Invalid role: must be system, user, or assistant');
        }
        if (typeof msg.content !== 'string' || msg.content.trim().length === 0) {
            throw new Error('Message content must be non-empty string');
        }
        if (msg.content.length > config.ai.maxInputTokens * 4) {
            throw new Error(`Message exceeds maximum length`);
        }
    }
    return {
        messages,
        userId: typeof userId === 'string' ? userId : undefined,
        complexity: typeof complexity === 'string' ? complexity : 'medium',
    };
}

export function validateAnalyzeRequest(data: unknown): { userId: string; period?: 'week' | 'month'; complexity?: string } {
    if (!data || typeof data !== 'object') throw new Error('Invalid request');
    const { userId, period, complexity } = data as any;
    if (typeof userId !== 'string' || !userId) throw new Error('userId is required');
    if (period && !['week', 'month'].includes(period)) throw new Error('period must be "week" or "month"');
    return {
        userId,
        period: period || 'month',
        complexity: typeof complexity === 'string' ? complexity : 'advanced',
    };
}

export function validateRecommendRequest(data: unknown): { userId: string; goal?: string; complexity?: string } {
    if (!data || typeof data !== 'object') throw new Error('Invalid request');
    const { userId, goal, complexity } = data as any;
    if (typeof userId !== 'string' || !userId) throw new Error('userId is required');
    if (goal && typeof goal !== 'string') throw new Error('goal must be a string');
    return {
        userId,
        goal,
        complexity: typeof complexity === 'string' ? complexity : 'advanced',
    };
}

export function validateSummarizeRequest(data: unknown): { text: string; maxLength?: number } {
    if (!data || typeof data !== 'object') throw new Error('Invalid request');
    const { text, maxLength } = data as any;
    if (typeof text !== 'string' || !text.trim()) throw new Error('text is required');
    if (maxLength && (typeof maxLength !== 'number' || maxLength <= 0)) {
        throw new Error('maxLength must be a positive number');
    }
    return { text, maxLength: maxLength || 200 };
}