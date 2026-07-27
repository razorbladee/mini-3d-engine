import { describe, expect, it } from 'vitest';
import { examples, nextExample } from '../examples/showcase-registry';

describe('example scene browser registry', () => {
  it('exposes a complete, unique set of scenes', () => {
    expect(examples).toHaveLength(8);
    expect(new Set(examples.map((example) => example.id)).size).toBe(8);
    expect(examples.some((example) => example.group === 'Materials')).toBe(true);
    expect(examples.some((example) => example.group === 'Interaction')).toBe(true);
  });
  it('cycles from the current scene to the next scene', () => {
    expect(nextExample('primitives')).toBe('materials');
    expect(nextExample('postprocess')).toBe('primitives');
  });
});
