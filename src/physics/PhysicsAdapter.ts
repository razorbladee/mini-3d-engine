import { Node } from '../core/Node';
import { Vector3 } from '../math/Vector3';
export interface PhysicsBody {
  node: Node;
  velocity: Vector3;
}
export interface PhysicsAdapter {
  addBody(node: Node, velocity?: Vector3): PhysicsBody;
  removeBody(node: Node): void;
  step(deltaTime: number): void;
  dispose?(): void;
}
