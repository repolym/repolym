export const config = {
    gemini: {
        apiKey: Deno.env.get('GEMINI_API_KEY')!,
        model: 'gemini-2.0-flash-lite',
    },
    groq: {
        apiKey: Deno.env.get('GROQ_API_KEY')!,
        model: 'llama-3.3-70b-versatile',
    },
    ai: {
        maxInputTokens: 4000,
        maxOutputTokens: 1024,
        temperature: 0.7,
        timeoutMs: 8000,
        maxRetries: 2,
        fallbackEnabled: true,
    },
    cache: {
        ttlSeconds: 300,
    },
};

export function validateEnv() {
    const required = ['GEMINI_API_KEY', 'GROQ_API_KEY', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
    const missing = required.filter(key => !Deno.env.get(key));
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
}