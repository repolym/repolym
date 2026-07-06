/**
 * Configuration loader for the AI Assistant Edge Function.
 * All secrets must be set via Supabase Secrets (e.g., `supabase secrets set GEMINI_API_KEY=...`).
 * Never hardcode secrets.
 */
export interface AppConfig {
    gemini: {
        apiKey: string;
        model: string; // e.g., "gemini-2.0-flash-lite-preview-02-05" or the smallest flash
    };
    groq: {
        apiKey: string;
        model: string; // e.g., "llama3-8b-8192" (fast, small)
    };
    ai: {
        maxInputTokens: number; // maximum allowed input tokens per request
        maxOutputTokens: number; // maximum output tokens
        temperature: number;
        timeoutMs: number; // request timeout per provider attempt
        maxRetries: number; // number of retries on temporary failures
        fallbackEnabled: boolean;
    };
    cache: {
        ttlSeconds: number; // TTL for cached analysis results
    };
}

// Load from Deno environment (set via `supabase secrets` or local `.env`)
function requireEnv(name: string): string {
    const value = Deno.env.get(name);
    if (!value) {
        throw new Error(`Missing environment variable: ${name}`);
    }
    return value;
}

export const config: AppConfig = {
    gemini: {
        apiKey: requireEnv('GEMINI_API_KEY'),
        // Use the smallest Flash model available (check Gemini docs)
        model: 'gemini-2.0-flash-lite-preview-02-05',
    },
    groq: {
        apiKey: requireEnv('GROQ_API_KEY'),
        // Use a small, fast model
        model: 'llama3-8b-8192',
    },
    ai: {
        maxInputTokens: 4000, // reasonable for most prompts
        maxOutputTokens: 1024,
        temperature: 0.7,
        timeoutMs: 5000, // 5 seconds per provider attempt
        maxRetries: 2,
        fallbackEnabled: true,
    },
    cache: {
        ttlSeconds: 300, // 5 minutes
    },
};

export default config;