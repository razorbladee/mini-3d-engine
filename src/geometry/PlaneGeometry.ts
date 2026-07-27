import { BufferGeometry } from './BufferGeometry';

/**
 * XY plane facing +Z.
 *
 * Declares its own UVs: the planar fallback in BufferGeometry projects onto XZ,
 * and this geometry has a constant z, so every v collapsed to 0 and textures
 * were smeared into a stripe (AUDIT-TZ P1-8).
 */
export class PlaneGeometry extends BufferGeometry {
  constructor(width = 1, height = 1) {
    const x = width / 2;
    const y = height / 2;
    super(
      [-x, -y, 0, x, -y, 0, x, y, 0, -x, -y, 0, x, y, 0, -x, y, 0],
      [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
      [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1],
    );
  }
}
