import { describe, expect, it } from 'vitest';
import { Node, SimplePhysics, Vector3 } from '../../src';

describe('SimplePhysics', () => {
  it('integrates horizontal velocity', () => {
    const physics = new SimplePhysics();
    const node = new Node();
    node.position.y = 1;
    physics.addBody(node, new Vector3(1, 0, 0));
    physics.step(0.1);
    expect(node.position.x).toBeCloseTo(0.1, 6);
  });

  it('accelerates a falling body under gravity', () => {
    const physics = new SimplePhysics();
    const node = new Node();
    node.position.y = 100;
    physics.addBody(node);
    physics.step(0.1);
    const afterFirst = node.position.y;
    physics.step(0.1);
    expect(100 - afterFirst).toBeLessThan(afterFirst - node.position.y);
  });

  it('rests a body on the floor', () => {
    const physics = new SimplePhysics();
    const node = new Node();
    node.position.y = 0.05;
    physics.addBody(node);
    for (let i = 0; i < 20; i += 1) physics.step(0.1);
    expect(node.position.y).toBe(0);
  });

  it('stops simulating a removed body', () => {
    const physics = new SimplePhysics();
    const node = new Node();
    node.position.y = 10;
    physics.addBody(node);
    physics.removeBody(node);
    physics.step(0.5);
    expect(node.position.y).toBe(10);
  });

  it('advances independent bodies independently', () => {
    const physics = new SimplePhysics();
    const fast = new Node();
    const slow = new Node();
    fast.position.y = 10;
    slow.position.y = 10;
    physics.addBody(fast, new Vector3(5, 0, 0));
    physics.addBody(slow, new Vector3(1, 0, 0));
    physics.step(0.1);
    expect(fast.position.x).toBeGreaterThan(slow.position.x);
  });
});
