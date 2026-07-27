import { Euler } from './Euler';
import { Quaternion } from './Quaternion';
import { Vector3 } from './Vector3';

/** Rotation supplied to {@link Matrix4.compose}. */
export type Rotation = Euler | Quaternion;

const scratchQuaternion = new Quaternion();
/** Shared accumulator for multiplyMatrices; avoids a per-call allocation. */
const multiplyScratch = new Float32Array(16);

/**
 * Column-major 4x4 matrix, matching the layout WebGL expects.
 *
 * `elements` is allocated once and mutated in place. Earlier revisions replaced
 * the backing Float32Array inside multiply()/invert(), which silently broke any
 * external reference to the buffer and allocated per frame (AUDIT-TZ P2-5).
 */
export class Matrix4 {
  readonly elements = new Float32Array(16);

  constructor() {
    this.identity();
  }

  identity() {
    const e = this.elements;
    e.fill(0);
    e[0] = e[5] = e[10] = e[15] = 1;
    return this;
  }

  copy(matrix: Matrix4) {
    this.elements.set(matrix.elements);
    return this;
  }

  clone() {
    return new Matrix4().copy(this);
  }

  /** `this = this * matrix`. */
  multiply(matrix: Matrix4) {
    return this.multiplyMatrices(this, matrix);
  }

  /** `this = matrix * this`. */
  premultiply(matrix: Matrix4) {
    return this.multiplyMatrices(matrix, this);
  }

  /** `this = a * b`. Safe when `this` aliases either operand. */
  multiplyMatrices(a: Matrix4, b: Matrix4) {
    const ae = a.elements;
    const be = b.elements;
    // Accumulate into a module scratch buffer: writing straight into `this`
    // would corrupt later columns whenever `this` aliases `a` or `b`.
    const out = multiplyScratch;

    for (let column = 0; column < 4; column += 1) {
      const b0 = be[column * 4];
      const b1 = be[column * 4 + 1];
      const b2 = be[column * 4 + 2];
      const b3 = be[column * 4 + 3];
      out[column * 4] = ae[0] * b0 + ae[4] * b1 + ae[8] * b2 + ae[12] * b3;
      out[column * 4 + 1] = ae[1] * b0 + ae[5] * b1 + ae[9] * b2 + ae[13] * b3;
      out[column * 4 + 2] = ae[2] * b0 + ae[6] * b1 + ae[10] * b2 + ae[14] * b3;
      out[column * 4 + 3] = ae[3] * b0 + ae[7] * b1 + ae[11] * b2 + ae[15] * b3;
    }

    this.elements.set(out);
    return this;
  }

  /**
   * Builds a TRS matrix. Rotation may be a Quaternion, or an Euler whose
   * `order` is honoured - previously every Euler was applied as XYZ regardless
   * of its declared order (AUDIT-TZ P1-2).
   */
  compose(position: Vector3, scale: Vector3, rotation: Rotation = scratchQuaternion.identity()) {
    const quaternion = rotation instanceof Quaternion ? rotation : scratchQuaternion.setFromEuler(rotation);
    const { x, y, z, w } = quaternion;

    const x2 = x + x;
    const y2 = y + y;
    const z2 = z + z;
    const xx = x * x2;
    const xy = x * y2;
    const xz = x * z2;
    const yy = y * y2;
    const yz = y * z2;
    const zz = z * z2;
    const wx = w * x2;
    const wy = w * y2;
    const wz = w * z2;

    const e = this.elements;
    e[0] = (1 - (yy + zz)) * scale.x;
    e[1] = (xy + wz) * scale.x;
    e[2] = (xz - wy) * scale.x;
    e[3] = 0;
    e[4] = (xy - wz) * scale.y;
    e[5] = (1 - (xx + zz)) * scale.y;
    e[6] = (yz + wx) * scale.y;
    e[7] = 0;
    e[8] = (xz + wy) * scale.z;
    e[9] = (yz - wx) * scale.z;
    e[10] = (1 - (xx + yy)) * scale.z;
    e[11] = 0;
    e[12] = position.x;
    e[13] = position.y;
    e[14] = position.z;
    e[15] = 1;
    return this;
  }

