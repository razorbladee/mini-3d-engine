import { Node } from '../core/Node';
import { BufferGeometry } from '../geometry/BufferGeometry';
import { BasicMaterial } from '../materials/BasicMaterial';
import { Camera } from '../cameras/Camera';
export class Mesh extends Node {
  constructor(
    public geometry: BufferGeometry,
    public material: BasicMaterial,
  ) {
    super();
  }
  render(gl: WebGL2RenderingContext, camera: Camera) {
    void gl;
    void camera;
  }
  dispose(gl: WebGL2RenderingContext) {
    this.geometry.dispose(gl);
  }
}
