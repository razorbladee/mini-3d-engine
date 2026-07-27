import { describe, expect, it } from 'vitest';
import { nextIndex, pointerToNdc } from '../examples/showcase-utils';

describe('example interaction helpers', () => {
  it('converts client coordinates into normalized device coordinates', () => {
    const rect = { left: 100, top: 50, width: 400, height: 200 };
    expect(pointerToNdc(300, 150, rect)).toEqual({ x: 0, y: 0 });
    expect(pointerToNdc(100, 50, rect)).toEqual({ x: -1, y: 1 });
    expect(pointerToNdc(500, 250, rect)).toEqual({ x: 1, y: -1 });
  });

  it('rejects zero-sized pointer targets', () => {
    expect(() => pointerToNdc(0, 0, { left: 0, top: 0, width: 0, height: 10 })).toThrow('positive size');
  });

  it('cycles deterministic example states', () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(2, 3)).toBe(0);
    expect(() => nextIndex(0, 0)).toThrow('must not be empty');
  });
});
