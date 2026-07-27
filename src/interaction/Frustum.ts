import { Camera } from '../cameras/Camera';
import { Matrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';
import { SphereBounds } from './Bounds';

/** A plane as ax + by + cz + d >= 0 for points on the inside. */
type Plane = [number, number, number, number];

const clipScratch = new Matrix4();
const projectionScratch = new Matrix4();

/**
 * View frustum for visibility tests.
 *
 * The previous implementation assigned fixed normals ([-1,0,0], [1,0,0], ...)
 * and only took the distance from the matrix, which is not the Gribb-Hartmann
 * extraction: the normals must come from the rows of the clip matrix. It also
 * composed P * V with transposed indices. The net effect was that
 * intersectsPoint never returned true, so any culling built on it would have
 * hidden the whole scene (AUDIT-TZ P1-4).
 */
export class Frustum {
  private planes: Plane[] = [];

  setFromCamera(camera: Camera) {
    projectionScratch.elements.set(camera.projectionMatrix);
    // clip = projection * view, column-major.
    clipScratch.multiplyMatrices(projectionScratch, camera.viewMatrix);
    return this.setFromMatrix(clipScratch);
  }

  /** Extracts the six planes from a view-projection matrix. */
  setFromMatrix(matrix: Matrix4) {
    const m = matrix.elements;
    // Column-major storage: m[column * 4 + row], so row i of the matrix is
    // (m[i], m[4+i], m[8+i], m[12+i]).
    const row = (i: number) => [m[i], m[4 + i], m[8 + i], m[12 + i]] as const;
    const [x0, x1, x2, x3] = row(0);
    const [y0, y1, y2, y3] = row(1);
    const [z0, z1, z2, z3] = row(2);
    const [w0, w1, w2, w3] = row(3);

    this.planes = [
      [w0 + x0, w1 + x1, w2 + x2, w3 + x3], // left
      [w0 - x0, w1 - x1, w2 - x2, w3 - x3], // right
      [w0 + y0, w1 + y1, w2 + y2, w3 + y3], // bottom
      [w0 - y0, w1 - y1, w2 - y2, w3 - y3], // top
      [w0 + z0, w1 + z1, w2 + z2, w3 + z3], // near
      [w0 - z0, w1 - z1, w2 - z2, w3 - z3], // far
    ].map((plane) => {
      const length = Math.hypot(plane[0], plane[1], plane[2]) || 1;
      return [plane[0] / length, plane[1] / length, plane[2] / length, plane[3] / length] as Plane;
    });
    return this;
  }

  /** Signed distance from a point to a plane; negative means outside. */
  private distanceToPlane(plane: Plane, x: number, y: number, z: number) {
    return plane[0] * x + plane[1] * y + plane[2] * z + plane[3];
  }

  intersectsPoint(point: Vector3) {
    return this.planes.every((plane) => this.distanceToPlane(plane, point.x, point.y, point.z) >= 0);
  }

  intersectsSphere(bounds: SphereBounds) {
    const { center, radius } = bounds;
    return this.planes.every((plane) => this.distanceToPlane(plane, center.x, center.y, center.z) >= -radius);
  }

  /** The six normalized planes, mainly for debugging and tests. */
  getPlanes(): readonly Plane[] {
    return this.planes;
  }
}
