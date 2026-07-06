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