  /** Right-handed look-at, orienting -Z towards `target`. */
  lookAt(eye: Vector3, target: Vector3, up: Vector3 = new Vector3(0, 1, 0)) {
    let zx = eye.x - target.x;
    let zy = eye.y - target.y;
    let zz = eye.z - target.z;
    let length = Math.hypot(zx, zy, zz);
    if (!length) {
      zx = 0;
      zy = 0;
      zz = 1;
    } else {
      zx /= length;
      zy /= length;
      zz /= length;
    }

    let xx = up.y * zz - up.z * zy;
    let xy = up.z * zx - up.x * zz;
    let xz = up.x * zy - up.y * zx;
    length = Math.hypot(xx, xy, xz);
    if (!length) {
      // up is parallel to the view direction; nudge it to recover a basis.
      xx = Math.abs(zy) < 0.9 ? zz : 1;
      xy = 0;
      xz = Math.abs(zy) < 0.9 ? -zx : 0;
      length = Math.hypot(xx, xy, xz) || 1;
    }
    xx /= length;
    xy /= length;
    xz /= length;

    const yx = zy * xz - zz * xy;
    const yy = zz * xx - zx * xz;
    const yz = zx * xy - zy * xx;

    const e = this.elements;
    e[0] = xx;
    e[1] = xy;
    e[2] = xz;
    e[3] = 0;
    e[4] = yx;
    e[5] = yy;
    e[6] = yz;
    e[7] = 0;
    e[8] = zx;
    e[9] = zy;
    e[10] = zz;
    e[11] = 0;
    e[12] = eye.x;
    e[13] = eye.y;
    e[14] = eye.z;
    e[15] = 1;
    return this;
  }

  invert() {
    const m = this.elements;
    const b00 = m[0] * m[5] - m[1] * m[4];
    const b01 = m[0] * m[6] - m[2] * m[4];
    const b02 = m[0] * m[7] - m[3] * m[4];
    const b03 = m[1] * m[6] - m[2] * m[5];
    const b04 = m[1] * m[7] - m[3] * m[5];
    const b05 = m[2] * m[7] - m[3] * m[6];
    const b06 = m[8] * m[13] - m[9] * m[12];
    const b07 = m[8] * m[14] - m[10] * m[12];
    const b08 = m[8] * m[15] - m[11] * m[12];
    const b09 = m[9] * m[14] - m[10] * m[13];
    const b10 = m[9] * m[15] - m[11] * m[13];
    const b11 = m[10] * m[15] - m[11] * m[14];

    let determinant = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
    if (!determinant) throw new Error('Matrix4 is not invertible');
    determinant = 1 / determinant;

    const m0 = m[0];
    const m1 = m[1];
    const m2 = m[2];
    const m3 = m[3];
    const m4 = m[4];
    const m5 = m[5];
    const m6 = m[6];
    const m7 = m[7];
    const m8 = m[8];
    const m9 = m[9];
    const m10 = m[10];
    const m11 = m[11];
    const m12 = m[12];
    const m13 = m[13];
    const m14 = m[14];
    const m15 = m[15];

    m[0] = (m5 * b11 - m6 * b10 + m7 * b09) * determinant;
    m[1] = (m2 * b10 - m1 * b11 - m3 * b09) * determinant;
    m[2] = (m13 * b05 - m14 * b04 + m15 * b03) * determinant;
    m[3] = (m10 * b04 - m9 * b05 - m11 * b03) * determinant;
    m[4] = (m6 * b08 - m4 * b11 - m7 * b07) * determinant;
    m[5] = (m0 * b11 - m2 * b08 + m3 * b07) * determinant;
    m[6] = (m14 * b02 - m12 * b05 - m15 * b01) * determinant;
    m[7] = (m8 * b05 - m10 * b02 + m11 * b01) * determinant;
    m[8] = (m4 * b10 - m5 * b08 + m7 * b06) * determinant;
    m[9] = (m1 * b08 - m0 * b10 - m3 * b06) * determinant;
    m[10] = (m12 * b04 - m13 * b02 + m15 * b00) * determinant;
    m[11] = (m9 * b02 - m8 * b04 - m11 * b00) * determinant;
    m[12] = (m5 * b07 - m4 * b09 - m6 * b06) * determinant;
    m[13] = (m0 * b09 - m1 * b07 + m2 * b06) * determinant;
    m[14] = (m13 * b01 - m12 * b03 - m14 * b00) * determinant;
    m[15] = (m8 * b03 - m9 * b01 + m10 * b00) * determinant;
    return this;
  }
}
