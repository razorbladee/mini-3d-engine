export type AssetLoader<T> = (url: string, signal: AbortSignal) => Promise<T>;
export type AssetProgress = { url: string; loaded: number; total?: number };
export type AssetOptions = { signal?: AbortSignal; onProgress?: (progress: AssetProgress) => void };

type CacheEntry = {
  promise: Promise<unknown>;
  controller: AbortController;
  /** Number of callers still interested; the load aborts when it reaches zero. */
  subscribers: number;
};

/**
 * Deduplicating loader cache.
 *
 * Abort handling used to be decorative (AUDIT-TZ P2-8): the first caller's
 * signal was baked into the cached promise, later callers passing a different
 * signal silently received the old one, and aborting left the rejected entry
 * in the cache. Each URL now owns an internal controller driven by subscriber
 * count, so one caller cancelling cannot strand the others.
 */
export class AssetManager {
  private readonly cache = new Map<string, CacheEntry>();

  load<T>(url: string, loader: AssetLoader<T>, options: AssetOptions = {}): Promise<T> {
    const existing = this.cache.get(url);
    if (existing) {
      existing.subscribers += 1;
      this.attachSignal(url, existing, options.signal);
      options.onProgress?.({ url, loaded: 1, total: 1 });
      return existing.promise as Promise<T>;
    }

    const controller = new AbortController();
    const entry: CacheEntry = { promise: Promise.resolve(), controller, subscribers: 1 };

    options.onProgress?.({ url, loaded: 0 });
    entry.promise = loader(url, controller.signal)
      .then((value) => {
        options.onProgress?.({ url, loaded: 1, total: 1 });
        return value;
      })
      .catch((error) => {
        // Never cache a failure: the next caller must be able to retry.
        this.cache.delete(url);
        throw error;
      });

    this.cache.set(url, entry);
    this.attachSignal(url, entry, options.signal);
    return entry.promise as Promise<T>;
  }

  /** Aborts the shared load only once every caller has withdrawn. */
  private attachSignal(url: string, entry: CacheEntry, signal?: AbortSignal) {
    if (!signal) return;
    const withdraw = () => {
      entry.subscribers -= 1;
      if (entry.subscribers > 0) return;
      entry.controller.abort();
      this.cache.delete(url);
    };
    if (signal.aborted) withdraw();
    else signal.addEventListener('abort', withdraw, { once: true });
  }

  has(url: string) {
    return this.cache.has(url);
  }

  get size() {
    return this.cache.size;
  }

  /** Drops one entry, or the whole cache, aborting any in-flight loads. */
  clear(url?: string) {
    if (url) {
      const entry = this.cache.get(url);
      entry?.controller.abort();
      this.cache.delete(url);
      return this;
    }
    for (const entry of this.cache.values()) entry.controller.abort();
    this.cache.clear();
    return this;
  }
}
