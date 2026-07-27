import { BufferGeometry } from './BufferGeometry';

/** Unit-cube face in its own tangent frame; each face gets the full 0..1 UV range. */
type Face = { normal: [number, number, number]; right: [number, number, number]; up: [number, number, number] };

const FACES: Face[] = [
  { normal: [0, 0, 1], right: [1, 0, 0], up: [0, 1, 0] }, // +Z
  { normal: [0, 0, -1], right: [-1, 0, 0], up: [0, 1, 0] }, // -Z
  { normal: [1, 0, 0], right: [0, 0, -1], up: [0, 1, 0] }, // +X
  { normal: [-1, 0, 0], right: [0, 0, 1], up: [0, 1, 0] }, // -X
  { normal: [0, 1, 0], right: [1, 0, 0], up: [0, 0, -1] }, // +Y
  { normal: [0, -1, 0], right: [1, 0, 0], up: [0, 0, 1] }, // -Y
];

/**
 * Axis-aligned cube with per-face UVs.
 *
 * Previously the planar XZ fallback gave all 36 vertices only 4 distinct UVs,
 * so side faces received a degenerate mapping (AUDIT-TZ P1-8).
 */
export class BoxGeometry extends BufferGeometry {
  constructor(size = 1) {
    const half = size / 2;
    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    for (const face of FACES) {
      const { normal, right, up } = face;
      // Corners in (u, v) order: (0,0), (1,0), (1,1), (0,1).
      const corner = (u: number, v: number) => {
        const su = u * 2 - 1;
        const sv = v * 2 - 1;
        return [
          (normal[0] + right[0] * su + up[0] * sv) * half,
          (normal[1] + right[1] * su + up[1] * sv) * half,
          (normal[2] + right[2] * su + up[2] * sv) * half,
        ];
      };

      const quad: [number, number][] = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0],
        [1, 1],
        [0, 1],
      ];
      for (const [u, v] of quad) {
        positions.push(...corner(u, v));
        normals.push(...normal);
        uvs.push(u, v);
      }
    }

    super(positions, normals, uvs);
  }
}
