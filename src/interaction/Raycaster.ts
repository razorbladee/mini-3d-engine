import { Camera } from '../cameras/Camera';
import { OrthographicCamera } from '../cameras/OrthographicCamera';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera';
import { Matrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';
import { Mesh } from '../objects/Mesh';

export type Intersection = {
  object: Mesh;
  distance: number;
  point: Vector3;
  /** Geometric normal of the hit triangle, in world space. */
  normal: Vector3;
  /** Index of the hit triangle within the geometry. */
  triangleIndex: number;
};

export type RaycastOptions = {
  /**
   * Stop after the bounding-sphere test instead of intersecting triangles.
   * Faster, but reports hits anywhere inside the sphere.
   */
  boundsOnly?: boolean;
};

const inverseScratch = new Matrix4();
const localOrigin = new Vector3();
const localDirection = new Vector3();

export class Raycaster {
  origin = new Vector3();
  direction = new Vector3(0, 0, -1);

  set(origin: Vector3, direction: Vector3) {
    this.origin.copy(origin);
    this.direction.copy(direction).normalize();
    return this;
  }

  setFromCamera(ndc: { x: number; y: number }, camera: Camera) {
    camera.updateViewMatrix();
    const world = camera.worldMatrix.elements;
    this.origin.set(world[12], world[13], world[14]);
    let direction: Vector3;

    if (camera instanceof PerspectiveCamera) {
      const tangent = Math.tan((camera.fov * Math.PI) / 360);
      direction = new Vector3(ndc.x * tangent * camera.aspect, ndc.y * tangent, -1).normalize();
    } else if (camera instanceof OrthographicCamera) {
      const localX = camera.left + ((ndc.x + 1) * (camera.right - camera.left)) / 2;
      const localY = camera.bottom + ((ndc.y + 1) * (camera.top - camera.bottom)) / 2;
      this.origin.x += world[0] * localX + world[4] * localY;
      this.origin.y += world[1] * localX + world[5] * localY;
      this.origin.z += world[2] * localX + world[6] * localY;
      direction = new Vector3(0, 0, -1);
    } else {
      direction = new Vector3(0, 0, -1);
    }

    this.direction
      .set(
        world[0] * direction.x + world[4] * direction.y + world[8] * direction.z,
        world[1] * direction.x + world[5] * direction.y + world[9] * direction.z,
        world[2] * direction.x + world[6] * direction.y + world[10] * direction.z,
      )
      .normalize();
    return this;
  }

  /** Broad-phase distance to a mesh bounding sphere, or null when missed. */
  private intersectBoundingSphere(object: Mesh) {
    const matrix = object.worldMatrix.elements;
    const center = new Vector3(matrix[12], matrix[13], matrix[14]);
    const scale = Math.max(
      Math.hypot(matrix[0], matrix[1], matrix[2]),
      Math.hypot(matrix[4], matrix[5], matrix[6]),
      Math.hypot(matrix[8], matrix[9], matrix[10]),
    );
    const radius = object.geometry.boundingRadius * scale;
    const toCenter = center.sub(this.origin);
    const projected = toCenter.dot(this.direction);
    const closestSquared = toCenter.lengthSquared() - projected * projected;
    const radiusSquared = radius * radius;
    if (closestSquared > radiusSquared) return null;

    const offset = Math.sqrt(Math.max(0, radiusSquared - closestSquared));
    const near = projected - offset;
    const far = projected + offset;
    const distance = near >= 0 ? near : far;
    return distance < 0 ? null : distance;
  }

  /**
   * Narrow phase: Moller-Trumbore against every triangle, in object space.
   *
   * The old implementation reported bounding-sphere hits as if they were real
   * intersections, so clicking the empty corner of a cube's sphere "hit" it and
   * the reported point was not on the surface (AUDIT-TZ P2-7).
   */
  private intersectTriangles(object: Mesh): Intersection | null {
    inverseScratch.copy(object.worldMatrix);
    try {
      inverseScratch.invert();
    } catch {
      return null; // Degenerate transform, nothing sensible to intersect.
    }

    localOrigin.copy(this.origin).applyMatrix4(inverseScratch);
    const e = inverseScratch.elements;
    localDirection
      .set(
        e[0] * this.direction.x + e[4] * this.direction.y + e[8] * this.direction.z,
        e[1] * this.direction.x + e[5] * this.direction.y + e[9] * this.direction.z,
        e[2] * this.direction.x + e[6] * this.direction.y + e[10] * this.direction.z,
      )
      .normalize();

    const positions = object.geometry.positions;
    let best: { distance: number; index: number } | null = null;

    for (let i = 0; i < positions.length; i += 9) {
      const e1x = positions[i + 3] - positions[i];
      const e1y = positions[i + 4] - positions[i + 1];
      const e1z = positions[i + 5] - positions[i + 2];
      const e2x = positions[i + 6] - positions[i];
      const e2y = positions[i + 7] - positions[i + 1];
      const e2z = positions[i + 8] - positions[i + 2];

      const px = localDirection.y * e2z - localDirection.z * e2y;
      const py = localDirection.z * e2x - localDirection.x * e2z;
      const pz = localDirection.x * e2y - localDirection.y * e2x;
      const determinant = e1x * px + e1y * py + e1z * pz;
      if (Math.abs(determinant) < 1e-12) continue;

      const inverseDeterminant = 1 / determinant;
      const tx = localOrigin.x - positions[i];
      const ty = localOrigin.y - positions[i + 1];
      const tz = localOrigin.z - positions[i + 2];

      const u = (tx * px + ty * py + tz * pz) * inverseDeterminant;
      if (u < 0 || u > 1) continue;

      const qx = ty * e1z - tz * e1y;
      const qy = tz * e1x - tx * e1z;
      const qz = tx * e1y - ty * e1x;
      const v = (localDirection.x * qx + localDirection.y * qy + localDirection.z * qz) * inverseDeterminant;
      if (v < 0 || u + v > 1) continue;

      const distance = (e2x * qx + e2y * qy + e2z * qz) * inverseDeterminant;
      if (distance <= 1e-6) continue;
      if (!best || distance < best.distance) best = { distance, index: i };
    }

    if (!best) return null;

    const localPoint = localDirection.clone().multiplyScalar(best.distance).add(localOrigin);
    const point = localPoint.applyMatrix4(object.worldMatrix);
    const i = best.index;
    const normal = new Vector3(
      positions[i + 3] - positions[i],
      positions[i + 4] - positions[i + 1],
      positions[i + 5] - positions[i + 2],
    )
      .cross(
        new Vector3(
          positions[i + 6] - positions[i],
          positions[i + 7] - positions[i + 1],
          positions[i + 8] - positions[i + 2],
        ),
      )
      .transformDirection(object.worldMatrix);

    return {
      object,
      distance: point.distanceTo(this.origin),
      point,
      normal,
      triangleIndex: i / 9,
    };
  }

  intersectObjects(objects: Mesh[], options: RaycastOptions = {}) {
    const intersections: Intersection[] = [];
    for (const object of objects) {
      if (!object.visible) continue;
      object.updateWorldMatrix(object.parent?.worldMatrix);

      const boundsDistance = this.intersectBoundingSphere(object);
      if (boundsDistance === null) continue;

      if (options.boundsOnly) {
        intersections.push({
          object,
          distance: boundsDistance,
          point: this.direction.clone().multiplyScalar(boundsDistance).add(this.origin),
          normal: this.direction.clone().negate(),
          triangleIndex: -1,
        });
        continue;
      }

      const hit = this.intersectTriangles(object);
      if (hit) intersections.push(hit);
    }
    return intersections.sort((a, b) => a.distance - b.distance);
  }
}
