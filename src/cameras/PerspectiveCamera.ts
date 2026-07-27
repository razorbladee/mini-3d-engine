import { Camera } from './Camera';
export class PerspectiveCamera extends Camera {
  constructor(
    public fov = 60,
    public aspect = 1,
    public near = 0.1,
    public far = 1000,
  ) {
    super();
    this.updateProjectionMatrix();
  }
  /** Matches the projection to a new viewport by updating the aspect ratio. */
  setViewportSize(width: number, height: number) {
    this.aspect = width / Math.max(height, 1);
    this.updateProjectionMatrix();
    return this;
  }

  updateProjectionMatrix() {
    const f = 1 / Math.tan((this.fov * Math.PI) / 360),
      nf = 1 / (this.near - this.far),
      e = this.projectionMatrix;
    e.fill(0);
    e[0] = f / this.aspect;
    e[5] = f;
    e[10] = (this.far + this.near) * nf;
    e[11] = -1;
    e[14] = 2 * this.far * this.near * nf;
  }
}
