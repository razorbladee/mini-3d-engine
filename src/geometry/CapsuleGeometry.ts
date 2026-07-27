import { BufferGeometry } from './BufferGeometry';

type ProfilePoint = { y: number; radius: number; normalY: number; v: number };

/**
 * Capsule built as a surface of revolution: a hemispherical cap, an optional
 * cylindrical body and a second cap.
 *
 * The previous implementation emitted 640 of 680 triangles with reversed
 * winding, so back-face culling hid the whole primitive, plus 40 zero-area
 * triangles where the polar rings collapse to a point (AUDIT-TZ P1-3).
 */
export class CapsuleGeometry extends BufferGeometry {
  constructor(radius = 0.5, length = 1.5, segments = 20, rings = 8) {
    if (radius <= 0 || length < 0) throw new Error('CapsuleGeometry dimensions must be valid');
    if (segments < 3 || rings < 1) throw new Error('CapsuleGeometry needs valid segments and rings');

    const positions: number[] = [];
    const normals: number[] = [];
    const uvs: number[] = [];

    const epsilon = radius * 1e-6;
    const profile: ProfilePoint[] = [];
    // Top cap: from the north pole down to the equator of the upper hemisphere.
    for (let i = 0; i <= rings; i += 1) {
      const t = ((i / rings) * Math.PI) / 2;
      profile.push({ y: length / 2 + radius * Math.cos(t), radius: radius * Math.sin(t), normalY: Math.cos(t), v: 0 });
    }
    if (length > 0) profile.push({ y: -length / 2, radius, normalY: 0, v: 0 });
    // Bottom cap.
    for (let i = 1; i <= rings; i += 1) {
      const t = ((i / rings) * Math.PI) / 2;
      profile.push({
        y: -length / 2 - radius * Math.sin(t),
        radius: radius * Math.cos(t),
        normalY: -Math.sin(t),
        v: 0,
      });
    }

    // Parameterise v by arc length along the profile so the texture does not
    // bunch up where the caps meet the body.
    const total = profile[0].y - profile[profile.length - 1].y || 1;
    for (const point of profile) point.v = (profile[0].y - point.y) / total;

    const vertex = (point: ProfilePoint, angle: number, u: number) => {
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const horizontal = Math.sqrt(Math.max(0, 1 - point.normalY * point.normalY));
      return {
        position: [point.radius * cos, point.y, point.radius * sin],
        normal: [horizontal * cos, point.normalY, horizontal * sin],
        uv: [u, point.v],
      };
    };

    const push = (item: { position: number[]; normal: number[]; uv: number[] }) => {
      positions.push(...item.position);
      normals.push(...item.normal);
      uvs.push(...item.uv);
    };

    for (let row = 0; row < profile.length - 1; row += 1) {
      const upper = profile[row];
      const lower = profile[row + 1];
      for (let column = 0; column < segments; column += 1) {
        const u0 = column / segments;
        const u1 = (column + 1) / segments;
        const a0 = u0 * Math.PI * 2;
        const a1 = u1 * Math.PI * 2;

        const upperLeft = vertex(upper, a0, u0);
        const upperRight = vertex(upper, a1, u1);
        const lowerLeft = vertex(lower, a0, u0);
        const lowerRight = vertex(lower, a1, u1);

        // Counter-clockwise when viewed from outside, matching frontFace(CCW).
        // At a pole one edge of the quad collapses, so emit only the triangle
        // that still has area. cos(PI/2) evaluates to ~6e-17 rather than 0, so
        // compare against an epsilon scaled to the primitive.
        if (upper.radius > epsilon) {
          push(upperLeft);
          push(upperRight);
          push(lowerLeft);
        }
        if (lower.radius > epsilon) {
          push(upperRight);
          push(lowerRight);
          push(lowerLeft);
        }
      }
    }

    super(positions, normals, uvs);
  }
}
