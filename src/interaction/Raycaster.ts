import { Camera } from '../cameras/Camera';
import { OrthographicCamera } from '../cameras/OrthographicCamera';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera';
import { Vector3 } from '../math/Vector3';
import { Mesh } from '../objects/Mesh';

export type Intersection = { object: Mesh; distance: number; point: Vector3 };

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
    let localDirection: Vector3;

    if (camera instanceof PerspectiveCamera) {
      const tangent = Math.tan(camera.fov * Math.PI / 360);
      localDirection = new Vector3(ndc.x * tangent * camera.aspect, ndc.y * tangent, -1).normalize();
    } else if (camera instanceof OrthographicCamera) {
      const localX = camera.left + (ndc.x + 1) * (camera.right - camera.left) / 2;
      const localY = camera.bottom + (ndc.y + 1) * (camera.top - camera.bottom) / 2;
      this.origin.x += world[0] * localX + world[4] * localY;
      this.origin.y += world[1] * localX + world[5] * localY;
      this.origin.z += world[2] * localX + world[6] * localY;
      localDirection = new Vector3(0, 0, -1);
    } else {
      localDirection = new Vector3(0, 0, -1);
    }

    this.direction.set(
      world[0] * localDirection.x + world[4] * localDirection.y + world[8] * localDirection.z,
      world[1] * localDirection.x + world[5] * localDirection.y + world[9] * localDirection.z,
      world[2] * localDirection.x + world[6] * localDirection.y + world[10] * localDirection.z,
    ).normalize();
    return this;
  }

  intersectObjects(objects: Mesh[]) {
    const intersections: Intersection[] = [];
    for (const object of objects) {
      if (!object.visible) continue;
      object.updateWorldMatrix(object.parent?.worldMatrix);
      const matrix = object.worldMatrix.elements;
      const center = new Vector3(matrix[12], matrix[13], matrix[14]);
      const scale = Math.max(
        Math.hypot(matrix[0], matrix[1], matrix[2]),
        Math.hypot(matrix[4], matrix[5], matrix[6]),
        Math.hypot(matrix[8], matrix[9], matrix[10]),
      );
      const radius = object.geometry.boundingRadius * scale;
      const toCenter = center.clone().sub(this.origin);
      const projected = toCenter.x * this.direction.x + toCenter.y * this.direction.y + toCenter.z * this.direction.z;
      const closestSquared = toCenter.x ** 2 + toCenter.y ** 2 + toCenter.z ** 2 - projected ** 2;
      const radiusSquared = radius ** 2;
      if (closestSquared > radiusSquared) continue;
      const offset = Math.sqrt(Math.max(0, radiusSquared - closestSquared));
      const near = projected - offset;
      const far = projected + offset;
      const distance = near >= 0 ? near : far;
      if (distance < 0) continue;
      intersections.push({
        object,
        distance,
        point: this.origin.clone().add(this.direction.clone().multiplyScalar(distance)),
      });
    }
    return intersections.sort((a, b) => a.distance - b.distance);
  }
}
