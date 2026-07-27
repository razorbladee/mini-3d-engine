import { Vector3 } from '../math/Vector3';
export class SphereBounds {
  constructor(
    public center = new Vector3(),
    public radius = 0,
  ) {}
  contains(point: Vector3) {
    return this.center.clone().sub(point).length() <= this.radius;
  }
}
export class AabbBounds {
  constructor(
    public min = new Vector3(Infinity, Infinity, Infinity),
    public max = new Vector3(-Infinity, -Infinity, -Infinity),
  ) {}
  expand(point: Vector3) {
    this.min.x = Math.min(this.min.x, point.x);
    this.min.y = Math.min(this.min.y, point.y);
    this.min.z = Math.min(this.min.z, point.z);
    this.max.x = Math.max(this.max.x, point.x);
    this.max.y = Math.max(this.max.y, point.y);
    this.max.z = Math.max(this.max.z, point.z);
    return this;
  }
  contains(point: Vector3) {
    return (
      point.x >= this.min.x &&
      point.x <= this.max.x &&
      point.y >= this.min.y &&
      point.y <= this.max.y &&
      point.z >= this.min.z &&
      point.z <= this.max.z
    );
  }
}
