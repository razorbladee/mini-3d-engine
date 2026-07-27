import { BufferGeometry } from './BufferGeometry';

export class TorusGeometry extends BufferGeometry {
  constructor(radius = 1, tube = 0.35, radialSegments = 32, tubularSegments = 16) {
    if (radius <= 0 || tube <= 0) throw new Error('TorusGeometry dimensions must be positive');
    if (radialSegments < 3 || tubularSegments < 3) throw new Error('TorusGeometry needs at least 3 segments per ring');
    const positions: number[] = [], normals: number[] = [], uvs: number[] = [];
    const point = (a: number, b: number) => {
      const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
      return { p: [(radius + tube * cb) * ca, tube * sb, (radius + tube * cb) * sa], n: [cb * ca, sb, cb * sa], uv: [a / (Math.PI * 2), b / (Math.PI * 2)] };
    };
    for (let i = 0; i < radialSegments; i += 1) for (let j = 0; j < tubularSegments; j += 1) {
      const a0 = i / radialSegments * Math.PI * 2, a1 = (i + 1) / radialSegments * Math.PI * 2;
      const b0 = j / tubularSegments * Math.PI * 2, b1 = (j + 1) / tubularSegments * Math.PI * 2;
      for (const vertex of [point(a0, b0), point(a1, b0), point(a1, b1), point(a0, b0), point(a1, b1), point(a0, b1)]) {
        positions.push(...vertex.p); normals.push(...vertex.n); uvs.push(...vertex.uv);
      }
    }
    super(positions, normals, uvs);
  }
}
