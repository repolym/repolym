export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms)
    );
    return Promise.race([promise, timeout]);
}