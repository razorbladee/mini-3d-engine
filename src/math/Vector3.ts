import type { Matrix4 } from './Matrix4';

export class Vector3 {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
  ) {}

  set(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  setScalar(value: number) {
    return this.set(value, value, value);
  }

  clone() {
    return new Vector3(this.x, this.y, this.z);
  }

  copy(v: Vector3) {
    return this.set(v.x, v.y, v.z);
  }

  add(v: Vector3) {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  /** Fused multiply-add, avoids a temporary in integration loops. */
  addScaledVector(v: Vector3, scale: number) {
    this.x += v.x * scale;
    this.y += v.y * scale;
    this.z += v.z * scale;
    return this;
  }

  sub(v: Vector3) {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  multiplyScalar(s: number) {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }

  dot(v: Vector3) {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  cross(v: Vector3) {
    const { x, y, z } = this;
    return this.set(y * v.z - z * v.y, z * v.x - x * v.z, x * v.y - y * v.x);
  }

  lerp(target: Vector3, alpha: number) {
    this.x += (target.x - this.x) * alpha;
    this.y += (target.y - this.y) * alpha;
    this.z += (target.z - this.z) * alpha;
    return this;
  }

  lengthSquared() {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  length() {
    return Math.hypot(this.x, this.y, this.z);
  }

  distanceTo(v: Vector3) {
    return Math.hypot(this.x - v.x, this.y - v.y, this.z - v.z);
  }

  normalize() {
    return this.multiplyScalar(1 / (this.length() || 1));
  }

  negate() {
    return this.set(-this.x, -this.y, -this.z);
  }

  equals(v: Vector3) {
    return this.x === v.x && this.y === v.y && this.z === v.z;
  }

  /** Transforms this point by a column-major matrix, including translation. */
  applyMatrix4(matrix: Matrix4) {
    const e = matrix.elements;
    const { x, y, z } = this;
    const w = e[3] * x + e[7] * y + e[11] * z + e[15] || 1;
    return this.set(
      (e[0] * x + e[4] * y + e[8] * z + e[12]) / w,
      (e[1] * x + e[5] * y + e[9] * z + e[13]) / w,
      (e[2] * x + e[6] * y + e[10] * z + e[14]) / w,
    );
  }

  /** Transforms this vector as a direction, ignoring translation. */
  transformDirection(matrix: Matrix4) {
    const e = matrix.elements;
    const { x, y, z } = this;
    return this.set(
      e[0] * x + e[4] * y + e[8] * z,
      e[1] * x + e[5] * y + e[9] * z,
      e[2] * x + e[6] * y + e[10] * z,
    ).normalize();
  }

  toArray(): [number, number, number] {
    return [this.x, this.y, this.z];
  }
}
