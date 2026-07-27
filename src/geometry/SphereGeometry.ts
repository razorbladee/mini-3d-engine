import { BufferGeometry } from './BufferGeometry';

/**
 * UV sphere. The polar rings collapse to a point, so those quads are emitted as
 * single triangles instead of a triangle plus a zero-area one (AUDIT-TZ P1-3),
 * and the geometry now carries a proper spherical UV map rather than relying on
 * the planar fallback (P1-8).
 */
export class SphereGeometry extends BufferGeometry {
  constructor(radius = 1, segments = 16, rings = 8) {
    if (segments < 3 || rings < 2) throw new Error('SphereGeometry needs at least 3 segments and 2 rings');

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const point = (u: number, v: number) => {
      const theta = v * Math.PI;
      const phi = u * Math.PI * 2;
      const nx = Math.sin(theta) * Math.cos(phi);
      const ny = Math.cos(theta);
      const nz = Math.sin(theta) * Math.sin(phi);
      return { position: [radius * nx, radius * ny, radius * nz], normal: [nx, ny, nz], uv: [u, 1 - v] };
    };

    const push = (item: { position: number[]; normal: number[]; uv: number[] }) => {
      positions.push(...item.position);
      normals.push(...item.normal);
      uvs.push(...item.uv);
    };

    for (let y = 0; y < rings; y += 1) {
      const v0 = y / rings;
      const v1 = (y + 1) / rings;
      const atNorthPole = y === 0;
      const atSouthPole = y === rings - 1;

      for (let x = 0; x < segments; x += 1) {
        const u0 = x / segments;
        const u1 = (x + 1) / segments;

        const a = point(u0, v0);
        const b = point(u1, v0);
        const c = point(u1, v1);
        const d = point(u0, v1);

        // At a pole the top (or bottom) edge degenerates to a single point.
        if (!atNorthPole) {
          push(a);
          push(b);
          push(c);
        }
        if (!atSouthPole) {
          push(a);
          push(c);
          push(d);
        }
      }
    }

    super(positions, normals, uvs);
  }
}
