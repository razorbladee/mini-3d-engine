import { describe, expect, it } from 'vitest';
import { OrbitControls, PerspectiveCamera, Vector3 } from '../../src';

/**
 * AUDIT-TZ P1-2 / T-2.
 *
 * The previous tests/interaction.test.ts claimed to test this class but never
 * imported it: it built a fake `{ target }` object and asserted that a freshly
 * constructed camera has z === 0. This is the real thing.
 *
 * The aiming tests fail until stage 3, because updateCamera() sets Euler angles
 * that only describe the intended orientation under YXZ order, while
 * Matrix4.compose applies XYZ.
 */

function createElement(): HTMLElement {
  const listeners = new Map<string, EventListener>();
  return {
    style: {} as CSSStyleDeclaration,
    addEventListener: (type: string, handler: EventListener) => listeners.set(type, handler),
    removeEventListener: (type: string) => listeners.delete(type),
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
  } as unknown as HTMLElement;
}

/** Angle between the camera forward axis and the direction from camera to target. */
function aimError(camera: PerspectiveCamera, target: Vector3) {
  camera.updateWorldMatrix();
  const e = camera.worldMatrix.elements;
  const forward = new Vector3(-e[8], -e[9], -e[10]).normalize();
  const toTarget = target.clone().sub(camera.position).normalize();
  const dot = forward.x * toTarget.x + forward.y * toTarget.y + forward.z * toTarget.z;
  return Math.acos(Math.min(1, Math.max(-1, dot)));
}

describe('OrbitControls', () => {
  it('keeps the camera at the configured distance from the target', () => {
    const camera = new PerspectiveCamera();
    const controls = new OrbitControls(camera, createElement());
    controls.focus(new Vector3(1, 2, -3), 10);
    expect(camera.position.clone().sub(controls.getTarget()).length()).toBeCloseTo(10, 5);
  });

  it('clamps the focus distance into the supported range', () => {
    const camera = new PerspectiveCamera();
    const controls = new OrbitControls(camera, createElement());
    controls.focus(new Vector3(), 1000);
    expect(camera.position.length()).toBeLessThanOrEqual(30.0001);
    controls.focus(new Vector3(), 0.1);
    expect(camera.position.length()).toBeGreaterThanOrEqual(2.4999);
  });

  it('restores the default framing on reset', () => {
    const camera = new PerspectiveCamera();
    const controls = new OrbitControls(camera, createElement());
    controls.focus(new Vector3(5, 5, 5), 12);
    controls.reset();
    expect(controls.getTarget()).toEqual(new Vector3(0, 0, 0));
    expect(camera.position.length()).toBeCloseTo(8, 5);
  });

  it('returns a defensive copy of the target', () => {
    const controls = new OrbitControls(new PerspectiveCamera(), createElement());
    const target = controls.getTarget();
    target.x = 42;
    expect(controls.getTarget().x).toBe(0);
  });

  it('aims at the origin from the default orientation', () => {
    const camera = new PerspectiveCamera();
    const controls = new OrbitControls(camera, createElement());
    controls.reset();
    expect(aimError(camera, controls.getTarget())).toBeLessThan(1e-6);
  });

  it('aims at the target across a grid of orbit angles', () => {
    const camera = new PerspectiveCamera();
    const controls = new OrbitControls(camera, createElement());
    const target = new Vector3(0, 0, -5);

    for (const azimuth of [-2.5, -1.2, 0, 0.9, 2.0]) {
      for (const elevation of [-1.2, -0.4, 0, 0.6, 1.3]) {
        controls.focus(target, 8);
        // Drive the internal spherical angles through the public pointer path.
        Reflect.set(controls, 'azimuth', azimuth);
        Reflect.set(controls, 'elevation', elevation);
        controls.updateCamera();
        expect(aimError(camera, target)).toBeLessThan(1e-6);
      }
    }
  });
});
