import { Node } from '../core/Node';
import { BufferGeometry } from '../geometry/BufferGeometry';
import { BasicMaterial } from '../materials/BasicMaterial';

/**
 * Geometry plus material in the scene graph.
 *
 * The old `render(gl, camera)` and `dispose(gl)` methods were dead weight: the
 * body was `void gl; void camera`, and GPU lifetime now belongs to the
 * renderer's ResourceCache (AUDIT-TZ P1-6, P2-2).
 */
export class Mesh extends Node {
  constructor(
    public geometry: BufferGeometry,
    public material: BasicMaterial,
  ) {
    super();
  }
}
