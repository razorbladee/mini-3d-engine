import { BufferGeometry } from './BufferGeometry';
export class PlaneGeometry extends BufferGeometry {
  constructor(width = 1, height = 1) {
    const x = width / 2,
      y = height / 2;
    super([-x, -y, 0, x, -y, 0, x, y, 0, -x, -y, 0, x, y, 0, -x, y, 0]);
  }
}
