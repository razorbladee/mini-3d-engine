import { describe, expect, it } from 'vitest';
import { basicFragmentSource, litFragmentSource, vertexSource } from '../src/rendering/shaders';

describe('WebGL shader sources', () => {
  it('keeps GLSL preprocessor directives at the start of their own lines', () => {
    for (const source of [vertexSource, basicFragmentSource, litFragmentSource]) {
      expect(source).not.toMatch(/;\s+#/);
      expect(source.startsWith('#version 300 es')).toBe(true);
    }
    expect(litFragmentSource).toContain('\n#define MAX_LIGHTS 4\n');
  });
});
