import { describe, expect, it } from 'vitest';
import { AssetManager } from '../../src';

describe('AssetManager', () => {
  it('deduplicates concurrent loads of the same url', async () => {
    const manager = new AssetManager();
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return 42;
    };
    const [a, b] = await Promise.all([manager.load('x', loader), manager.load('x', loader)]);
    expect([a, b]).toEqual([42, 42]);
    expect(calls).toBe(1);
  });

  it('serves later requests from cache', async () => {
    const manager = new AssetManager();
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return calls;
    };
    await manager.load('x', loader);
    expect(await manager.load('x', loader)).toBe(1);
    expect(calls).toBe(1);
  });

  it('keeps distinct urls apart', async () => {
    const manager = new AssetManager();
    await manager.load('a', async () => 'A');
    await manager.load('b', async () => 'B');
    expect(manager.has('a')).toBe(true);
    expect(manager.has('b')).toBe(true);
  });

  it('does not cache a failed load', async () => {
    const manager = new AssetManager();
    let attempts = 0;
    const flaky = async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('network');
      return 'ok';
    };
    await expect(manager.load('x', flaky)).rejects.toThrow('network');
    expect(manager.has('x')).toBe(false);
    expect(await manager.load('x', flaky)).toBe('ok');
  });

  it('clears a single entry or the whole cache', async () => {
    const manager = new AssetManager();
    await manager.load('a', async () => 1);
    await manager.load('b', async () => 2);
    manager.clear('a');
    expect(manager.has('a')).toBe(false);
    expect(manager.has('b')).toBe(true);
    manager.clear();
    expect(manager.has('b')).toBe(false);
  });

  it('reports progress around the load', async () => {
    const manager = new AssetManager();
    const events: number[] = [];
    await manager.load('x', async () => 1, { onProgress: (progress) => events.push(progress.loaded) });
    expect(events[0]).toBe(0);
    expect(events.at(-1)).toBe(1);
  });

  it('passes a live signal to the loader', async () => {
    // The loader receives the entry's shared signal rather than one caller's:
    // a single subscriber cancelling must not strand the others (P2-8).
    const manager = new AssetManager();
    const controller = new AbortController();
    let received: AbortSignal | undefined;
    await manager.load(
      'x',
      async (_url, signal) => {
        received = signal;
        return 1;
      },
      { signal: controller.signal },
    );
    expect(received).toBeInstanceOf(AbortSignal);
    expect(received!.aborted).toBe(false);
  });

  it('aborts the shared load only when every subscriber withdraws', async () => {
    const manager = new AssetManager();
    const first = new AbortController();
    const second = new AbortController();
    let signal: AbortSignal | undefined;
    const loader = async (_url: string, incoming: AbortSignal) => {
      signal = incoming;
      return new Promise<number>((resolve) => setTimeout(() => resolve(1), 5));
    };

    const a = manager.load('x', loader, { signal: first.signal });
    manager.load('x', loader, { signal: second.signal });

    first.abort();
    expect(signal!.aborted).toBe(false);
    expect(manager.has('x')).toBe(true);

    second.abort();
    expect(signal!.aborted).toBe(true);
    expect(manager.has('x')).toBe(false);
    await expect(a).resolves.toBe(1);
  });

  it('aborts in-flight loads when cleared', async () => {
    const manager = new AssetManager();
    let signal: AbortSignal | undefined;
    manager.load('x', async (_url, incoming) => {
      signal = incoming;
      return new Promise<number>((resolve) => setTimeout(() => resolve(1), 5));
    });
    manager.clear('x');
    expect(signal!.aborted).toBe(true);
  });

  it('tracks its size', async () => {
    const manager = new AssetManager();
    await manager.load('a', async () => 1);
    await manager.load('b', async () => 2);
    expect(manager.size).toBe(2);
    manager.clear();
    expect(manager.size).toBe(0);
  });

  it('supplies a signal even when the caller omits one', async () => {
    const manager = new AssetManager();
    let received: AbortSignal | undefined;
    await manager.load('x', async (_url, signal) => {
      received = signal;
      return 1;
    });
    expect(received).toBeInstanceOf(AbortSignal);
  });
});
