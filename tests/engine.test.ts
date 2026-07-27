import { describe, expect, it, vi } from 'vitest';
import {
  BasicMaterial,
  BoxGeometry,
  BufferGeometry,
  Mesh,
  Node,
  OrthographicCamera,
  PerspectiveCamera,
  PostProcess,
  Raycaster,
  SimplePhysics,
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

describe('geometry and raycasting', () => {
  it('validates positions and computes bounds', () => {
    expect(() => new BufferGeometry([0, 1])).toThrow('xyz triples');
    expect(new BoxGeometry(2).boundingRadius).toBeCloseTo(Math.sqrt(3));
  });

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
    const input = {} as WebGLTexture;
    const output = {} as WebGLFramebuffer;
    const gl = {} as WebGL2RenderingContext;
    expect(post.render(input, output, gl)).toBe(post);
    expect(order).toEqual([1, 2]);
    post.clear().render(input, output, gl);
    expect(order).toEqual([1, 2]);
  });

  it('parses material shorthand color and opacity', () => {
    const material = new BasicMaterial({ color: '#f00', opacity: 0.5 });
    expect(Array.from(material.color)).toEqual([1, 0, 0, 0.5]);
    expect(material.transparent).toBe(true);
  });

  it('supports explicit ray setup', () => {
    const ray = new Raycaster().set(new Vector3(1, 2, 3), new Vector3(0, 0, -10));
    expect(ray.origin).toEqual(new Vector3(1, 2, 3));
    expect(ray.direction.length()).toBeCloseTo(1);
  });
});
