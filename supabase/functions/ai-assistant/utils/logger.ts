export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export function log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: unknown) {
    const entry = {
        level,
        timestamp: new Date().toISOString(),
        message,
        context,
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
    };
    console.log(JSON.stringify(entry));
}

export const logger = {
    debug: (msg: string, ctx?: Record<string, unknown>) => log('debug', msg, ctx),
    info: (msg: string, ctx?: Record<string, unknown>) => log('info', msg, ctx),
    warn: (msg: string, ctx?: Record<string, unknown>) => log('warn', msg, ctx),
    error: (msg: string, ctx?: Record<string, unknown>, err?: unknown) => log('error', msg, ctx, err),
};