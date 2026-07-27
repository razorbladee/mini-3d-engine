export type PostProcessPass = {
  apply(input: WebGLTexture, output: WebGLFramebuffer, gl: WebGL2RenderingContext): void;
};
export class PostProcess {
  private passes: PostProcessPass[] = [];
  add(pass: PostProcessPass) {
    this.passes.push(pass);
    return this;
  }
  render(input: WebGLTexture, output: WebGLFramebuffer, gl: WebGL2RenderingContext) {
    let current = input;
    for (const pass of this.passes) {
      pass.apply(current, output, gl);
    }
    return this;
  }
  clear() {
    this.passes.length = 0;
    return this;
  }
}
