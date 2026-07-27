import { BasicMaterial } from './BasicMaterial';

export type ShaderUniformValue = number | Float32Array;

/**
 * User-defined GLSL material using the engine's standard mesh attributes and
 * matrix uniform names. With `lights: true`, lighting and shadow uniforms are
 * uploaded as well, so custom looks can still participate in the scene.
 */
export class ShaderMaterial extends BasicMaterial {
  readonly vertexShader: string;
  readonly fragmentShader: string;
  readonly uniforms: Record<string, ShaderUniformValue>;
  readonly lights: boolean;

  constructor(options: {
    vertexShader: string;
    fragmentShader: string;
    uniforms?: Record<string, ShaderUniformValue>;
    lights?: boolean;
    color?: string;
    opacity?: number;
    transparent?: boolean;
    wireframe?: boolean;
    doubleSided?: boolean;
  }) {
    super(options);
    this.vertexShader = options.vertexShader;
    this.fragmentShader = options.fragmentShader;
    this.uniforms = options.uniforms ?? {};
    this.lights = options.lights ?? false;
  }
}
