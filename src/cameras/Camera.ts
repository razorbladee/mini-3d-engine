import {Node} from '../core/Node';

export abstract class Camera extends Node {
  readonly projectionMatrix = new Float32Array(16);
  abstract updateProjectionMatrix(): void;
}
