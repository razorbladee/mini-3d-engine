import { describe, expect, it } from 'vitest';
import { AabbBounds, PerformanceMetrics, SphereBounds, Vector3 } from '../../src';

describe('SphereBounds', () => {
  it('includes points inside and on the surface', () => {
    const bounds = new SphereBounds(new Vector3(1, 0, 0), 2);
    expect(bounds.contains(new Vector3(1, 0, 0))).toBe(true);
    expect(bounds.contains(new Vector3(2, 0, 0))).toBe(true);
    expect(bounds.contains(new Vector3(3, 0, 0))).toBe(true);
  });

  it('excludes points outside the radius', () => {
    expect(new SphereBounds(new Vector3(), 1).contains(new Vector3(2, 0, 0))).toBe(false);
  });

  it('does not mutate the point it tests', () => {
    const bounds = new SphereBounds(new Vector3(1, 2, 3), 5);
    const point = new Vector3(1, 1, 1);
    bounds.contains(point);
    expect(point).toEqual(new Vector3(1, 1, 1));
    expect(bounds.center).toEqual(new Vector3(1, 2, 3));
  });
});

describe('AabbBounds', () => {
  it('grows to include expanded points', () => {
    const bounds = new AabbBounds().expand(new Vector3(1, 2, 3)).expand(new Vector3(-1, 0, 1));
    expect(bounds.contains(new Vector3(0, 1, 2))).toBe(true);
    expect(bounds.contains(new Vector3(1, 2, 3))).toBe(true);
    expect(bounds.contains(new Vector3(-1, 0, 1))).toBe(true);
  });

  it('excludes points beyond any axis', () => {
    const bounds = new AabbBounds().expand(new Vector3(0, 0, 0)).expand(new Vector3(1, 1, 1));
    expect(bounds.contains(new Vector3(2, 0.5, 0.5))).toBe(false);
    expect(bounds.contains(new Vector3(0.5, -1, 0.5))).toBe(false);
  });

  it('contains nothing before any point is added', () => {
    expect(new AabbBounds().contains(new Vector3())).toBe(false);
  });
});

describe('PerformanceMetrics', () => {
  it('accumulates frames and elapsed time', () => {
    const metrics = new PerformanceMetrics().update(0.5).update(0.25);
    expect(metrics.frames).toBe(2);
    expect(metrics.elapsed).toBeCloseTo(0.75, 6);
  });

  it('derives fps from the last delta', () => {
    expect(new PerformanceMetrics().update(0.5).fps).toBe(2);
    expect(new PerformanceMetrics().update(0.02).fps).toBeCloseTo(50, 6);
  });

  it('reports zero fps before the first frame', () => {
    expect(new PerformanceMetrics().fps).toBe(0);
  });

  it('resets every counter', () => {
    const metrics = new PerformanceMetrics().update(0.5).reset();
    expect([metrics.frames, metrics.elapsed, metrics.deltaTime, metrics.fps]).toEqual([0, 0, 0, 0]);
  });
});
