import { BufferGeometry } from './BufferGeometry';

export class SphereGeometry extends BufferGeometry {
  constructor(radius = 1, segments = 16, rings = 8) {
    if (segments < 3 || rings < 2) throw new Error('SphereGeometry needs at least 3 segments and 2 rings');
    const positions: number[] = [];
    const normals: number[] = [];
    for (let y = 0; y < rings; y += 1) {
      const v0 = y / rings;
      const v1 = (y + 1) / rings;
      const t0 = v0 * Math.PI;
      const t1 = v1 * Math.PI;
      for (let x = 0; x < segments; x += 1) {
        const u0 = x / segments;
        const u1 = (x + 1) / segments;
        const point = (u: number, t: number) => {
          const nx = Math.sin(t) * Math.cos(u * Math.PI * 2);
          const ny = Math.cos(t);
          const nz = Math.sin(t) * Math.sin(u * Math.PI * 2);
          return { position: [radius * nx, radius * ny, radius * nz], normal: [nx, ny, nz] };
        };
        const a = point(u0, t0),
          b = point(u1, t0),
          c = point(u1, t1),
          d = point(u0, t1);
        for (const vertex of [a, b, c, a, c, d]) {
          positions.push(...vertex.position);
          normals.push(...vertex.normal);
        }
      }
    }
    super(positions, normals);
  }
}
