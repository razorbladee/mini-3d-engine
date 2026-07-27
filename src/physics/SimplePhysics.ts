import { Node } from '../core/Node';
import { Vector3 } from '../math/Vector3';
export class SimplePhysics {
  gravity = new Vector3(0, -9.81, 0);
  private bodies = new Map<Node, Vector3>();
  addBody(node: Node, velocity = new Vector3()) {
    this.bodies.set(node, velocity);
    return this;
  }
  removeBody(node: Node) {
    this.bodies.delete(node);
    return this;
  }
  step(deltaTime: number) {
    for (const [node, velocity] of this.bodies) {
      velocity.add(this.gravity.clone().multiplyScalar(deltaTime));
      node.position.add(velocity.clone().multiplyScalar(deltaTime));
      if (node.position.y < 0) {
        node.position.y = 0;
        velocity.y = 0;
      }
    }
    return this;
  }
}
