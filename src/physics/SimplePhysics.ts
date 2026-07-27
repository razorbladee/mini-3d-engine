import { Node } from '../core/Node';
import { Vector3 } from '../math/Vector3';
import type { PhysicsAdapter, PhysicsBody } from './PhysicsAdapter';

/**
 * Minimal gravity integrator with a floor at y = 0.
 *
 * Now actually declares `implements PhysicsAdapter`: the interface existed but
 * nothing conformed to it, addBody returned `this` instead of a PhysicsBody and
 * dispose() was missing, so the boundary guaranteed nothing (AUDIT-TZ P2-3).
 *
 * Not a physics engine: no body-body collisions, friction, rotation dynamics
 * or CCD.
 */
export class SimplePhysics implements PhysicsAdapter {
  gravity = new Vector3(0, -9.81, 0);
  /** Floor height; bodies come to rest here. */
  floor = 0;
  private readonly bodies = new Map<Node, PhysicsBody>();

  addBody(node: Node, velocity = new Vector3()): PhysicsBody {
    const existing = this.bodies.get(node);
    if (existing) {
      existing.velocity.copy(velocity);
      return existing;
    }
    const body: PhysicsBody = { node, velocity };
    this.bodies.set(node, body);
    return body;
  }

  removeBody(node: Node) {
    this.bodies.delete(node);
  }

  getBody(node: Node) {
    return this.bodies.get(node);
  }

  get bodyCount() {
    return this.bodies.size;
  }

  step(deltaTime: number) {
    if (deltaTime <= 0) return;
    for (const { node, velocity } of this.bodies.values()) {
      // addScaledVector avoids the clone().multiplyScalar() temporaries this
      // loop used to allocate per body per step (AUDIT-TZ P2-5).
      velocity.addScaledVector(this.gravity, deltaTime);
      node.position.addScaledVector(velocity, deltaTime);
      if (node.position.y < this.floor) {
        node.position.y = this.floor;
        velocity.y = 0;
      }
    }
  }

  dispose() {
    this.bodies.clear();
  }
}
