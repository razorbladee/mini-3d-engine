import { describe, expect, it } from 'vitest';
import { EULER_ORDERS, Euler, Matrix4, Node, Quaternion, Vector3 } from '../../src';

/** Reference rotation matrix (column-major) for a unit quaternion. */
function referenceMatrix({ x, y, z, w }: Quaternion) {
  return [
    1 - 2 * (y * y + z * z),
    2 * (x * y + z * w),
    2 * (x * z - y * w),
    2 * (x * y - z * w),
    1 - 2 * (x * x + z * z),
    2 * (y * z + x * w),
    2 * (x * z + y * w),
    2 * (y * z - x * w),
    1 - 2 * (x * x + y * y),
  ];
}

const linearPart = (matrix: Matrix4) => {
  const e = matrix.elements;
  return [e[0], e[1], e[2], e[4], e[5], e[6], e[8], e[9], e[10]];
};

describe('Quaternion', () => {
  it('defaults to identity', () => {
    expect(new Quaternion()).toEqual(new Quaternion(0, 0, 0, 1));
  });

  it('builds from an axis and angle', () => {
    const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
    expect(q.y).toBeCloseTo(Math.SQRT1_2, 6);
    expect(q.w).toBeCloseTo(Math.SQRT1_2, 6);
    expect(q.length()).toBeCloseTo(1, 6);
  });

  it('normalizes an arbitrary quaternion', () => {
    expect(new Quaternion(1, 2, 3, 4).normalize().length()).toBeCloseTo(1, 6);
  });

  it('falls back to identity when normalizing a zero quaternion', () => {
    expect(new Quaternion(0, 0, 0, 0).normalize()).toEqual(new Quaternion(0, 0, 0, 1));
  });

  it('composes rotations through multiplication', () => {
    const half = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
    const full = half.clone().multiply(half);
    const expected = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI);
    expect(full.y).toBeCloseTo(expected.y, 6);
    expect(Math.abs(full.w)).toBeCloseTo(Math.abs(expected.w), 6);
  });

  it.each(EULER_ORDERS)('round-trips Euler order %s through compose', (order) => {
    const euler = new Euler(0.3, -0.4, 0.5, order);
    const viaEuler = linearPart(new Matrix4().compose(new Vector3(), new Vector3(1, 1, 1), euler));
    const viaQuaternion = linearPart(
      new Matrix4().compose(new Vector3(), new Vector3(1, 1, 1), new Quaternion().setFromEuler(euler)),
    );
    viaEuler.forEach((value, index) => expect(value).toBeCloseTo(viaQuaternion[index], 6));
  });

  it('produces the reference rotation matrix', () => {
    const q = new Quaternion().setFromAxisAngle(new Vector3(0.3, 0.5, -0.8), 1.1);
    const expected = referenceMatrix(q);
    linearPart(new Matrix4().compose(new Vector3(), new Vector3(1, 1, 1), q)).forEach((value, index) =>
      expect(value).toBeCloseTo(expected[index], 6),
    );
  });

  it('slerps between two rotations', () => {
    const from = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), 0);
    const to = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
    const mid = from.clone().slerp(to, 0.5);
    const expected = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 4);
    expect(mid.y).toBeCloseTo(expected.y, 6);
    expect(mid.w).toBeCloseTo(expected.w, 6);
  });

  it('returns the endpoints for slerp alpha 0 and 1', () => {
    const from = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 0.3);
    const to = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), 1.2);
    expect(from.clone().slerp(to, 0)).toEqual(from);
    expect(from.clone().slerp(to, 1)).toEqual(to);
  });
});

