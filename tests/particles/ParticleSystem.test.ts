import { describe, expect, it } from 'vitest';
import {
  NullAudioHooks,
  ParticleSystem,
  Vector3,
  inspectScene,
  Node,
  Mesh,
  BoxGeometry,
  BasicMaterial,
} from '../../src';

describe('ParticleSystem', () => {
  it('emits particles up to the configured limit', () => {
    const system = new ParticleSystem(2);
    system.emit().emit().emit();
    expect(system.particles).toHaveLength(2);
  });

  it('expires particles once they outlive their lifetime', () => {
    const system = new ParticleSystem(4);
    system.emit(undefined, undefined, 0.1).update(0.2);
    expect(system.particles).toHaveLength(0);
  });

  it('keeps particles that are still alive', () => {
    const system = new ParticleSystem(4);
    system.emit(undefined, undefined, 1).update(0.2);
    expect(system.particles).toHaveLength(1);
    expect(system.particles[0].age).toBeCloseTo(0.2, 6);
  });

  it('applies gravity to velocity and velocity to position', () => {
    const system = new ParticleSystem(4, new Vector3(0, -10, 0));
    system.emit(new Vector3(), new Vector3(1, 0, 0), 10).update(0.1);
    const particle = system.particles[0];
    expect(particle.velocity.y).toBeCloseTo(-1, 6);
    expect(particle.position.x).toBeCloseTo(0.1, 6);
  });

  it('copies the emit vectors instead of aliasing them', () => {
    const system = new ParticleSystem(4);
    const position = new Vector3(1, 1, 1);
    system.emit(position, new Vector3(), 1);
    position.x = 99;
    expect(system.particles[0].position.x).toBe(1);
  });

  it('clears all particles', () => {
    const system = new ParticleSystem(4);
    system.emit().emit();
    expect(system.clear().particles).toHaveLength(0);
  });
});

describe('SceneInspector', () => {
  it('snapshots the hierarchy with names, types and visibility', () => {
    const root = new Node();
    root.name = 'root';
    const mesh = new Mesh(new BoxGeometry(1), new BasicMaterial());
    mesh.name = 'cube';
    mesh.visible = false;
    root.add(mesh);

    const snapshot = inspectScene(root);
    expect(snapshot.name).toBe('root');
    expect(snapshot.type).toBe('Node');
    expect(snapshot.children).toHaveLength(1);
    expect(snapshot.children[0]).toMatchObject({ name: 'cube', type: 'Mesh', visible: false });
  });

  it('captures nested descendants', () => {
    const root = new Node();
    const child = new Node();
    child.add(new Node());
    root.add(child);
    expect(inspectScene(root).children[0].children).toHaveLength(1);
  });
});

describe('AudioHooks', () => {
  it('provides no-op implementations', () => {
    const hooks = new NullAudioHooks();
    expect(() => hooks.play('click')).not.toThrow();
    expect(() => hooks.stop('click')).not.toThrow();
    expect(() => hooks.setVolume('click', 0.5)).not.toThrow();
  });
});
