/**
 * Shared types for the AI Assistant.
 */

// Request actions
export type Action = 'chat' | 'analyze' | 'recommend' | 'summarize';

// Base request structure
export interface AIRequest {
    action: Action;
    data: ChatRequest | AnalyzeRequest | RecommendRequest | SummarizeRequest;
}

// Chat
export interface ChatRequest {
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
    userId?: string; // optional for caching
    subject?: string;
}

// Performance Analysis
export interface AnalyzeRequest {
    userId: string; // required to fetch user data
    period?: 'week' | 'month';
    // Additional data could be passed, but we'll fetch from DB in service
}

// Study Recommendations
export interface RecommendRequest {
    userId: string;
    goal?: string; // e.g., "improve math", "increase study time"
}

// Summarization
export interface SummarizeRequest {
    text: string;
    maxLength?: number;
}

// Response structure
export interface AIResponse {
    success: boolean;
    data?: unknown;
    error?: string;
    provider?: 'gemini' | 'groq'; // for debugging (optional)
}

// Chat response
export interface ChatResponse {
    message: string;
    usage?: {
        inputTokens: number;
        outputTokens: number;
    };
}

// Analysis response
export interface AnalyzeResponse {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    metrics?: Record<string, number>;
}

// Recommendation response
export interface RecommendResponse {
    recommendations: string[];
    rationale?: string;
}

// Summarization response
export interface SummarizeResponse {
    summary: string;
    originalLength: number;
    summaryLength: number;
}

// Internal types for providers
export interface AIProvider {
    name: string;
    chat(messages: Array<{ role: string; content: string }>, options?: { maxTokens?: number; temperature?: number }): Promise<{ content: string; usage?: { inputTokens: number; outputTokens: number } }>;
}