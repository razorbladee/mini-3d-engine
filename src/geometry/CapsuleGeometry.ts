import { BufferGeometry } from './BufferGeometry';

export class CapsuleGeometry extends BufferGeometry {
  constructor(radius = 0.5, length = 1.5, segments = 20, rings = 8) {
    if (radius <= 0 || length < 0) throw new Error('CapsuleGeometry dimensions must be valid');
    if (segments < 3 || rings < 1) throw new Error('CapsuleGeometry needs valid segments and rings');
    const positions: number[] = [], normals: number[] = [];
    const profile: { y: number; r: number; ny: number }[] = [];
    for (let i = 0; i <= rings; i += 1) {
      const t = i / rings * Math.PI / 2;
      profile.push({ y: length / 2 + radius * Math.cos(t), r: radius * Math.sin(t), ny: Math.cos(t) });
    }
    if (length > 0) profile.push({ y: -length / 2, r: radius, ny: 0 });
    for (let i = 1; i <= rings; i += 1) {
      const t = i / rings * Math.PI / 2;
      profile.push({ y: -length / 2 - radius * Math.sin(t), r: radius * Math.cos(t), ny: -Math.sin(t) });
    }
    const vertex = (q: { y: number; r: number; ny: number }, angle: number) => {
      const ca = Math.cos(angle), sa = Math.sin(angle);
      const horizontal = Math.sqrt(Math.max(0, 1 - q.ny * q.ny));
      return { p: [q.r * ca, q.y, q.r * sa], n: [horizontal * ca, q.ny, horizontal * sa] };
    };
    for (let row = 0; row < profile.length - 1; row += 1) for (let col = 0; col < segments; col += 1) {
      const a0 = col / segments * Math.PI * 2, a1 = (col + 1) / segments * Math.PI * 2;
      for (const v of [vertex(profile[row], a0), vertex(profile[row], a1), vertex(profile[row + 1], a1), vertex(profile[row], a0), vertex(profile[row + 1], a1), vertex(profile[row + 1], a0)]) {
        positions.push(...v.p); normals.push(...v.n);
      }
    }
    super(positions, normals);
  }
}
