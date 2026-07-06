export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 2,
    baseDelay: number = 500,
    shouldRetry: (error: unknown) => boolean = () => true
): Promise<T> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (!shouldRetry(error) || attempt === maxRetries) throw error;
            const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 100;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}