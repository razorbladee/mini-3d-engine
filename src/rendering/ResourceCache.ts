import type { BufferGeometry } from '../geometry/BufferGeometry';
import type { Texture2D } from './Texture2D';

export type GeometryBuffers = {
  position: WebGLBuffer;
  normal: WebGLBuffer;
  uv: WebGLBuffer;
  vertexCount: number;
};

/**
 * Single owner of every GPU object a renderer creates.
 *
 * Previously buffers were tracked in three WeakMaps on the renderer *and* in
 * three fields on the geometry, with the upload check reading the geometry
 * fields and the cache reading the WeakMaps: two sources of truth for one
 * resource. dispose() then deleted only the shader programs, so every VBO and
 * texture leaked - and the showcase disposes an engine on each scene switch
 * (AUDIT-TZ P1-6).
 *
 * Keeping this in one place also honours the architecture rule that geometry
 * must not depend on the renderer: BufferGeometry no longer holds WebGL types.
 */
export class ResourceCache {
  private readonly geometries = new Map<BufferGeometry, GeometryBuffers>();
  private readonly textures = new Map<Texture2D, WebGLTexture>();
  private readonly programs = new Set<WebGLProgram>();

  constructor(private readonly gl: WebGL2RenderingContext) {}

  /** Read-only diagnostics for examples and performance tooling. */
  get stats() {
    return {
      geometries: this.geometries.size,
      textures: this.textures.size,
      programs: this.programs.size,
    };
  }

  /** Uploads the geometry on first use, then returns the cached buffers. */
  geometry(geometry: BufferGeometry): GeometryBuffers {
    const existing = this.geometries.get(geometry);
    if (existing) return existing;

    const gl = this.gl;
    const upload = (data: Float32Array) => {
      const buffer = gl.createBuffer();
      if (!buffer) throw new Error('Unable to create WebGL buffer');
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      return buffer;
    };

    const buffers: GeometryBuffers = {
      position: upload(geometry.positions),
      normal: upload(geometry.normals),
      uv: upload(geometry.uvs),
      vertexCount: geometry.positions.length / 3,
    };
    this.geometries.set(geometry, buffers);
    return buffers;
  }

  texture(texture: Texture2D): WebGLTexture {
    const existing = this.textures.get(texture);
    if (existing) return existing;
    const uploaded = texture.upload(this.gl);
    this.textures.set(texture, uploaded);
    return uploaded;
  }

  /** Registers a program so dispose() can release it. */
  program<T extends WebGLProgram>(program: T): T {
    this.programs.add(program);
    return program;
  }

  /** Drops a single geometry, e.g. when its vertex data is replaced. */
  releaseGeometry(geometry: BufferGeometry) {
    const buffers = this.geometries.get(geometry);
    if (!buffers) return;
    this.gl.deleteBuffer(buffers.position);
    this.gl.deleteBuffer(buffers.normal);
    this.gl.deleteBuffer(buffers.uv);
    this.geometries.delete(geometry);
  }

  releaseTexture(texture: Texture2D) {
    const handle = this.textures.get(texture);
    if (!handle) return;
    texture.dispose(this.gl);
    this.textures.delete(texture);
  }

  /** Releases every resource this cache owns. */
  dispose() {
    for (const geometry of [...this.geometries.keys()]) this.releaseGeometry(geometry);
    for (const texture of [...this.textures.keys()]) this.releaseTexture(texture);
    for (const program of this.programs) this.gl.deleteProgram(program);
    this.programs.clear();
  }
}
