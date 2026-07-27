import { BufferGeometry } from './BufferGeometry';

export class BoxGeometry extends BufferGeometry {
  constructor(size = 1) {
    const s = size / 2;
    const positions: number[] = [];
    const face = (...vertices: number[]) => positions.push(...vertices);
    face(-s, -s, s, s, -s, s, s, s, s, -s, -s, s, s, s, s, -s, s, s);
    face(s, -s, -s, -s, -s, -s, -s, s, -s, s, -s, -s, -s, s, -s, s, s, -s);
    face(s, -s, s, s, -s, -s, s, s, -s, s, -s, s, s, s, -s, s, s, s);
    face(-s, -s, -s, -s, -s, s, -s, s, s, -s, -s, -s, -s, s, s, -s, s, -s);
    face(-s, s, s, s, s, s, s, s, -s, -s, s, s, s, s, -s, -s, s, -s);
    face(-s, -s, -s, s, -s, -s, s, -s, s, -s, -s, -s, s, -s, s, -s, -s, s);
    super(positions);
  }
}
