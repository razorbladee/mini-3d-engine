export class Texture2D {
  private gpuTextures = new WeakMap<WebGL2RenderingContext, WebGLTexture>();
  private constructor(public readonly image: HTMLImageElement) {}
  static async load(url: string) {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.decoding = 'async';
    image.src = url;
    await image.decode();
    return new Texture2D(image);
  }
  static fromImage(image: HTMLImageElement) {
    return new Texture2D(image);
  }
  upload(gl: WebGL2RenderingContext) {
    const existing = this.gpuTextures.get(gl);
    if (existing) return existing;
    const texture = gl.createTexture();
    if (!texture) throw new Error('Unable to create WebGL texture');
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
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
