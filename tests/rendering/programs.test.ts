import { describe, expect, it } from 'vitest';
import { LIT_UNIFORMS, SHARED_UNIFORMS, MAX_LIGHTS } from '../../src';
import { basicFragmentSource, litFragmentSource, vertexSource } from '../../src/rendering/shaders';
import { declaredUniformNames } from '../helpers/fakeGL';

/**
 * AUDIT-TZ P1-1.
 *
 * The uniform tables are the contract between TypeScript and GLSL. Deriving
 * names by substring produced 'uAmbientColor[0]' for a plain vec3, which
 * getUniformLocation resolves to null and gl.uniform3fv silently ignores.
 * These tests keep the table and the shaders in lockstep.
 */

const litDeclared = [...declaredUniformNames(vertexSource), ...declaredUniformNames(litFragmentSource)];
const basicDeclared = [...declaredUniformNames(vertexSource), ...declaredUniformNames(basicFragmentSource)];

describe('uniform tables', () => {
  it('maps every shared uniform to a name the shaders declare', () => {
    for (const name of Object.values(SHARED_UNIFORMS)) expect(litDeclared).toContain(name);
  });

  it('maps every lit uniform to a name the lit shader declares', () => {
    for (const name of Object.values(LIT_UNIFORMS)) expect(litDeclared).toContain(name);
  });

  it('covers every uniform the basic program needs', () => {
    for (const name of Object.values(SHARED_UNIFORMS)) expect(basicDeclared).toContain(name);
  });

  it('suffixes array uniforms with [0] and scalars without', () => {
    expect(LIT_UNIFORMS.ambientColor).toBe('uAmbientColor');
    expect(LIT_UNIFORMS.directionalColor).toBe('uDirectionalColor[0]');
    expect(LIT_UNIFORMS.pointPosition).toBe('uPointPosition[0]');
    expect(LIT_UNIFORMS.pointDistance).toBe('uPointDistance[0]');
  });

  it('agrees with the shader on the light count', () => {
    const match = litFragmentSource.match(/#define\s+MAX_LIGHTS\s+(\d+)/);
    expect(match).not.toBeNull();
    expect(Number(match![1])).toBe(MAX_LIGHTS);
  });

  it('declares no uniform the shaders do not have', () => {
    const all = [...Object.values(SHARED_UNIFORMS), ...Object.values(LIT_UNIFORMS)];
    expect(all.filter((name) => !litDeclared.includes(name))).toEqual([]);
  });
});
