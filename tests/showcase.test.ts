import { describe, expect, it } from 'vitest';
import { examples, nextExample } from '../examples/showcase-registry';
describe('example registry', () => {
  it('keeps all working example families visible', () => {
    expect(examples).toHaveLength(17);
    expect(examples.filter((e) => e.group === 'Textures')).toHaveLength(4);
    expect(examples.filter((e) => e.group === 'Models')).toHaveLength(3);
    expect(examples.some((e) => e.id === 'advanced-primitives')).toBe(true);
    expect(examples.some((e) => e.id === 'lighting')).toBe(true);
  });
  it('cycles examples', () => {
    expect(nextExample('primitives')).toBe('advanced-primitives');
    expect(nextExample('postprocess')).toBe('primitives');
  });
});
