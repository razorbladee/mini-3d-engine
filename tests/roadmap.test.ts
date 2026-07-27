import { describe, expect, it } from 'vitest';
import { Frustum, Node, ParticleSystem, inspectScene, NullAudioHooks, PerspectiveCamera, Vector3 } from '../src';
describe('roadmap modules', () => {
  it('updates and expires particles', () => {
    const p = new ParticleSystem(2);
    p.emit(undefined, undefined, 0.1).update(0.2);
    expect(p.particles).toHaveLength(0);
  });
  it('snapshots a scene', () => {
    const root = new Node();
    root.name = 'root';
    root.add(new Node());
    expect(inspectScene(root).children).toHaveLength(1);
  });
  it('supports audio no-op hooks', () => {
    expect(() => new NullAudioHooks().play('click')).not.toThrow();
  });
  it('tests frustum points', () => {
    const camera = new PerspectiveCamera();
    camera.updateViewMatrix();
    expect(new Frustum().setFromCamera(camera).intersectsPoint(new Vector3(0, 0, -1))).toBe(true);
  });
});
