import { Euler } from '../math/Euler';
import { Matrix4 } from '../math/Matrix4';
import { Quaternion } from '../math/Quaternion';
import { Vector3 } from '../math/Vector3';

/** Which of the two rotation representations last received a write. */
type RotationMode = 'euler' | 'quaternion';

export class Node {
  readonly position = new Vector3();
  readonly rotation = new Euler();
  readonly quaternion = new Quaternion();
  readonly scale = new Vector3(1, 1, 1);
  readonly localMatrix = new Matrix4();
  readonly worldMatrix = new Matrix4();
  parent: Node | null = null;
  children: Node[] = [];
  visible = true;
  name = '';
  matrixOverride: Float32Array | null = null;

  /**
   * MVP-SPEC 4.2 requires both rotation forms. Rather than keeping them
   * eagerly in sync, the node records which one was written last and composes
   * from that, so neither representation silently overrides the other.
   */
  private rotationMode: RotationMode = 'euler';

  /** Marks the quaternion as authoritative; call after writing to it directly. */
  useQuaternion() {
    this.rotationMode = 'quaternion';
    return this;
  }

  /** Marks the Euler angles as authoritative; call after writing to them directly. */
  useEuler() {
    this.rotationMode = 'euler';
    return this;
  }

  setRotationFromQuaternion(x: number, y: number, z: number, w: number) {
    this.quaternion.set(x, y, z, w);
    return this.useQuaternion();
  }

  add(...nodes: Node[]) {
    for (const node of nodes) {
      if (node === this || this.isDescendantOf(node)) throw new Error('Cannot create a cyclic scene graph');
      if (node.parent) node.parent.remove(node);
      node.parent = this;
      this.children.push(node);
    }
    return this;
  }

  remove(node: Node) {
    const index = this.children.indexOf(node);
    if (index >= 0) {
      this.children.splice(index, 1);
      node.parent = null;
    }
    return this;
  }

  /** Detaches every child. Required by MVP-SPEC 4.2. */
  clear() {
    for (const child of this.children) child.parent = null;
    this.children.length = 0;
    return this;
  }

  private isDescendantOf(node: Node) {
    let current: Node | null = this as Node;
    while (current) {
      if (current === node) return true;
      current = current.parent;
    }
    return false;
  }

  updateWorldMatrix(parentMatrix?: Matrix4) {
    if (this.matrixOverride) this.localMatrix.elements.set(this.matrixOverride);
    else if (this.rotationMode === 'quaternion') this.localMatrix.compose(this.position, this.scale, this.quaternion);
    else this.localMatrix.compose(this.position, this.scale, this.rotation);

    // In-place composition: cloning here allocated two Matrix4 per node per
    // frame and rebound worldMatrix, invalidating external references (P2-5).
    if (parentMatrix) this.worldMatrix.multiplyMatrices(parentMatrix, this.localMatrix);
    else this.worldMatrix.copy(this.localMatrix);

    for (const child of this.children) child.updateWorldMatrix(this.worldMatrix);
    return this;
  }

  traverse(callback: (node: Node) => void) {
    callback(this);
    for (const child of this.children) child.traverse(callback);
  }
}
