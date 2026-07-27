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

describe('Raycaster narrow phase', () => {
  // AUDIT-TZ P2-7: the old implementation reported bounding-sphere hits as real
  // intersections, so a ray through the empty corner of a cube's sphere "hit".
  it('misses the corner gap between the cube and its bounding sphere', () => {
    const cube = mesh();
    cube.position.z = -5;
    // A unit cube spans +-0.5 but its bounding sphere has radius ~0.866, so
    // (0.6, 0.4) lies inside the sphere yet outside the box.
    const ray = new Raycaster().set(new Vector3(0.6, 0.4, 0), new Vector3(0, 0, -1));
    expect(ray.intersectObjects([cube], { boundsOnly: true })).toHaveLength(1);
    expect(ray.intersectObjects([cube])).toHaveLength(0);
  });

  it('reports a point on the surface, not inside the sphere', () => {
    const cube = mesh();
    cube.position.z = -5;
    const [hit] = new Raycaster().intersectObjects([cube]);
    // Front face of a unit cube centred at z = -5.
    expect(hit.point.z).toBeCloseTo(-4.5, 5);
    expect(hit.distance).toBeCloseTo(4.5, 5);
  });

  it('returns the outward normal of the hit face', () => {
    const cube = mesh();
    cube.position.z = -5;
    const [hit] = new Raycaster().intersectObjects([cube]);
    expect(hit.normal.z).toBeCloseTo(1, 5);
  });

  it('identifies which triangle was hit', () => {
    const cube = mesh();
    cube.position.z = -5;
    const [hit] = new Raycaster().intersectObjects([cube]);
    expect(Number.isInteger(hit.triangleIndex)).toBe(true);
    expect(hit.triangleIndex).toBeGreaterThanOrEqual(0);
  });

  it('respects the object transform when intersecting', () => {
    const cube = mesh();
    cube.position.set(0, 0, -5);
    cube.scale.set(4, 4, 4);
    const ray = new Raycaster().set(new Vector3(1.5, 0, 0), new Vector3(0, 0, -1));
    // Outside the unit cube, inside the scaled one.
    expect(ray.intersectObjects([cube])).toHaveLength(1);
  });

  it('returns the nearest surface when two objects overlap the ray', () => {
    const near = mesh();
    const far = mesh();
    near.position.z = -3;
    far.position.z = -7;
    const hits = new Raycaster().intersectObjects([far, near]);
    expect(hits[0].object).toBe(near);
    expect(hits[0].point.z).toBeCloseTo(-2.5, 5);
  });
});
