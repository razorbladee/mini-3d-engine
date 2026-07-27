import { Camera } from './Camera';

export class OrthographicCamera extends Camera {
  constructor(
    public left = -1,
    public right = 1,
    public top = 1,
    public bottom = -1,
    public near = 0.1,
    public far = 1000,
  ) {
    super();
    this.updateProjectionMatrix();
  }

  updateProjectionMatrix() {
    const width = this.right - this.left;
    const height = this.top - this.bottom;
    const depth = this.far - this.near;
    if (!width || !height || !depth) throw new Error('OrthographicCamera bounds must define a non-zero volume');
    const e = this.projectionMatrix;
    e.fill(0);
    e[0] = 2 / width;
    e[5] = 2 / height;
    e[10] = -2 / depth;
    e[12] = -(this.right + this.left) / width;
    e[13] = -(this.top + this.bottom) / height;
    e[14] = -(this.far + this.near) / depth;
    e[15] = 1;
  }
}
