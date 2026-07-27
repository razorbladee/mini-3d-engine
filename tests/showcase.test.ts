import { describe, expect, it } from 'vitest';
import { examples, nextExample } from '../examples/showcase-registry';

describe('example scene browser registry', () => {
  it('exposes textured and procedural scenes alongside the engine examples', () => {
    expect(examples).toHaveLength(12);
    expect(new Set(examples.map((example) => example.id)).size).toBe(12);
    expect(examples.filter((example) => example.group === 'Textures')).toHaveLength(4);
    expect(examples.some((example) => example.id === 'procedural-textures')).toBe(true);
    expect(examples.some((example) => example.id === 'wood-texture')).toBe(true);
  });
  it('cycles from the current scene to the next scene', () => {
    expect(nextExample('primitives')).toBe('materials');
    expect(nextExample('postprocess')).toBe('primitives');
  });
});
