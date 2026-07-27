import { describe, expect, it } from 'vitest';
import { Color, Vector2, Vector3, Vector4 } from '../../src';

describe('Vector3', () => {
  it('adds, subtracts and scales in place', () => {
    const vector = new Vector3(1, 2, 3);
    expect(vector.add(new Vector3(1, 1, 1))).toBe(vector);
    expect([vector.x, vector.y, vector.z]).toEqual([2, 3, 4]);
    vector.sub(new Vector3(2, 3, 4));
    expect([vector.x, vector.y, vector.z]).toEqual([0, 0, 0]);
    expect(new Vector3(1, 2, 3).multiplyScalar(2)).toEqual(new Vector3(2, 4, 6));
  });

  it('measures length and normalizes', () => {
    expect(new Vector3(3, 4, 0).length()).toBe(5);
    const unit = new Vector3(0, 5, 0).normalize();
    expect(unit.length()).toBeCloseTo(1, 10);
  });

  it('normalizes a zero vector without producing NaN', () => {
    const zero = new Vector3().normalize();
    expect([zero.x, zero.y, zero.z].every(Number.isFinite)).toBe(true);
  });

  it('clones independently', () => {
    const source = new Vector3(1, 2, 3);
    const copy = source.clone();
    copy.x = 9;
    expect(source.x).toBe(1);
  });
});

describe('Vector2', () => {
  it('supports basic arithmetic', () => {
    expect(new Vector2(3, 4).length()).toBe(5);
    expect(new Vector2(1, 1).add(new Vector2(2, 3))).toEqual(new Vector2(3, 4));
    expect(new Vector2(4, 6).multiplyScalar(0.5)).toEqual(new Vector2(2, 3));
  });
});

describe('Vector4', () => {
  it('defaults w to 1 and preserves it when omitted', () => {
    const vector = new Vector4(1, 2, 3);
    expect(vector.w).toBe(1);
    vector.set(4, 5, 6);
    expect(vector.w).toBe(1);
    vector.set(7, 8, 9, 0);
    expect(vector.w).toBe(0);
  });
});

describe('Color', () => {
  it('parses six and three digit hex', () => {
    expect(new Color().setHex('#ff0000').toArray()).toEqual([1, 0, 0]);
    const short = new Color().setHex('#0f0');
    expect(short.g).toBe(1);
    expect(short.r).toBe(0);
  });

  it('parses hex without a leading hash', () => {
    expect(new Color().setHex('0000ff').toArray()).toEqual([0, 0, 1]);
  });
});
