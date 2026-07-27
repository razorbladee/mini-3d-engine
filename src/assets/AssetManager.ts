export type AssetLoader<T> = (url: string, signal: AbortSignal) => Promise<T>;
export type AssetProgress = { url: string; loaded: number; total?: number };
export class AssetManager {
  private cache = new Map<string, Promise<unknown>>();
  load<T>(url: string, loader: AssetLoader<T>, options: { signal?: AbortSignal; onProgress?: (progress: AssetProgress) => void } = {}) {
    const existing = this.cache.get(url) as Promise<T> | undefined; if (existing) return existing;
    options.onProgress?.({ url, loaded: 0 });
    const promise = loader(url, options.signal ?? new AbortController().signal).then((value) => { options.onProgress?.({ url, loaded: 1, total: 1 }); return value; }).catch((error) => { this.cache.delete(url); throw error; });
    this.cache.set(url, promise); return promise;
  }
  has(url: string) { return this.cache.has(url); }
  clear(url?: string) { if (url) this.cache.delete(url); else this.cache.clear(); return this; }
}
