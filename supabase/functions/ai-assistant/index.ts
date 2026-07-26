import { logger } from './utils/logger.ts';
import { handleChat } from './routes/chat.ts';
import { handleAnalyze } from './routes/analyze.ts';
import { handleRecommend } from './routes/recommend.ts';
import { handleSummarize } from './routes/summarize.ts';
import { validateEnv } from './config.ts';
import { createClient } from '@supabase/supabase-js';
import { OpenRouterProvider } from './providers/openrouter.ts';

validateEnv();

const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Must be set in secrets
);

const ALLOWED_ORIGINS = [
    'https://repolym.github.io',
    'http://localhost:5173',
];

const corsHeaders = (origin: string) => ({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
});

// Helper to send SSE chunks
function sendSSE(controller: ReadableStreamDefaultController, data: any) {
    const encoder = new TextEncoder();
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

export async function handleStreamChat(data: any, userId: string) {
    const { messages, complexity } = data;

    const openrouter = new OpenRouterProvider();
    const stream = new ReadableStream({
        async start(controller) {
            try {
                // Send initial status
                sendSSE(controller, { type: 'status', message: 'در حال پردازش...' });

                let fullContent = '';
                let lastChunkTime = Date.now();

                const result = await openrouter.chatStream(
                    messages,
                    {
                        maxTokens: 1024,
                        temperature: complexity === 'advanced' ? 0.5 : 0.7,
                        complexity: complexity || 'medium',
                        onChunk: (chunk: string) => {
                            fullContent += chunk;
                            // Send chunk to client
                            sendSSE(controller, { type: 'chunk', content: chunk });
                            lastChunkTime = Date.now();
                        }
                    }
                );

                // Send final message
                sendSSE(controller, {
                    type: 'done',
                    content: fullContent,
                    model: result.model,
                    usage: result.usage,
                });

                controller.close();
            } catch (error) {
                logger.error('Stream error', undefined, error);
                sendSSE(controller, {
                    type: 'error',
                    message: error instanceof Error ? error.message : 'Unknown error',
                });
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

Deno.serve(async (req: Request) => {
    const origin = req.headers.get('origin') || '';
    const isAllowed = ALLOWED_ORIGINS.includes(origin);

    if (req.method === 'OPTIONS') {
        if (isAllowed) return new Response(null, { status: 204, headers: corsHeaders(origin) });
        return new Response('Origin not allowed', { status: 403 });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), { status: 401 });
        }
        const token = authHeader.substring(7);

        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !user) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid token' }), { status: 401 });
        }

        const body = await req.json();
        const { action, data } = body;

        // Check if streaming is requested
        if (action === 'chat' && data.stream === true) {
            return handleStreamChat(data, user.id);
        }

        let result;
        switch (action) {
            case 'chat':
                result = await handleChat(data);
                break;
            case 'analyze':
                result = await handleAnalyze(data, user.id);
                break;
            case 'recommend':
                result = await handleRecommend(data, user.id);
                break;
            case 'summarize':
                result = await handleSummarize(data);
                break;
            default:
                return new Response(JSON.stringify({ success: false, error: 'Invalid action' }), { status: 400 });
        }

        return new Response(JSON.stringify(result), {
            status: 200,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
    } catch (err) {
        logger.error('Request handler error', {}, err);
        return new Response(JSON.stringify({ success: false, error: err.message || 'Server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        });
    }
});