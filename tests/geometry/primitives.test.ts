import { describe, expect, it } from 'vitest';
import {
  BoxGeometry,
  BufferGeometry,
  CapsuleGeometry,
  CylinderGeometry,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
} from '../../src';

type Primitive = { name: string; geometry: BufferGeometry };

const allPrimitives = (): Primitive[] => [
  { name: 'box', geometry: new BoxGeometry(2) },
  { name: 'plane', geometry: new PlaneGeometry(2, 2) },
  { name: 'sphere', geometry: new SphereGeometry(1, 16, 8) },
  { name: 'cylinder', geometry: new CylinderGeometry() },
  { name: 'torus', geometry: new TorusGeometry() },
  { name: 'capsule', geometry: new CapsuleGeometry() },
];

/** Signed area check: face normal from winding vs. the stored vertex normal. */
function windingReport(geometry: BufferGeometry) {
  let flipped = 0;
  let degenerate = 0;
  const { positions, normals } = geometry;
  for (let i = 0; i < positions.length; i += 9) {
    const ax = positions[i + 3] - positions[i];
    const ay = positions[i + 4] - positions[i + 1];
    const az = positions[i + 5] - positions[i + 2];
    const bx = positions[i + 6] - positions[i];
    const by = positions[i + 7] - positions[i + 1];
    const bz = positions[i + 8] - positions[i + 2];
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;
    const length = Math.hypot(nx, ny, nz);
    if (length < 1e-7) {
      degenerate += 1;
      continue;
    }
    if ((nx * normals[i] + ny * normals[i + 1] + nz * normals[i + 2]) / length < 0) flipped += 1;
  }
  return { flipped, degenerate };
}

describe('BufferGeometry attribute contract', () => {
  it.each(allPrimitives())('$name produces consistent attribute lengths', ({ geometry }) => {
    expect(geometry.positions.length % 9).toBe(0);
    expect(geometry.normals.length).toBe(geometry.positions.length);
    expect(geometry.uvs.length).toBe((geometry.positions.length / 3) * 2);
    expect(Array.from(geometry.positions).every(Number.isFinite)).toBe(true);
    expect(Array.from(geometry.normals).every(Number.isFinite)).toBe(true);
    expect(Array.from(geometry.uvs).every(Number.isFinite)).toBe(true);
  });

  it.each(allPrimitives())('$name has unit-length normals', ({ geometry }) => {
    for (let i = 0; i < geometry.normals.length; i += 3) {
      const length = Math.hypot(geometry.normals[i], geometry.normals[i + 1], geometry.normals[i + 2]);
      expect(length).toBeCloseTo(1, 4);
    }
  });

  it.each(allPrimitives())('$name reports a positive bounding radius', ({ geometry }) => {
    expect(geometry.boundingRadius).toBeGreaterThan(0);
  });

  it('validates custom attribute lengths', () => {
    expect(() => new BufferGeometry([0, 1])).toThrow('xyz triples');
    expect(() => new BufferGeometry([0, 1, 0], [0, 0])).toThrow('normals');
    expect(() => new BufferGeometry([0, 1, 0], undefined, [0])).toThrow('UVs');
  });

  it('rejects invalid primitive parameters', () => {
    expect(() => new SphereGeometry(1, 2, 1)).toThrow('at least 3');
    expect(() => new CylinderGeometry(1, 2, 2)).toThrow('at least 3 segments');
    expect(() => new CylinderGeometry(0, 2, 8)).toThrow('positive');
    expect(() => new TorusGeometry(0, 0.3)).toThrow('positive');
    expect(() => new CapsuleGeometry(0.5, 1, 2)).toThrow('segments');
  });
});

describe('primitive topology', () => {
  it('creates closed cylinder topology', () => {
    const geometry = new CylinderGeometry(1, 2, 12);
    expect(geometry.positions.length / 3).toBe(12 * 12);
    expect(Array.from(geometry.normals).some((value) => value === 1)).toBe(true);
    expect(Array.from(geometry.normals).some((value) => value === -1)).toBe(true);
  });

  // AUDIT-TZ P1-3: capsule emits 640 of 680 triangles with reversed winding and
  // 40 zero-area triangles at the poles; sphere emits 32. Fails until stage 4.
  it.each(allPrimitives())('$name has no degenerate triangles', ({ geometry }) => {
    expect(windingReport(geometry).degenerate).toBe(0);
  });

  it.each(allPrimitives())('$name winding matches its vertex normals', ({ geometry }) => {
    expect(windingReport(geometry).flipped).toBe(0);
  });
});

describe('default UV mapping', () => {
  // AUDIT-TZ P1-8: the planar fallback projects onto XZ, but PlaneGeometry lies
  // in XY, so every v collapses to 0. Fails until stage 4.
  it('gives the plane its four corner UVs', () => {
    const uvs = new PlaneGeometry(2, 2).uvs;
    const corners = new Set<string>();
    for (let i = 0; i < uvs.length; i += 2) corners.add(`${uvs[i]},${uvs[i + 1]}`);
    expect([...corners].sort()).toEqual(['0,0', '0,1', '1,0', '1,1']);
  });

  it('maps every box face across the full UV range', () => {
    // Each face is mapped independently to 0..1, so the six faces share the same
    // four corner pairs. The real invariant is per-face coverage: every face
    // must span the whole unit square rather than collapsing, which is what the
    // XZ planar fallback used to do to the four side faces.
    const box = new BoxGeometry(2);
    for (let face = 0; face < 6; face += 1) {
      const start = face * 6 * 2;
      const corners = new Set<string>();
      for (let i = start; i < start + 12; i += 2) corners.add(`${box.uvs[i]},${box.uvs[i + 1]}`);
      expect([...corners].sort()).toEqual(['0,0', '0,1', '1,0', '1,1']);
    }
  });

  it('gives each box face its own normal', () => {
    const box = new BoxGeometry(2);
    const faceNormals = new Set<string>();
    for (let i = 0; i < box.normals.length; i += 3)
      faceNormals.add(`${box.normals[i]},${box.normals[i + 1]},${box.normals[i + 2]}`);
    expect(faceNormals.size).toBe(6);
  });

  it('keeps UVs inside the unit square', () => {
    for (const { geometry } of allPrimitives()) {
      expect(Array.from(geometry.uvs).every((value) => value >= -1e-6 && value <= 1 + 1e-6)).toBe(true);
    }
  });
});
