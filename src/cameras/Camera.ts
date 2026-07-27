import { Node } from '../core/Node';
import { Matrix4 } from '../math/Matrix4';
import { Vector3 } from '../math/Vector3';

const lookAtMatrix = new Matrix4();

export abstract class Camera extends Node {
  readonly projectionMatrix = new Float32Array(16);
  readonly viewMatrix = new Matrix4();

  abstract updateProjectionMatrix(): void;

  /** Adapts the projection to a new viewport. Overridden per projection type. */
  setViewportSize(_width: number, _height: number) {
    this.updateProjectionMatrix();
    return this;
  }

  /**
   * Orients the camera so that its -Z axis points at `target`.
   *
   * Required by MVP-SPEC 4.6 and previously missing, which forced OrbitControls
   * to hand-roll Euler angles in an order compose() did not honour (P1-2).
   */
  lookAt(target: Vector3, up: Vector3 = new Vector3(0, 1, 0)) {
    lookAtMatrix.lookAt(this.position, target, up);
    const e = lookAtMatrix.elements;

    // Extract the quaternion from the orthonormal basis of the look-at frame.
    const trace = e[0] + e[5] + e[10];
    if (trace > 0) {
      const s = 0.5 / Math.sqrt(trace + 1);
      this.quaternion.set((e[6] - e[9]) * s, (e[8] - e[2]) * s, (e[1] - e[4]) * s, 0.25 / s);
    } else if (e[0] > e[5] && e[0] > e[10]) {
      const s = 2 * Math.sqrt(1 + e[0] - e[5] - e[10]);
      this.quaternion.set(0.25 * s, (e[4] + e[1]) / s, (e[8] + e[2]) / s, (e[6] - e[9]) / s);
    } else if (e[5] > e[10]) {
      const s = 2 * Math.sqrt(1 + e[5] - e[0] - e[10]);
      this.quaternion.set((e[4] + e[1]) / s, 0.25 * s, (e[9] + e[6]) / s, (e[8] - e[2]) / s);
    } else {
      const s = 2 * Math.sqrt(1 + e[10] - e[0] - e[5]);
      this.quaternion.set((e[8] + e[2]) / s, (e[9] + e[6]) / s, 0.25 * s, (e[1] - e[4]) / s);
    }
    this.quaternion.normalize();
    return this.useQuaternion();
  }

  updateViewMatrix() {
    this.updateWorldMatrix(this.parent?.worldMatrix);
    this.viewMatrix.copy(this.worldMatrix).invert();
    return this.viewMatrix;
  }
}
