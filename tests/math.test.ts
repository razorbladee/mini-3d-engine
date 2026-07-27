import { describe, expect, it } from 'vitest';
import { Euler, Matrix4, Node, Vector3 } from '../src';

describe('Matrix4 and scene transforms', () => {
  it('composes translation, rotation, and scale', () => {
    const matrix = new Matrix4().compose(new Vector3(2, 3, 4), new Vector3(2, 2, 2), new Euler(0, 0, Math.PI / 2));
    expect(matrix.elements[12]).toBe(2);
    expect(matrix.elements[13]).toBe(3);
    expect(matrix.elements[0]).toBeCloseTo(0, 5);
    expect(matrix.elements[1]).toBeCloseTo(2, 5);
  });

  it('inverts an affine transform', () => {
    const matrix = new Matrix4().compose(new Vector3(2, -3, 4), new Vector3(2, 3, 4), new Euler(0.2, -0.4, 0.1));
    const product = matrix.clone().multiply(matrix.clone().invert()).elements;
    for (let index = 0; index < 16; index += 1) expect(product[index]).toBeCloseTo(index % 5 === 0 ? 1 : 0, 4);
  });

  it('rejects singular matrices', () => {
    expect(() => new Matrix4().compose(new Vector3(), new Vector3(0, 1, 1)).invert()).toThrow('not invertible');
  });

  it('propagates rotated parent transforms', () => {
    const parent = new Node();
    parent.rotation.z = Math.PI / 2;
    const child = new Node();
    child.position.x = 2;
    parent.add(child).updateWorldMatrix();
    expect(child.worldMatrix.elements[12]).toBeCloseTo(0, 5);
    expect(child.worldMatrix.elements[13]).toBeCloseTo(2, 5);
  });

  it('prevents cyclic scene graphs', () => {
    const parent = new Node();
    const child = new Node();
    parent.add(child);
    expect(() => child.add(parent)).toThrow('cyclic');
  });
});
