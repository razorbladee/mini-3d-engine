import { Node } from '../core/Node';
import { Matrix4 } from '../math/Matrix4';

export abstract class Camera extends Node {
  readonly projectionMatrix = new Float32Array(16);
  viewMatrix = new Matrix4();

  abstract updateProjectionMatrix(): void;

  updateViewMatrix() {
    this.updateWorldMatrix(this.parent?.worldMatrix);
    this.viewMatrix = this.worldMatrix.clone().invert();
    return this.viewMatrix;
  }
}
