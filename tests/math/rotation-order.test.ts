import { describe, expect, it } from 'vitest';
import { Euler, Matrix4, Vector3 } from '../../src';

/**
 * AUDIT-TZ P1-2 / P1-5.
 *
 * `Euler.order` is currently a decorative string: `Matrix4.compose` always
 * applies XYZ. OrbitControls assumes YXZ, which is why the camera misses its
 * target by up to 14.6 degrees, and GLTFLoader converts quaternions with a ZYX
 * formula and feeds the result into an XYZ compose.
 *
 * These tests are expected to fail until stage 3.
 */

const mul3 = (a: number[], b: number[]) => {
  const out = new Array<number>(9).fill(0);
  for (let column = 0; column < 3; column += 1) {
    for (let row = 0; row < 3; row += 1) {
      let sum = 0;
      for (let k = 0; k < 3; k += 1) sum += a[k * 3 + row] * b[column * 3 + k];
      out[column * 3 + row] = sum;
    }
  }
  return out;
};

// Column-major basic rotations.
const rotX = (a: number) => [1, 0, 0, 0, Math.cos(a), Math.sin(a), 0, -Math.sin(a), Math.cos(a)];
const rotY = (a: number) => [Math.cos(a), 0, -Math.sin(a), 0, 1, 0, Math.sin(a), 0, Math.cos(a)];
const rotZ = (a: number) => [Math.cos(a), Math.sin(a), 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 1];

const linearPart = (matrix: Matrix4) => {
  const e = matrix.elements;
  return [e[0], e[1], e[2], e[4], e[5], e[6], e[8], e[9], e[10]];
};

const composeWith = (euler: Euler) => linearPart(new Matrix4().compose(new Vector3(), new Vector3(1, 1, 1), euler));

describe('Euler order is honoured by Matrix4.compose', () => {
  const x = 0.3;
  const y = 0.4;
  const z = 0.5;

  it('applies XYZ when requested', () => {
    const expected = mul3(mul3(rotX(x), rotY(y)), rotZ(z));
    composeWith(new Euler(x, y, z, 'XYZ')).forEach((value, index) => expect(value).toBeCloseTo(expected[index], 6));
  });

  it('applies YXZ when requested', () => {
    const expected = mul3(mul3(rotY(y), rotX(x)), rotZ(z));
    composeWith(new Euler(x, y, z, 'YXZ')).forEach((value, index) => expect(value).toBeCloseTo(expected[index], 6));
  });

  it('applies ZYX when requested', () => {
    const expected = mul3(mul3(rotZ(z), rotY(y)), rotX(x));
    composeWith(new Euler(x, y, z, 'ZYX')).forEach((value, index) => expect(value).toBeCloseTo(expected[index], 6));
  });

  it('produces different matrices for different orders', () => {
    const xyz = composeWith(new Euler(x, y, z, 'XYZ'));
    const yxz = composeWith(new Euler(x, y, z, 'YXZ'));
    expect(xyz.some((value, index) => Math.abs(value - yxz[index]) > 1e-6)).toBe(true);
  });
});
