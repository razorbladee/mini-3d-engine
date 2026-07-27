import { describe, expect, it } from 'vitest';
import { BoxGeometry, ResourceCache, SphereGeometry } from '../../src';
import { createFakeGL } from '../helpers/fakeGL';

/** AUDIT-TZ P1-6: single owner for GPU resources, with a real dispose path. */

describe('ResourceCache', () => {
  it('uploads three buffers per geometry', () => {
    const gl = createFakeGL();
    const cache = new ResourceCache(gl);
    cache.geometry(new BoxGeometry(1));
    expect(gl.__live('buffer')).toHaveLength(3);
  });

  it('reuses buffers for a repeated geometry', () => {
    const gl = createFakeGL();
    const cache = new ResourceCache(gl);
    const geometry = new BoxGeometry(1);
    const first = cache.geometry(geometry);
    const second = cache.geometry(geometry);
    expect(second).toBe(first);
    expect(gl.__live('buffer')).toHaveLength(3);
  });

  it('keeps distinct geometries apart', () => {
    const gl = createFakeGL();
    const cache = new ResourceCache(gl);
    cache.geometry(new BoxGeometry(1));
    cache.geometry(new SphereGeometry(1, 8, 4));
    expect(gl.__live('buffer')).toHaveLength(6);
  });

  it('reports the vertex count alongside the buffers', () => {
    const gl = createFakeGL();
    const geometry = new BoxGeometry(1);
    expect(new ResourceCache(gl).geometry(geometry).vertexCount).toBe(geometry.positions.length / 3);
  });

  it('releases a single geometry', () => {
    const gl = createFakeGL();
    const cache = new ResourceCache(gl);
    const geometry = new BoxGeometry(1);
    cache.geometry(geometry);
    cache.releaseGeometry(geometry);
    expect(gl.__live('buffer')).toHaveLength(0);
  });

  it('re-uploads after a release', () => {
    const gl = createFakeGL();
    const cache = new ResourceCache(gl);
    const geometry = new BoxGeometry(1);
    const first = cache.geometry(geometry);
    cache.releaseGeometry(geometry);
    expect(cache.geometry(geometry)).not.toBe(first);
  });

  it('ignores releasing an unknown geometry', () => {
    const cache = new ResourceCache(createFakeGL());
    expect(() => cache.releaseGeometry(new BoxGeometry(1))).not.toThrow();
  });

  it('frees every tracked resource on dispose', () => {
    const gl = createFakeGL();
    const cache = new ResourceCache(gl);
    cache.geometry(new BoxGeometry(1));
    cache.geometry(new SphereGeometry(1, 8, 4));
    const program = gl.createProgram();
    cache.program(program as unknown as WebGLProgram);

    cache.dispose();

    expect(gl.__live()).toEqual([]);
  });
});
