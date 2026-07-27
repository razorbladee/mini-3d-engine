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

describe('geometry and normals', () => {
  it('validates positions and computes bounds and face normals', () => {
    expect(() => new BufferGeometry([0, 1])).toThrow('xyz triples');
    const box = new BoxGeometry(2);
    expect(box.boundingRadius).toBeCloseTo(Math.sqrt(3));
    expect(box.normals.length).toBe(box.positions.length);
    expect(box.normals[2]).toBeCloseTo(1);
  });
  it('creates smooth radial normals for spheres', () => {
    const sphere = new SphereGeometry(2, 8, 4);
    const length = Math.hypot(sphere.normals[0], sphere.normals[1], sphere.normals[2]);
    expect(length).toBeCloseTo(1);
    expect(sphere.normals.length).toBe(sphere.positions.length);
    expect(() => new SphereGeometry(1, 2, 1)).toThrow('at least 3');
  });
});

describe('geometry and raycasting', () => {
  it('returns real hits, removes misses, and sorts by distance', () => {
    const material = new BasicMaterial();
    const near = new Mesh(new BoxGeometry(1), material);
    const far = new Mesh(new BoxGeometry(1), material);
    const miss = new Mesh(new BoxGeometry(1), material);
    near.position.z = -3;
    far.position.z = -7;
    miss.position.set(10, 0, -3);
    const hits = new Raycaster().intersectObjects([far, miss, near]);
    expect(hits.map((hit) => hit.object)).toEqual([near, far]);
    expect(hits[0].distance).toBeGreaterThan(0);
    expect(hits[0].point.z).toBeLessThan(0);
  });
  it('derives perspective and orthographic rays from NDC', () => {
    const perspective = new PerspectiveCamera(90, 2);
    const ray = new Raycaster().setFromCamera({ x: 1, y: 0 }, perspective);
    expect(ray.direction.x).toBeGreaterThan(0);
    expect(ray.direction.z).toBeLessThan(0);
    const ortho = new OrthographicCamera(-2, 2, 2, -2);
    ray.setFromCamera({ x: 1, y: 1 }, ortho);
    expect(ray.origin.x).toBeCloseTo(2);
    expect(ray.origin.y).toBeCloseTo(2);
  });
  it('ignores invisible meshes', () => {
    const mesh = new Mesh(new BoxGeometry(), new BasicMaterial());
    mesh.position.z = -2;
    mesh.visible = false;
    expect(new Raycaster().intersectObjects([mesh])).toEqual([]);
  });
});

describe('lights and materials', () => {
  it('keeps BasicMaterial unlit and stores PBR controls in StandardMaterial', () => {
    expect(new BasicMaterial()).not.toBeInstanceOf(StandardMaterial);
    const standard = new StandardMaterial({ color: '#ff0000', roughness: 0.2, metalness: 0.8 });
    expect(standard.roughness).toBe(0.2);
    expect(standard.metalness).toBe(0.8);
  });
  it('supports all built-in light nodes and scene traversal', () => {
    const scene = new Node();
    scene.add(new AmbientLight('#fff', 0.4), new DirectionalLight('#fff', 1.2), new PointLight('#f00', 2));
    const found: Node[] = [];
    scene.traverse((node) => found.push(node));
    expect(found).toHaveLength(4);
    expect((found[3] as PointLight).intensity).toBe(2);
  });
});

describe('existing extension behavior', () => {
  it('integrates gravity, preserves velocity, and clamps the floor', () => {
    const physics = new SimplePhysics();
    const node = new Node();
    node.position.y = 1;
    physics.addBody(node, new Vector3(1, 0, 0));
    physics.step(0.1);
    expect(node.position.x).toBeCloseTo(0.1);
    physics.step(10);
    expect(node.position.y).toBe(0);
  });
  it('runs post-process passes in order and clears them', () => {
    const order: number[] = [];
    const post = new PostProcess();
    post.add({ apply: () => { order.push(1); } }).add({ apply: () => { order.push(2); } });
    expect(post.render({} as WebGLTexture, {} as WebGLFramebuffer, {} as WebGL2RenderingContext)).toBe(post);
    expect(order).toEqual([1, 2]);
    post.clear().render({} as WebGLTexture, {} as WebGLFramebuffer, {} as WebGL2RenderingContext);
    expect(order).toEqual([1, 2]);
  });
});
