export type TextureFilter = 'nearest' | 'linear';
export type TextureWrap = 'clamp' | 'repeat' | 'mirror';

export type TextureOptions = {
  minFilter?: TextureFilter;
  magFilter?: TextureFilter;
  wrapS?: TextureWrap;
  wrapT?: TextureWrap;
  /** Generate mipmaps when the image is power-of-two in both dimensions. */
  generateMipmaps?: boolean;
  /** Requested EXT_texture_filter_anisotropic level; clamped to device support. */
  anisotropy?: number;
  flipY?: boolean;
};

const isPowerOfTwo = (value: number) => value > 0 && (value & (value - 1)) === 0;

/**
 * Image-backed 2D texture.
 *
 * Fixes from AUDIT-TZ P2-9: load() now reports a useful error instead of an
 * unhandled rejection, UNPACK_FLIP_Y_WEBGL is restored after upload rather than
 * left set for every later texture in the context, and sampler state is
 * configurable with mipmaps for power-of-two images.
 */
export class Texture2D {
  private readonly gpuTextures = new WeakMap<WebGL2RenderingContext, WebGLTexture>();

  private constructor(
    public readonly image: HTMLImageElement,
    public readonly options: Required<TextureOptions>,
  ) {}

  private static resolve(options: TextureOptions): Required<TextureOptions> {
    return {
      minFilter: options.minFilter ?? 'linear',
      magFilter: options.magFilter ?? 'linear',
      wrapS: options.wrapS ?? 'clamp',
      wrapT: options.wrapT ?? 'clamp',
      generateMipmaps: options.generateMipmaps ?? true,
      anisotropy: Math.max(1, options.anisotropy ?? 1),
      flipY: options.flipY ?? true,
    };
  }

  static async load(url: string, options: TextureOptions = {}) {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.src = url;
    try {
      await image.decode();
    } catch (cause) {
      throw new Error(`Unable to load texture: ${url}`, { cause });
    }
    return new Texture2D(image, Texture2D.resolve(options));
  }

  static fromImage(image: HTMLImageElement, options: TextureOptions = {}) {
    return new Texture2D(image, Texture2D.resolve(options));
  }

  private wrapMode(gl: WebGL2RenderingContext, wrap: TextureWrap) {
    if (wrap === 'repeat') return gl.REPEAT;
    if (wrap === 'mirror') return gl.MIRRORED_REPEAT;
    return gl.CLAMP_TO_EDGE;
  }

  upload(gl: WebGL2RenderingContext) {
    const existing = this.gpuTextures.get(gl);
    if (existing) return existing;

    const texture = gl.createTexture();
    if (!texture) throw new Error('Unable to create WebGL texture');

    const { flipY, wrapS, wrapT, minFilter, magFilter, generateMipmaps, anisotropy } = this.options;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, flipY ? 1 : 0);

    const mipmappable = generateMipmaps && isPowerOfTwo(this.image.width ?? 0) && isPowerOfTwo(this.image.height ?? 0);
    // Non power-of-two textures must clamp and cannot use mipmap filters.
    const wrap = mipmappable
      ? { s: this.wrapMode(gl, wrapS), t: this.wrapMode(gl, wrapT) }
      : { s: gl.CLAMP_TO_EDGE, t: gl.CLAMP_TO_EDGE };

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap.s);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap.t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, magFilter === 'nearest' ? gl.NEAREST : gl.LINEAR);
    gl.texParameteri(
      gl.TEXTURE_2D,
      gl.TEXTURE_MIN_FILTER,
      mipmappable
        ? minFilter === 'nearest'
          ? gl.NEAREST_MIPMAP_NEAREST
          : gl.LINEAR_MIPMAP_LINEAR
        : minFilter === 'nearest'
          ? gl.NEAREST
          : gl.LINEAR,
    );
    if (anisotropy > 1) {
      const extension = gl.getExtension('EXT_texture_filter_anisotropic') as {
        TEXTURE_MAX_ANISOTROPY_EXT: number;
        MAX_TEXTURE_MAX_ANISOTROPY_EXT: number;
      } | null;
      if (extension) {
        const supported = Number(gl.getParameter(extension.MAX_TEXTURE_MAX_ANISOTROPY_EXT)) || 1;
        gl.texParameterf(gl.TEXTURE_2D, extension.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(anisotropy, supported));
      }
    }

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
    if (mipmappable) gl.generateMipmap(gl.TEXTURE_2D);

    // Restore the global pixel store flag so later uploads are unaffected.
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);

    this.gpuTextures.set(gl, texture);
    return texture;
  }

  dispose(gl: WebGL2RenderingContext) {
    const texture = this.gpuTextures.get(gl);
    if (texture) {
      gl.deleteTexture(texture);
      this.gpuTextures.delete(gl);
    }
  }
}
