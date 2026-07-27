import { describe, expect, it } from 'vitest';
import { AabbBounds, AssetManager, InputMap, PerformanceMetrics, SphereBounds, Vector3 } from '../src';
describe('production foundations', () => {
  it('deduplicates assets', async () => {
    const manager = new AssetManager();
    let calls = 0;
    const loader = async () => {
      calls += 1;
      return 42;
    };
    const [a, b] = await Promise.all([manager.load('x', loader), manager.load('x', loader)]);
    expect(a).toBe(42);
    expect(b).toBe(42);
    expect(calls).toBe(1);
  });
  it('checks bounds and metrics', () => {
    const sphere = new SphereBounds(new Vector3(1, 0, 0), 2);
    expect(sphere.contains(new Vector3(2, 0, 0))).toBe(true);
    const box = new AabbBounds().expand(new Vector3(1, 2, 3));
    expect(box.contains(new Vector3(1, 2, 3))).toBe(true);
    expect(new PerformanceMetrics().update(0.5).fps).toBe(2);
  });
  it('creates an input map without browser globals', () => {
    const target = new EventTarget();
    const input = new InputMap(target);
    expect(input.bind('jump', [' ']).action).toBe('jump');
    input.dispose();
  });
});
