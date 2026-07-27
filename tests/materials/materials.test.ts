import { describe, expect, it } from 'vitest';
import { BasicMaterial, ShaderMaterial, StandardMaterial, Texture2D } from '../../src';

describe('BasicMaterial', () => {
  it('parses a six digit hex colour', () => {
    // Float32Array storage, so compare with tolerance rather than exact equality.
    const channels = Array.from(new BasicMaterial({ color: '#ff8000' }).color.slice(0, 3));
    [1, 128 / 255, 0].forEach((expected, index) => expect(channels[index]).toBeCloseTo(expected, 6));
  });

  it('parses a three digit hex colour', () => {
    expect(Array.from(new BasicMaterial({ color: '#f00' }).color.slice(0, 3))).toEqual([1, 0, 0]);
  });

  it('writes opacity into the alpha channel', () => {
    expect(new BasicMaterial({ opacity: 0.25 }).color[3]).toBeCloseTo(0.25, 6);
  });

  it('infers transparency from opacity', () => {
    expect(new BasicMaterial({ opacity: 0.4 }).transparent).toBe(true);
    expect(new BasicMaterial().transparent).toBe(false);
  });

  it('lets an explicit transparent flag win', () => {
    expect(new BasicMaterial({ opacity: 1, transparent: true }).transparent).toBe(true);
    expect(new BasicMaterial({ opacity: 0.5, transparent: false }).transparent).toBe(false);
  });

  it('defaults the optional flags', () => {
    const material = new BasicMaterial();
    expect(material.wireframe).toBe(false);
    expect(material.doubleSided).toBe(false);
    expect(material.map).toBeUndefined();
  });

  it('keeps a supplied texture map', () => {
    const texture = Texture2D.fromImage({} as HTMLImageElement);
    expect(new BasicMaterial({ map: texture }).map).toBe(texture);
  });
});

describe('ShaderMaterial', () => {
  it('keeps custom GLSL, uniforms and lighting mode', () => {
    const material = new ShaderMaterial({
      vertexShader: 'vertex source',
      fragmentShader: 'fragment source',
      uniforms: { uTime: 2, uWind: new Float32Array([1, 2]) },
      lights: true,
      color: '#123456',
    });
    expect(material.vertexShader).toBe('vertex source');
    expect(material.fragmentShader).toBe('fragment source');
    expect(material.uniforms.uTime).toBe(2);
    expect(material.lights).toBe(true);
    expect(material).toBeInstanceOf(BasicMaterial);
  });
});

describe('StandardMaterial', () => {
  it('defaults roughness and metalness', () => {
    const material = new StandardMaterial();
    expect(material.roughness).toBe(0.5);
    expect(material.metalness).toBe(0);
  });

  it('keeps PBR settings and inherits base material behaviour', () => {
    const texture = Texture2D.fromImage({} as HTMLImageElement);
    const material = new StandardMaterial({ map: texture, roughness: 0.2, metalness: 0.8, opacity: 0.5 });
    expect(material.map).toBe(texture);
    expect(material.roughness).toBe(0.2);
    expect(material.metalness).toBe(0.8);
    expect(material.transparent).toBe(true);
  });

  it('is a BasicMaterial', () => {
    expect(new StandardMaterial()).toBeInstanceOf(BasicMaterial);
  });
});
