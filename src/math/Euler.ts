/** Intrinsic rotation orders supported by {@link Matrix4.compose}. */
export type EulerOrder = 'XYZ' | 'XZY' | 'YXZ' | 'YZX' | 'ZXY' | 'ZYX';

export const EULER_ORDERS: readonly EulerOrder[] = ['XYZ', 'XZY', 'YXZ', 'YZX', 'ZXY', 'ZYX'];

export function isEulerOrder(value: string): value is EulerOrder {
  return (EULER_ORDERS as readonly string[]).includes(value);
}

export class Euler {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
    public order: EulerOrder = 'XYZ',
  ) {}

  set(x: number, y: number, z: number, order: EulerOrder = this.order) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.order = order;
    return this;
  }

  copy(euler: Euler) {
    return this.set(euler.x, euler.y, euler.z, euler.order);
  }

  clone() {
    return new Euler(this.x, this.y, this.z, this.order);
  }

  equals(euler: Euler) {
    return this.x === euler.x && this.y === euler.y && this.z === euler.z && this.order === euler.order;
  }
}
