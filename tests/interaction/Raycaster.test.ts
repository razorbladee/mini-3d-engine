import { describe, expect, it } from 'vitest';
import { BasicMaterial, BoxGeometry, Mesh, OrthographicCamera, PerspectiveCamera, Raycaster, Vector3 } from '../../src';

const mesh = () => new Mesh(new BoxGeometry(1), new BasicMaterial());

describe('Raycaster', () => {
  it('returns hits sorted by distance and skips misses', () => {
    const near = mesh();
    const far = mesh();
    const miss = mesh();
    near.position.z = -3;
    far.position.z = -7;
    miss.position.set(10, 0, -3);

    const hits = new Raycaster().intersectObjects([far, miss, near]);
    expect(hits.map((hit) => hit.object)).toEqual([near, far]);
    expect(hits[0].distance).toBeLessThan(hits[1].distance);
  });

  it('skips invisible objects', () => {
    const hidden = mesh();
    hidden.position.z = -3;
    hidden.visible = false;
    expect(new Raycaster().intersectObjects([hidden])).toHaveLength(0);
  });

  it('ignores objects behind the ray origin', () => {
    const behind = mesh();
    behind.position.z = 5;
    expect(new Raycaster().intersectObjects([behind])).toHaveLength(0);
  });

  it('reports an intersection point on the ray', () => {
    const target = mesh();
    target.position.z = -4;
    const [hit] = new Raycaster().intersectObjects([target]);
    expect(hit.point.x).toBeCloseTo(0, 6);
    expect(hit.point.z).toBeCloseTo(-hit.distance, 6);
  });

  it('accounts for object scale when sizing the bounds', () => {
    const scaled = mesh();
    scaled.position.set(2, 0, -5);
    expect(new Raycaster().intersectObjects([scaled])).toHaveLength(0);
    scaled.scale.set(6, 6, 6);
    expect(new Raycaster().intersectObjects([scaled])).toHaveLength(1);
  });

  it('derives a ray direction from normalized device coordinates', () => {
    const ray = new Raycaster().setFromCamera({ x: 1, y: 0 }, new PerspectiveCamera(90, 2));
    expect(ray.direction.x).toBeGreaterThan(0);
    expect(ray.direction.z).toBeLessThan(0);
    expect(ray.direction.length()).toBeCloseTo(1, 6);
  });

  it('shoots parallel rays offset by NDC for an orthographic camera', () => {
    const camera = new OrthographicCamera(-2, 2, 2, -2, 0.1, 100);
    const ray = new Raycaster().setFromCamera({ x: 1, y: 0 }, camera);
    expect(ray.origin.x).toBeCloseTo(2, 5);
    expect(ray.direction.z).toBeCloseTo(-1, 5);
  });

  it('normalizes an explicitly supplied direction', () => {
    const ray = new Raycaster().set(new Vector3(0, 0, 0), new Vector3(0, 0, -5));
    expect(ray.direction.length()).toBeCloseTo(1, 6);
  });
});
