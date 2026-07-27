import { describe, expect, it } from 'vitest';
import { Euler, Matrix4, Vector3 } from '../../src';

/** Column-major reference multiply, independent of the implementation under test. */
function referenceMultiply(a: ArrayLike<number>, b: ArrayLike<number>) {
  const out = new Array<number>(16).fill(0);
  for (let column = 0; column < 4; column += 1) {
    for (let row = 0; row < 4; row += 1) {
      let sum = 0;
      for (let k = 0; k < 4; k += 1) sum += a[k * 4 + row] * b[column * 4 + k];
      out[column * 4 + row] = sum;
    }
  }
  return out;
}

describe('Matrix4', () => {
  it('starts as identity', () => {
    expect(Array.from(new Matrix4().elements)).toEqual([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
  });

  it('multiplies in column-major order', () => {
    const a = new Matrix4().compose(new Vector3(1, 2, 3), new Vector3(2, 1, 1), new Euler(0.3, 0.2, 0.1));
    const b = new Matrix4().compose(new Vector3(-1, 0, 2), new Vector3(1, 3, 1), new Euler(-0.2, 0.5, 0.7));
    const expected = referenceMultiply(a.elements, b.elements);
    const actual = Array.from(a.clone().multiply(b).elements);
    actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 5));
  });

  it('composes translation, rotation and scale', () => {
    const matrix = new Matrix4().compose(new Vector3(2, 3, 4), new Vector3(2, 2, 2), new Euler(0, 0, Math.PI / 2));
    expect(matrix.elements[12]).toBe(2);
    expect(matrix.elements[13]).toBe(3);
    expect(matrix.elements[14]).toBe(4);
    expect(matrix.elements[0]).toBeCloseTo(0, 5);
    expect(matrix.elements[1]).toBeCloseTo(2, 5);
  });

  it('inverts an affine transform', () => {
    const matrix = new Matrix4().compose(new Vector3(2, -3, 4), new Vector3(2, 3, 4), new Euler(0.2, -0.4, 0.1));
    const product = matrix.clone().multiply(matrix.clone().invert()).elements;
    for (let index = 0; index < 16; index += 1) expect(product[index]).toBeCloseTo(index % 5 === 0 ? 1 : 0, 4);
  });

  it('inverts a general projection-like matrix', () => {
    const matrix = new Matrix4();
    matrix.elements.set([2, 0, 0, 0, 0, 3, 0, 0, 0, 0, -1.002, -1, 0, 0, -0.2002, 0]);
    const product = referenceMultiply(matrix.elements, matrix.clone().invert().elements);
    product.forEach((value, index) => expect(value).toBeCloseTo(index % 5 === 0 ? 1 : 0, 4));
  });

  it('rejects singular matrices', () => {
    expect(() => new Matrix4().compose(new Vector3(), new Vector3(0, 1, 1)).invert()).toThrow('not invertible');
  });

  it('clones without sharing the underlying buffer', () => {
    const source = new Matrix4().compose(new Vector3(1, 1, 1), new Vector3(1, 1, 1));
    const copy = source.clone();
    copy.elements[12] = 99;
    expect(source.elements[12]).toBe(1);
  });
});