describe('Matrix4.lookAt', () => {
  it('points the -Z axis at the target', () => {
    const eye = new Vector3(3, 4, 5);
    const target = new Vector3(0, 0, 0);
    const e = new Matrix4().lookAt(eye, target).elements;
    const forward = new Vector3(-e[8], -e[9], -e[10]);
    const expected = target.clone().sub(eye).normalize();
    expect(forward.x).toBeCloseTo(expected.x, 6);
    expect(forward.y).toBeCloseTo(expected.y, 6);
    expect(forward.z).toBeCloseTo(expected.z, 6);
  });

  it('produces an orthonormal basis', () => {
    const e = new Matrix4().lookAt(new Vector3(2, -3, 1), new Vector3(1, 1, 1)).elements;
    const right = new Vector3(e[0], e[1], e[2]);
    const up = new Vector3(e[4], e[5], e[6]);
    const back = new Vector3(e[8], e[9], e[10]);
    expect(right.length()).toBeCloseTo(1, 6);
    expect(up.length()).toBeCloseTo(1, 6);
    expect(right.dot(up)).toBeCloseTo(0, 6);
    expect(right.dot(back)).toBeCloseTo(0, 6);
  });

  it('stays finite when the view direction is parallel to up', () => {
    const e = new Matrix4().lookAt(new Vector3(0, 5, 0), new Vector3(0, 0, 0)).elements;
    expect(Array.from(e).every(Number.isFinite)).toBe(true);
  });
});

describe('Vector3 additions', () => {
  it('computes dot and cross products', () => {
    expect(new Vector3(1, 0, 0).dot(new Vector3(0, 1, 0))).toBe(0);
    expect(new Vector3(1, 0, 0).cross(new Vector3(0, 1, 0))).toEqual(new Vector3(0, 0, 1));
  });

  it('interpolates linearly', () => {
    expect(new Vector3(0, 0, 0).lerp(new Vector3(10, 20, 30), 0.5)).toEqual(new Vector3(5, 10, 15));
  });

  it('measures distance', () => {
    expect(new Vector3(0, 0, 0).distanceTo(new Vector3(3, 4, 0))).toBe(5);
  });

  it('applies a matrix as a point and as a direction', () => {
    const matrix = new Matrix4().compose(new Vector3(10, 0, 0), new Vector3(1, 1, 1));
    expect(new Vector3(1, 0, 0).applyMatrix4(matrix)).toEqual(new Vector3(11, 0, 0));
    expect(new Vector3(1, 0, 0).transformDirection(matrix)).toEqual(new Vector3(1, 0, 0));
  });

  it('accumulates a scaled vector without a temporary', () => {
    expect(new Vector3(1, 1, 1).addScaledVector(new Vector3(2, 0, 0), 3)).toEqual(new Vector3(7, 1, 1));
  });

  it('sets, negates and compares', () => {
    expect(new Vector3().setScalar(4)).toEqual(new Vector3(4, 4, 4));
    expect(new Vector3(1, -2, 3).negate()).toEqual(new Vector3(-1, 2, -3));
    expect(new Vector3(1, 2, 3).equals(new Vector3(1, 2, 3))).toBe(true);
  });
});

describe('Node rotation representations', () => {
  it('composes from the quaternion once it is marked authoritative', () => {
    const node = new Node();
    const q = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2);
    node.setRotationFromQuaternion(q.x, q.y, q.z, q.w);
    node.updateWorldMatrix();
    // 90 degrees about +Y sends +X to -Z.
    expect(node.worldMatrix.elements[0]).toBeCloseTo(0, 5);
    expect(node.worldMatrix.elements[2]).toBeCloseTo(-1, 5);
  });

  it('composes from Euler angles by default', () => {
    const node = new Node();
    node.rotation.set(0, Math.PI / 2, 0);
    node.updateWorldMatrix();
    expect(node.worldMatrix.elements[2]).toBeCloseTo(-1, 5);
  });

  it('switches back to Euler on request', () => {
    const node = new Node();
    node.setRotationFromQuaternion(0, 1, 0, 0);
    node.useEuler().rotation.set(0, 0, 0);
    node.updateWorldMatrix();
    expect(node.worldMatrix.elements[0]).toBeCloseTo(1, 5);
  });

  it('clears its children', () => {
    const parent = new Node();
    const child = new Node();
    parent.add(child);
    parent.clear();
    expect(parent.children).toHaveLength(0);
    expect(child.parent).toBeNull();
  });
});
