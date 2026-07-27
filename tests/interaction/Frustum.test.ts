import { describe, expect, it } from 'vitest';
import { Frustum, PerspectiveCamera, SphereBounds, Vector3 } from '../../src';

/**
 * AUDIT-TZ P1-4.
 *
 * setFromCamera() builds planes from hard-coded normals instead of extracting
 * them from the rows of the view-projection matrix, so intersectsPoint() never
 * returns true. Expected to fail until stage 6.
 */

function cameraAt(x: number, y: number, z: number) {
  const camera = new PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.set(x, y, z);
  camera.updateViewMatrix();
  return camera;
}

describe('Frustum', () => {
  it('accepts a point directly in front of the camera', () => {
    const frustum = new Frustum().setFromCamera(cameraAt(0, 0, 5));
    expect(frustum.intersectsPoint(new Vector3(0, 0, 0))).toBe(true);
  });

  it('rejects a point behind the camera', () => {
    const frustum = new Frustum().setFromCamera(cameraAt(0, 0, 5));
    expect(frustum.intersectsPoint(new Vector3(0, 0, 50))).toBe(false);
  });

  it('rejects a point beyond the far plane', () => {
    const frustum = new Frustum().setFromCamera(cameraAt(0, 0, 5));
    expect(frustum.intersectsPoint(new Vector3(0, 0, -400))).toBe(false);
  });

  it('rejects a point far outside the lateral bounds', () => {
    const frustum = new Frustum().setFromCamera(cameraAt(0, 0, 5));
    expect(frustum.intersectsPoint(new Vector3(500, 0, 0))).toBe(false);
  });

  it('accepts a sphere straddling the frustum boundary', () => {
    const frustum = new Frustum().setFromCamera(cameraAt(0, 0, 5));
    expect(frustum.intersectsSphere(new SphereBounds(new Vector3(0, 0, 0), 1))).toBe(true);
  });

  it('rejects a sphere well outside the frustum', () => {
    const frustum = new Frustum().setFromCamera(cameraAt(0, 0, 5));
    expect(frustum.intersectsSphere(new SphereBounds(new Vector3(0, 0, 400), 1))).toBe(false);
  });
});
