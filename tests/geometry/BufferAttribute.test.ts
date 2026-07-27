import { describe, expect, it } from 'vitest';
import { BoxGeometry, BufferAttribute, BufferGeometry } from '../../src';

describe('BufferAttribute', () => {
  it('reports the vertex count from array length and item size', () => {
    expect(new BufferAttribute(new Float32Array(12), 3).count).toBe(4);
    expect(new BufferAttribute(new Float32Array(12), 2).count).toBe(6);
  });

  it('reads individual components', () => {
    const attribute = new BufferAttribute(new Float32Array([1, 2, 3, 4, 5, 6]), 3);
    expect([attribute.getX(1), attribute.getY(1), attribute.getZ(1)]).toEqual([4, 5, 6]);
  });

  it('copies a whole item', () => {
    const attribute = new BufferAttribute(new Float32Array([1, 2, 3, 4]), 2);
    expect(attribute.getItem(1)).toEqual([3, 4]);
  });

  it('defaults normalized to false', () => {
    expect(new BufferAttribute(new Float32Array(3), 3).normalized).toBe(false);
  });

  it('rejects an invalid item size', () => {
    expect(() => new BufferAttribute(new Float32Array(4), 0)).toThrow('positive integer');
    expect(() => new BufferAttribute(new Float32Array(4), 1.5)).toThrow('positive integer');
  });

  it('rejects an array that does not divide evenly', () => {
    expect(() => new BufferAttribute(new Float32Array(5), 3)).toThrow('multiple of itemSize');
  });
});

describe('BufferGeometry attribute views', () => {
  it('exposes position, normal and uv channels', () => {
    const { attributes, vertexCount } = new BoxGeometry(2);
    expect(attributes.position.itemSize).toBe(3);
    expect(attributes.normal.itemSize).toBe(3);
    expect(attributes.uv.itemSize).toBe(2);
    expect(attributes.position.count).toBe(vertexCount);
    expect(attributes.uv.count).toBe(vertexCount);
  });

  it('views the same memory as the raw arrays', () => {
    const geometry = new BufferGeometry([0, 0, 0, 1, 0, 0, 0, 1, 0]);
    expect(geometry.attributes.position.array).toBe(geometry.positions);
  });

  it('counts vertices consistently', () => {
    expect(new BufferGeometry([0, 0, 0, 1, 0, 0, 0, 1, 0]).vertexCount).toBe(3);
  });
});
