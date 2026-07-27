import { describe, expect, it } from 'vitest';
import { AmbientLight, DirectionalLight, HemisphereLight, Light, Node, PointLight, SpotLight, Vector3 } from '../src';

describe('light nodes', () => {
  it('default to white at full intensity', () => {
    for (const light of [new AmbientLight(), new DirectionalLight(), new PointLight()]) {
      expect(light.color).toBe('#ffffff');
      expect(light.intensity).toBe(1);
    }
  });

  it('accept colour and intensity', () => {
    const light = new DirectionalLight('#ff0000', 2.5);
    expect(light.color).toBe('#ff0000');
    expect(light.intensity).toBe(2.5);
  });

  it('are scene nodes', () => {
    expect(new AmbientLight()).toBeInstanceOf(Node);
    expect(new AmbientLight()).toBeInstanceOf(Light);
  });

  it('point down by default where a direction applies', () => {
    expect(new DirectionalLight().direction).toEqual(new Vector3(0, -1, 0));
    expect(new SpotLight().direction.y).toBe(-1);
  });

  it('expose the type specific parameters', () => {
    expect(new PointLight().distance).toBe(0);
    expect(new HemisphereLight().groundColor).toBe('#777777');
    const spot = new SpotLight();
    expect(spot.angle).toBeCloseTo(Math.PI / 6, 6);
    expect(spot.penumbra).toBeCloseTo(0.2, 6);
  });

  it('participate in scene traversal', () => {
    const scene = new Node();
    scene.add(new AmbientLight('#fff', 0.4), new DirectionalLight('#fff', 1.2), new PointLight('#f00', 2));
    const visited: Node[] = [];
    scene.traverse((node) => visited.push(node));
    expect(visited).toHaveLength(4);
  });

  it('can be positioned like any other node', () => {
    const light = new PointLight();
    light.position.set(1, 2, 3);
    light.updateWorldMatrix();
    const e = light.worldMatrix.elements;
    expect([e[12], e[13], e[14]]).toEqual([1, 2, 3]);
  });
});
