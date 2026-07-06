import { logger } from './utils/logger.ts';
import { handleChat } from './routes/chat.ts';
import { handleAnalyze } from './routes/analyze.ts';
import { handleRecommend } from './routes/recommend.ts';
import { handleSummarize } from './routes/summarize.ts';

Deno.serve(async (req: Request) => {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*', // restrict in production
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    try {
        const body = await req.json();
        const { action, data } = body;
        logger.info('Request received', { action });

        let result;
        switch (action) {
            case 'chat':
                result = await handleChat(data);
                break;
            case 'analyze':
                result = await handleAnalyze(data);
                break;
            case 'recommend':
                result = await handleRecommend(data);
                break;
            case 'summarize':
                result = await handleSummarize(data);
                break;
            default:
                result = { success: false, error: 'Invalid action' };
        }

        return new Response(JSON.stringify(result), {
            status: result.success ? 200 : 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        logger.error('Unhandled error', undefined, error);
        return new Response(
            JSON.stringify({ success: false, error: 'Internal server error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});