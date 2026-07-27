import { describe, expect, it } from 'vitest';
import { Texture2D } from '../../src';
import { createFakeGL } from '../helpers/fakeGL';

/** AUDIT-TZ P2-9 / T-7: Texture2D previously had no coverage at all. */

const fakeImage = (width: number, height: number) => ({ width, height }) as HTMLImageElement;

describe('Texture2D upload', () => {
  it('creates one GPU texture and caches it per context', () => {
    const gl = createFakeGL();
    const texture = Texture2D.fromImage(fakeImage(64, 64));
    const first = texture.upload(gl);
    const second = texture.upload(gl);
    expect(second).toBe(first);
    expect(gl.__live('texture')).toHaveLength(1);
  });

  it('uploads separately into a different context', () => {
    const a = createFakeGL();
    const b = createFakeGL();
    const texture = Texture2D.fromImage(fakeImage(64, 64));
    texture.upload(a);
    texture.upload(b);
    expect(a.__live('texture')).toHaveLength(1);
    expect(b.__live('texture')).toHaveLength(1);
  });

  it('restores the flip-Y pixel store flag after uploading', () => {
    // Leaving UNPACK_FLIP_Y_WEBGL set corrupted every later upload in the
    // context, including ones made by unrelated code.
    const gl = createFakeGL();
    Texture2D.fromImage(fakeImage(64, 64)).upload(gl);
    const flips = gl.__pixelStore.filter((entry) => entry.name === gl.UNPACK_FLIP_Y_WEBGL);
    expect(flips.at(-1)?.value).toBe(0);
  });

  it('generates mipmaps for power-of-two images', () => {
    const gl = createFakeGL();
    Texture2D.fromImage(fakeImage(128, 128)).upload(gl);
    expect(gl.__mipmapCount).toBe(1);
  });

  it('skips mipmaps for non power-of-two images', () => {
    const gl = createFakeGL();
    Texture2D.fromImage(fakeImage(100, 60)).upload(gl);
    expect(gl.__mipmapCount).toBe(0);
  });

  it('forces clamping for non power-of-two images', () => {
    const gl = createFakeGL();
    Texture2D.fromImage(fakeImage(100, 60), { wrapS: 'repeat', wrapT: 'repeat' }).upload(gl);
    const wraps = gl.__texParams.filter((p) => p.name === gl.TEXTURE_WRAP_S || p.name === gl.TEXTURE_WRAP_T);
    expect(wraps.every((p) => p.value === gl.CLAMP_TO_EDGE)).toBe(true);
  });

  it('honours repeat wrapping for power-of-two images', () => {
    const gl = createFakeGL();
    Texture2D.fromImage(fakeImage(64, 64), { wrapS: 'repeat', wrapT: 'repeat' }).upload(gl);
    const wraps = gl.__texParams.filter((p) => p.name === gl.TEXTURE_WRAP_S || p.name === gl.TEXTURE_WRAP_T);
    expect(wraps.every((p) => p.value === gl.REPEAT)).toBe(true);
  });

  it('honours nearest filtering', () => {
    const gl = createFakeGL();
    Texture2D.fromImage(fakeImage(100, 60), { minFilter: 'nearest', magFilter: 'nearest' }).upload(gl);
    const mag = gl.__texParams.find((p) => p.name === gl.TEXTURE_MAG_FILTER);
    expect(mag?.value).toBe(gl.NEAREST);
  });

  it('applies and clamps anisotropic filtering when supported', () => {
    const gl = createFakeGL();
    Texture2D.fromImage(fakeImage(128, 128), { anisotropy: 32 }).upload(gl);
    expect(gl.__texParams.find((p) => p.name === 0x84fe)?.value).toBe(16);
  });

  it('defaults to linear filtering and clamped wrapping', () => {
    const texture = Texture2D.fromImage(fakeImage(64, 64));
    expect(texture.options).toMatchObject({
      minFilter: 'linear',
      magFilter: 'linear',
      wrapS: 'clamp',
      anisotropy: 1,
      flipY: true,
    });
  });
});

describe('Texture2D disposal', () => {
  it('deletes the GPU texture', () => {
    const gl = createFakeGL();
    const texture = Texture2D.fromImage(fakeImage(64, 64));
    texture.upload(gl);
    texture.dispose(gl);
    expect(gl.__live('texture')).toHaveLength(0);
  });

  it('re-uploads after disposal', () => {
    const gl = createFakeGL();
    const texture = Texture2D.fromImage(fakeImage(64, 64));
    const first = texture.upload(gl);
    texture.dispose(gl);
    expect(texture.upload(gl)).not.toBe(first);
  });

  it('tolerates disposing an unused context', () => {
    const texture = Texture2D.fromImage(fakeImage(64, 64));
    expect(() => texture.dispose(createFakeGL())).not.toThrow();
  });
});

describe('Texture2D loading', () => {
  it('reports a useful error when the image cannot be decoded', async () => {
    class FailingImage {
      crossOrigin = '';
      decoding = '';
      src = '';
      decode() {
        return Promise.reject(new Error('network'));
      }
    }
    const original = globalThis.Image;
    globalThis.Image = FailingImage as unknown as typeof Image;
    try {
      await expect(Texture2D.load('https://example.com/missing.png')).rejects.toThrow('Unable to load texture');
    } finally {
      globalThis.Image = original;
    }
  });
});
