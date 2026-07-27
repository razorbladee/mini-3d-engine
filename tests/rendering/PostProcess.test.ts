import { describe, expect, it } from 'vitest';
import { PostProcess, type PostProcessPass } from '../../src';
import { createFakeGL } from '../helpers/fakeGL';

/**
 * AUDIT-TZ P1-7.
 *
 * render() declares `current` but never advances it, so every pass receives the
 * same input and writes to the same output: a list of independent calls rather
 * than a chain. The old test only asserted call order, so it passed regardless.
 * The chaining test fails until stage 6.
 */

const gl = createFakeGL();
const output = {} as WebGLFramebuffer;

describe('PostProcess', () => {
  it('runs passes in insertion order', () => {
    const order: number[] = [];
    const post = new PostProcess();
    post.add({ apply: () => order.push(1) }).add({ apply: () => order.push(2) });
    post.render({} as WebGLTexture, output, gl);
    expect(order).toEqual([1, 2]);
  });

  it('clears its passes', () => {
    const order: number[] = [];
    const post = new PostProcess().add({ apply: () => order.push(1) });
    post.clear().render({} as WebGLTexture, output, gl);
    expect(order).toEqual([]);
  });

  it('is a no-op with no passes', () => {
    expect(() => new PostProcess().render({} as WebGLTexture, output, gl)).not.toThrow();
  });

  it('feeds each pass the result of the previous one', () => {
    const seen: string[] = [];
    const labelling = (label: string): PostProcessPass => ({
      apply: (input) => {
        seen.push(String(input));
        return `${String(input)}>${label}` as unknown as void;
      },
    });

    const post = new PostProcess().add(labelling('a')).add(labelling('b')).add(labelling('c'));
    post.render('IN' as unknown as WebGLTexture, output, gl);

    expect(seen).toEqual(['IN', 'IN>a', 'IN>a>b']);
  });
});
