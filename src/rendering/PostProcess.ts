/**
 * A single post-processing step.
 *
 * `apply` receives the texture produced by the previous pass and returns the
 * texture holding its own result. Returning nothing means the pass wrote into
 * `output` and the chain continues from there, which keeps trivial passes
 * simple while still allowing a real ping-pong.
 */
export type PostProcessPass = {
  apply(input: WebGLTexture, output: WebGLFramebuffer, gl: WebGL2RenderingContext): WebGLTexture | void;
};

/**
 * Ordered chain of post-processing passes.
 *
 * render() previously declared `let current = input` and never advanced it, so
 * every pass received the original input and wrote to the same output: a list
 * of independent calls, each overwriting the last, rather than a chain. The old
 * test only asserted call order, so it passed regardless (AUDIT-TZ P1-7).
 */
export class PostProcess {
  private passes: PostProcessPass[] = [];

  add(pass: PostProcessPass) {
    this.passes.push(pass);
    return this;
  }

  remove(pass: PostProcessPass) {
    const index = this.passes.indexOf(pass);
    if (index >= 0) this.passes.splice(index, 1);
    return this;
  }

  get length() {
    return this.passes.length;
  }

  /** Runs the chain, feeding each pass the result of the previous one. */
  render(input: WebGLTexture, output: WebGLFramebuffer, gl: WebGL2RenderingContext) {
    let current = input;
    for (const pass of this.passes) {
      const produced = pass.apply(current, output, gl);
      if (produced) current = produced;
    }
    return this;
  }

  clear() {
    this.passes.length = 0;
    return this;
  }
}
