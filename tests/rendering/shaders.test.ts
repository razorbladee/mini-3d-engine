import { describe, expect, it } from 'vitest';
import { basicFragmentSource, litFragmentSource, vertexSource } from '../../src/rendering/shaders';

/**
 * AUDIT-TZ T-5.
 *
 * The previous assertion was `expect(source).not.toMatch(/;\s+#/)`. Because \s
 * matches newlines, it flagged the perfectly valid sequence
 * `precision highp float;\n#define MAX_LIGHTS 4` and failed on correct code.
 * These tests check the real GLSL constraint instead: a preprocessor directive
 * must be the first thing on its line.
 */

const sources = [
  { name: 'vertex', source: vertexSource },
  { name: 'basic fragment', source: basicFragmentSource },
  { name: 'lit fragment', source: litFragmentSource },
];

describe('GLSL sources', () => {
  it.each(sources)('$name starts with the #version directive', ({ source }) => {
    expect(source.split('\n')[0]).toBe('#version 300 es');
  });

  it.each(sources)('$name keeps every directive at the start of its own line', ({ source }) => {
    source.split('\n').forEach((line) => {
      if (!line.includes('#')) return;
      expect(line.indexOf('#')).toBe(0);
    });
  });

  it.each(sources)('$name has no leading whitespace before a directive', ({ source }) => {
    expect(source).not.toMatch(/^[^\S\n]+#/m);
  });

  it.each(sources.filter((entry) => entry.name !== 'vertex'))('$name declares a float precision', ({ source }) => {
    expect(source).toMatch(/precision\s+(low|medium|high)p\s+float\s*;/);
  });

  it.each(sources)('$name declares exactly one fragment output, or none for the vertex stage', ({ name, source }) => {
    const outputs = source.match(/\bout\s+vec4\s+\w+\s*;/g) ?? [];
    expect(outputs.length).toBe(name === 'vertex' ? 0 : 1);
  });

  it('defines MAX_LIGHTS before using it', () => {
    const defineIndex = litFragmentSource.indexOf('#define MAX_LIGHTS');
    expect(defineIndex).toBeGreaterThan(-1);
    expect(litFragmentSource.indexOf('[MAX_LIGHTS]')).toBeGreaterThan(defineIndex);
  });

  it('matches vertex outputs with fragment inputs', () => {
    const outs = [...vertexSource.matchAll(/out\s+(\w+)\s+(\w+)\s*;/g)].map((match) => `${match[1]} ${match[2]}`);
    const ins = [...litFragmentSource.matchAll(/in\s+(\w+)\s+(\w+)\s*;/g)].map((match) => `${match[1]} ${match[2]}`);
    for (const input of ins) expect(outs).toContain(input);
  });
});
