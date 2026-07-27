import { BufferGeometry } from './BufferGeometry';

/** Closed Y-axis cone with deliberately faceted sides for low-poly work. */
export class ConeGeometry extends BufferGeometry {
  constructor(radius = 1, height = 2, segments = 12) {
    if (radius <= 0 || height <= 0) throw new Error('ConeGeometry dimensions must be positive');
    if (segments < 3 || !Number.isInteger(segments)) throw new Error('ConeGeometry needs at least 3 segments');

    const positions: number[] = [];
    const half = height / 2;
    for (let index = 0; index < segments; index += 1) {
      const start = (index / segments) * Math.PI * 2;
      const end = ((index + 1) / segments) * Math.PI * 2;
      const x0 = Math.cos(start) * radius;
      const z0 = Math.sin(start) * radius;
      const x1 = Math.cos(end) * radius;
      const z1 = Math.sin(end) * radius;

      // One side face and one downward-facing cap face per segment.
      positions.push(x0, -half, z0, 0, half, 0, x1, -half, z1);
      positions.push(0, -half, 0, x0, -half, z0, x1, -half, z1);
    }
    super(positions);
  }
}
