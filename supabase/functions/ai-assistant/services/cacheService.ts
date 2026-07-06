import { createClient } from '@supabase/supabase-js';
import { sha256 } from '../utils/hash.ts';
import { config } from '../config.ts';
import { logger } from '../utils/logger.ts';

// SECURITY NOTE: If user-specific data is accessed, you MUST pass the Authorization header 
// instead of using SUPABASE_ANON_KEY to ensure RLS policies are applied correctly.
const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!
);

export interface CacheEntry {
    key: string;
    value: any;
    expires_at: string;
}

export async function getCached<T>(key: string): Promise<T | null> {
    const { data, error } = await supabase
        .from('ai_cache')
        .select('value, expires_at')
        .eq('key', key)
        .single();

    if (error || !data) return null;
    if (new Date(data.expires_at) < new Date()) {
        // FIX: Explicitly await eviction to prevent Deno from severing the request early
        await supabase.from('ai_cache').delete().eq('key', key);
        return null;
    }
    logger.debug('Cache hit', { key });
    return data.value as T;
}

export async function setCache(key: string, value: any, ttlSeconds: number = config.cache.ttlSeconds): Promise<void> {
    const expires_at = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    const { error } = await supabase
        .from('ai_cache')
        .upsert({ key, value, expires_at }, { onConflict: 'key' });
    if (error) logger.error('Cache set error', { error: error.message });
}

export async function generateCacheKey(prefix: string, data: any): Promise<string> {
    const raw = `${prefix}:${JSON.stringify(data)}`;
    return await sha256(raw);
}