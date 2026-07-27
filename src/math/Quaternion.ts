import { Euler, type EulerOrder } from './Euler';
import { Vector3 } from './Vector3';

/**
 * Unit quaternion, the lossless rotation representation.
 *
 * GLTFLoader previously converted incoming quaternions into Euler angles with a
 * ZYX formula and stored them in an Euler that compose() applied as XYZ, which
 * rotated most glTF nodes incorrectly (AUDIT-TZ P1-5). Nodes now carry a
 * quaternion directly so no conversion is needed on the import path.
 */
export class Quaternion {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
    public w = 1,
  ) {}

  set(x: number, y: number, z: number, w: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  copy(quaternion: Quaternion) {
    return this.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
  }

  clone() {
    return new Quaternion(this.x, this.y, this.z, this.w);
  }

  identity() {
    return this.set(0, 0, 0, 1);
  }

  length() {
    return Math.hypot(this.x, this.y, this.z, this.w);
  }

  normalize() {
    const length = this.length();
    if (!length) return this.identity();
    return this.set(this.x / length, this.y / length, this.z / length, this.w / length);
  }

  /** Hamilton product: applies `quaternion` first, then `this`. */
  multiply(quaternion: Quaternion) {
    const { x: ax, y: ay, z: az, w: aw } = this;
    const { x: bx, y: by, z: bz, w: bw } = quaternion;
    return this.set(
      aw * bx + ax * bw + ay * bz - az * by,
      aw * by - ax * bz + ay * bw + az * bx,
      aw * bz + ax * by - ay * bx + az * bw,
      aw * bw - ax * bx - ay * by - az * bz,
    );
  }

  setFromAxisAngle(axis: Vector3, angle: number) {
    const normalized = axis.clone().normalize();
    const half = angle / 2;
    const sin = Math.sin(half);
    return this.set(normalized.x * sin, normalized.y * sin, normalized.z * sin, Math.cos(half));
  }

  setFromEuler(euler: Euler) {
    const cx = Math.cos(euler.x / 2);
    const sx = Math.sin(euler.x / 2);
    const cy = Math.cos(euler.y / 2);
    const sy = Math.sin(euler.y / 2);
    const cz = Math.cos(euler.z / 2);
    const sz = Math.sin(euler.z / 2);

    const axis: Record<EulerOrder, () => Quaternion> = {
      XYZ: () =>
        this.set(
          sx * cy * cz + cx * sy * sz,
          cx * sy * cz - sx * cy * sz,
          cx * cy * sz + sx * sy * cz,
          cx * cy * cz - sx * sy * sz,
        ),
      XZY: () =>
        this.set(
          sx * cy * cz - cx * sy * sz,
          cx * sy * cz - sx * cy * sz,
          cx * cy * sz + sx * sy * cz,
          cx * cy * cz + sx * sy * sz,
        ),
      YXZ: () =>
        this.set(
          sx * cy * cz + cx * sy * sz,
          cx * sy * cz - sx * cy * sz,
          cx * cy * sz - sx * sy * cz,
          cx * cy * cz + sx * sy * sz,
        ),
      YZX: () =>
        this.set(
          sx * cy * cz + cx * sy * sz,
          cx * sy * cz + sx * cy * sz,
          cx * cy * sz - sx * sy * cz,
          cx * cy * cz - sx * sy * sz,
        ),
      ZXY: () =>
        this.set(
          sx * cy * cz - cx * sy * sz,
          cx * sy * cz + sx * cy * sz,
          cx * cy * sz + sx * sy * cz,
          cx * cy * cz - sx * sy * sz,
        ),
      ZYX: () =>
        this.set(
          sx * cy * cz - cx * sy * sz,
          cx * sy * cz + sx * cy * sz,
          cx * cy * sz - sx * sy * cz,
          cx * cy * cz + sx * sy * sz,
        ),
    };
    return axis[euler.order]();
  }

  dot(quaternion: Quaternion) {
    return this.x * quaternion.x + this.y * quaternion.y + this.z * quaternion.z + this.w * quaternion.w;
  }

  /** Spherical linear interpolation towards `target`, `alpha` in [0, 1]. */
  slerp(target: Quaternion, alpha: number) {
    if (alpha <= 0) return this;
    if (alpha >= 1) return this.copy(target);

    let cosHalfTheta = this.dot(target);
    // Take the shorter arc.
    const sign = cosHalfTheta < 0 ? -1 : 1;
    cosHalfTheta *= sign;

    if (cosHalfTheta >= 1 - 1e-9) {
      return this.set(
        this.x + (target.x * sign - this.x) * alpha,
        this.y + (target.y * sign - this.y) * alpha,
        this.z + (target.z * sign - this.z) * alpha,
        this.w + (target.w * sign - this.w) * alpha,
      ).normalize();
    }

    const halfTheta = Math.acos(cosHalfTheta);
    const sinHalfTheta = Math.sin(halfTheta);
    const ratioA = Math.sin((1 - alpha) * halfTheta) / sinHalfTheta;
    const ratioB = Math.sin(alpha * halfTheta) / sinHalfTheta;

    return this.set(
      this.x * ratioA + target.x * sign * ratioB,
      this.y * ratioA + target.y * sign * ratioB,
      this.z * ratioA + target.z * sign * ratioB,
      this.w * ratioA + target.w * sign * ratioB,
    );
  }
}
