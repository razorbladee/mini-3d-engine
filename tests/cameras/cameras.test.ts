import { describe, expect, it } from 'vitest';
import { Node, OrthographicCamera, PerspectiveCamera } from '../../src';

describe('PerspectiveCamera', () => {
  it('builds a projection matrix from fov and aspect', () => {
    const camera = new PerspectiveCamera(90, 2, 0.1, 100);
    const focal = 1 / Math.tan((90 * Math.PI) / 360);
    expect(camera.projectionMatrix[0]).toBeCloseTo(focal / 2, 5);
    expect(camera.projectionMatrix[5]).toBeCloseTo(focal, 5);
    expect(camera.projectionMatrix[11]).toBe(-1);
  });

  it('recomputes projection when aspect changes', () => {
    const camera = new PerspectiveCamera(60, 1);
    const before = camera.projectionMatrix[0];
    camera.aspect = 2;
    camera.updateProjectionMatrix();
    expect(camera.projectionMatrix[0]).toBeCloseTo(before / 2, 5);
  });

  it('maps the near plane to -1 and the far plane to +1 in clip space', () => {
    const near = 0.5;
    const far = 50;
    const camera = new PerspectiveCamera(60, 1, near, far);
    const e = camera.projectionMatrix;
    const project = (z: number) => (e[10] * z + e[14]) / -z;
    expect(project(-near)).toBeCloseTo(-1, 5);
    expect(project(-far)).toBeCloseTo(1, 5);
  });
});

describe('OrthographicCamera', () => {
  it('builds and updates orthographic projections', () => {
    const camera = new OrthographicCamera(-2, 2, 1, -1, 1, 11);
    expect(camera.projectionMatrix[0]).toBeCloseTo(0.5, 5);
    expect(camera.projectionMatrix[5]).toBeCloseTo(1, 5);
    camera.right = 6;
    camera.updateProjectionMatrix();
    expect(camera.projectionMatrix[0]).toBeCloseTo(0.25, 5);
  });

  it('centres an off-centre frustum', () => {
    const camera = new OrthographicCamera(0, 4, 4, 0, 1, 11);
    expect(camera.projectionMatrix[12]).toBeCloseTo(-1, 5);
    expect(camera.projectionMatrix[13]).toBeCloseTo(-1, 5);
  });

  it('rejects a degenerate volume', () => {
    expect(() => new OrthographicCamera(0, 0, 1, -1, 0.1, 10)).toThrow('non-zero volume');
    expect(() => new OrthographicCamera(-1, 1, 1, -1, 5, 5)).toThrow('non-zero volume');
  });
});

describe('Camera view matrix', () => {
  it('inverts the camera world transform', () => {
    const camera = new PerspectiveCamera();
    camera.position.set(2, 3, 4);
    camera.updateViewMatrix();
    expect(camera.viewMatrix.elements[12]).toBeCloseTo(-2, 5);
    expect(camera.viewMatrix.elements[13]).toBeCloseTo(-3, 5);
    expect(camera.viewMatrix.elements[14]).toBeCloseTo(-4, 5);
  });

  it('accounts for a parent transform', () => {
    const rig = new Node();
    rig.position.set(10, 0, 0);
    const camera = new PerspectiveCamera();
    camera.position.set(0, 0, 5);
    rig.add(camera);
    rig.updateWorldMatrix();
    camera.updateViewMatrix();
    expect(camera.viewMatrix.elements[12]).toBeCloseTo(-10, 5);
    expect(camera.viewMatrix.elements[14]).toBeCloseTo(-5, 5);
  });
});
