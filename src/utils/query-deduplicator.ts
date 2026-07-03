/**
 * Request deduplication layer to prevent race conditions and duplicate API calls
 */

type RequestKey = string
type Resolver<T> = (value: T) => void
type Rejecter = (error: Error) => void

interface PendingRequest<T> {
  promise: Promise<T>
  resolvers: Set<Resolver<T>>
  rejecters: Set<Rejecter>
}

class QueryDeduplicator {
  private pending = new Map<RequestKey, PendingRequest<unknown>>()
  private cache = new Map<RequestKey, { data: unknown; timestamp: number }>()
  private cacheTimeouts = new Map<RequestKey, number>()

  /**
   * Execute a query with automatic deduplication
   * If the same query is in-flight, return the same promise
   */
  async dedupedQuery<T>(
    key: RequestKey,
    fn: () => Promise<T>,
    cacheTtl: number = 0
  ): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cacheTtl) {
      return cached.data as T
    }

    // Check if request is in-flight
    const pending = this.pending.get(key) as PendingRequest<T> | undefined
    if (pending) {
      return new Promise((resolve, reject) => {
        pending.resolvers.add(resolve)
        pending.rejecters.add(reject)
        pending.promise.then(resolve).catch(reject)
      })
    }

    // Create new request
    let resolvers: Set<Resolver<T>> = new Set()
    let rejecters: Set<Rejecter> = new Set()

    const promise = (async () => {
      try {
        const data = await fn()

        // Cache the result
        if (cacheTtl > 0) {
          this.cache.set(key, { data, timestamp: Date.now() })
          // Clear previous timeout if exists
          const prevTimeout = this.cacheTimeouts.get(key)
          if (prevTimeout) clearTimeout(prevTimeout)
          // Set new timeout
          const timeout = window.setTimeout(() => {
            this.cache.delete(key)
            this.cacheTimeouts.delete(key)
          }, cacheTtl)
          this.cacheTimeouts.set(key, timeout)
        }

        // Resolve all waiting requests
        resolvers.forEach((resolve) => resolve(data))
        return data
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        rejecters.forEach((reject) => reject(err))
        throw err
      } finally {
        // Clean up pending request
        this.pending.delete(key)
      }
    })()

    // Cast resolvers and rejecters to the expected types
    this.pending.set(key, {
      promise,
      resolvers: resolvers as Set<Resolver<unknown>>,
      rejecters: rejecters as Set<Rejecter>
    })

    return promise
  }

  /**
   * Clear cache for a specific key
   */
  invalidate(key: RequestKey): void {
    this.cache.delete(key)
    const timeout = this.cacheTimeouts.get(key)
    if (timeout) {
      clearTimeout(timeout)
      this.cacheTimeouts.delete(key)
    }
  }

  /**
   * Clear all cache
   */
  invalidateAll(): void {
    this.cache.clear()
    this.cacheTimeouts.forEach((timeout) => clearTimeout(timeout))
    this.cacheTimeouts.clear()
  }

  /**
   * Get current cache stats (useful for debugging)
   */
  getStats() {
    return {
      cachedKeys: this.cache.size,
      pendingRequests: this.pending.size,
    }
  }
}

export const queryDeduplicator = new QueryDeduplicator()