export type PostProcessPass = {
  apply(input: WebGLTexture, output: WebGLFramebuffer, gl: WebGL2RenderingContext): void;
};
export class PostProcess {
  private passes: PostProcessPass[] = [];
  add(pass: PostProcessPass) {
    this.passes.push(pass);
    return this;
  }
  // TODO(AUDIT-TZ P1-7): passes are not chained - every pass receives the same
  // input and writes to the same output, so this is a list of independent calls
  // rather than a ping-pong chain. Scheduled for stage 6.
  render(input: WebGLTexture, output: WebGLFramebuffer, gl: WebGL2RenderingContext) {
    const current = input;
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
