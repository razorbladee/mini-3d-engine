import { Euler } from './Euler';
import { Vector3 } from './Vector3';

export class Matrix4 {
  elements = new Float32Array(16);

  constructor() {
    this.identity();
  }

  identity() {
    const e = this.elements;
    e.fill(0);
    e[0] = e[5] = e[10] = e[15] = 1;
    return this;
  }

  multiply(matrix: Matrix4) {
    const a = this.elements;
    const b = matrix.elements;
    const result = new Float32Array(16);
    for (let column = 0; column < 4; column += 1) {
      for (let row = 0; row < 4; row += 1) {
        result[column * 4 + row] =
          a[row] * b[column * 4] +
          a[4 + row] * b[column * 4 + 1] +
          a[8 + row] * b[column * 4 + 2] +
          a[12 + row] * b[column * 4 + 3];
      }
    }
    this.elements = result;
    return this;
  }

  compose(position: Vector3, scale: Vector3, rotation = new Euler()) {
    const x = rotation.x,
      y = rotation.y,
      z = rotation.z;
    const a = Math.cos(x),
      b = Math.sin(x);
    const c = Math.cos(y),
      d = Math.sin(y);
    const e = Math.cos(z),
      f = Math.sin(z);
    const values = this.elements;

    values[0] = c * e * scale.x;
    values[1] = (a * f + b * e * d) * scale.x;
    values[2] = (b * f - a * e * d) * scale.x;
    values[3] = 0;
    values[4] = -c * f * scale.y;
    values[5] = (a * e - b * f * d) * scale.y;
    values[6] = (b * e + a * f * d) * scale.y;
    values[7] = 0;
    values[8] = d * scale.z;
    values[9] = -b * c * scale.z;
    values[10] = a * c * scale.z;
    values[11] = 0;
    values[12] = position.x;
    values[13] = position.y;
    values[14] = position.z;
    values[15] = 1;
    return this;
  }

  invert() {
    const m = this.elements;
    const out = new Float32Array(16);
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
    out[0] = (m[5] * b11 - m[6] * b10 + m[7] * b09) * determinant;
    out[1] = (m[2] * b10 - m[1] * b11 - m[3] * b09) * determinant;
    out[2] = (m[13] * b05 - m[14] * b04 + m[15] * b03) * determinant;
    out[3] = (m[10] * b04 - m[9] * b05 - m[11] * b03) * determinant;
    out[4] = (m[6] * b08 - m[4] * b11 - m[7] * b07) * determinant;
    out[5] = (m[0] * b11 - m[2] * b08 + m[3] * b07) * determinant;
    out[6] = (m[14] * b02 - m[12] * b05 - m[15] * b01) * determinant;
    out[7] = (m[8] * b05 - m[10] * b02 + m[11] * b01) * determinant;
    out[8] = (m[4] * b10 - m[5] * b08 + m[7] * b06) * determinant;
    out[9] = (m[1] * b08 - m[0] * b10 - m[3] * b06) * determinant;
    out[10] = (m[12] * b04 - m[13] * b02 + m[15] * b00) * determinant;
    out[11] = (m[9] * b02 - m[8] * b04 - m[11] * b00) * determinant;
    out[12] = (m[5] * b07 - m[4] * b09 - m[6] * b06) * determinant;
    out[13] = (m[0] * b09 - m[1] * b07 + m[2] * b06) * determinant;
    out[14] = (m[13] * b01 - m[12] * b03 - m[14] * b00) * determinant;
    out[15] = (m[8] * b03 - m[9] * b01 + m[10] * b00) * determinant;
    this.elements = out;
    return this;
  }

  clone() {
    const matrix = new Matrix4();
    matrix.elements.set(this.elements);
    return matrix;
  }
}
