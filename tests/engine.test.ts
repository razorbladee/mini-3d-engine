import { describe, expect, it } from 'vitest';
import {
  AmbientLight,
  BasicMaterial,
  BoxGeometry,
  BufferGeometry,
  DirectionalLight,
  Mesh,
  Node,
  OrthographicCamera,
  PerspectiveCamera,
  PointLight,
  PostProcess,
  Raycaster,
  SimplePhysics,
  SphereGeometry,
  StandardMaterial,
  Texture2D,
  Vector3,
} from '../src';

describe('cameras', () => {
  it('builds and updates orthographic projections', () => {
    const camera = new OrthographicCamera(-2, 2, 1, -1, 1, 11);
    expect(camera.projectionMatrix[0]).toBeCloseTo(0.5);
    expect(camera.projectionMatrix[5]).toBeCloseTo(1);
    camera.right = 6;
    camera.updateProjectionMatrix();
    expect(camera.projectionMatrix[0]).toBeCloseTo(0.25);
  });
  it('creates a view matrix from camera transforms', () => {
    const camera = new PerspectiveCamera();
    camera.position.set(2, 3, 4);
    camera.updateViewMatrix();
    expect(camera.viewMatrix.elements[12]).toBeCloseTo(-2);
    expect(camera.viewMatrix.elements[13]).toBeCloseTo(-3);
    expect(camera.viewMatrix.elements[14]).toBeCloseTo(-4);
  });
});
describe('geometry and UVs', () => {
  it('computes matching normals and UV coordinates', () => {
    const box = new BoxGeometry(2);
    expect(box.normals.length).toBe(box.positions.length);
    expect(box.uvs.length).toBe((box.positions.length / 3) * 2);
    expect(box.uvs.every((value) => Number.isFinite(value))).toBe(true);
  });
  it('validates custom attributes', () => {
    expect(() => new BufferGeometry([0, 1, 0], [0, 0])).toThrow('normals');
    expect(() => new BufferGeometry([0, 1, 0], undefined, [0])).toThrow('UVs');
  });
  it('creates radial sphere normals', () => {
    const sphere = new SphereGeometry(2, 8, 4);
    expect(Math.hypot(sphere.normals[0], sphere.normals[1], sphere.normals[2])).toBeCloseTo(1);
    expect(() => new SphereGeometry(1, 2, 1)).toThrow('at least 3');
  });
});
describe('raycasting', () => {
  it('returns sorted real hits and ignores misses', () => {
    const material = new BasicMaterial();
    const near = new Mesh(new BoxGeometry(1), material);
    const far = new Mesh(new BoxGeometry(1), material);
    const miss = new Mesh(new BoxGeometry(1), material);
    near.position.z = -3;
    far.position.z = -7;
    miss.position.set(10, 0, -3);
    const hits = new Raycaster().intersectObjects([far, miss, near]);
    expect(hits.map((hit) => hit.object)).toEqual([near, far]);
  });
  it('derives rays from NDC', () => {
    const ray = new Raycaster().setFromCamera({ x: 1, y: 0 }, new PerspectiveCamera(90, 2));
    expect(ray.direction.x).toBeGreaterThan(0);
    expect(ray.direction.z).toBeLessThan(0);
  });
});
describe('lights and textured materials', () => {
  it('keeps material maps and PBR settings', () => {
    const image = {} as HTMLImageElement;
    const texture = Texture2D.fromImage(image);
    const standard = new StandardMaterial({ map: texture, roughness: 0.2, metalness: 0.8 });
    expect(standard.map).toBe(texture);
    expect(standard.roughness).toBe(0.2);
    expect(standard.metalness).toBe(0.8);
    expect(new BasicMaterial({ map: texture }).map).toBe(texture);
  });
  it('supports all built-in light nodes', () => {
    const scene = new Node();
    scene.add(new AmbientLight('#fff', 0.4), new DirectionalLight('#fff', 1.2), new PointLight('#f00', 2));
    const found: Node[] = [];
    scene.traverse((node) => found.push(node));
    expect(found).toHaveLength(4);
  });
});
describe('extensions', () => {
  it('integrates gravity and clears postprocess passes', () => {
    const physics = new SimplePhysics();
    const node = new Node();
    node.position.y = 1;
    physics.addBody(node, new Vector3(1, 0, 0));
    physics.step(0.1);
    expect(node.position.x).toBeCloseTo(0.1);
    const post = new PostProcess();
    const order: number[] = [];
    post.add({ apply: () => order.push(1) }).add({ apply: () => order.push(2) });
    expect(post.render({} as WebGLTexture, {} as WebGLFramebuffer, {} as WebGL2RenderingContext)).toBe(post);
    expect(order).toEqual([1, 2]);
  });
});
