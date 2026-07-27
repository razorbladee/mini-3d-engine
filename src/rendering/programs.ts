import { basicFragmentSource, litFragmentSource, vertexSource } from './shaders';

/**
 * Explicit uniform tables.
 *
 * Names used to be derived by a substring heuristic
 * (`key.includes('Color') ? '[0]' : ''`), which produced `uAmbientColor[0]` for
 * a uniform declared as a plain `vec3`. getUniformLocation returns null for a
 * name that is not an active uniform, and gl.uniform3fv(null, ...) is a silent
 * no-op, so all ambient and hemisphere light was discarded before reaching the
 * shader (AUDIT-TZ P1-1). The mapping is now data, and a test cross-checks it
 * against the uniforms actually declared in the GLSL sources.
 */
export const SHARED_UNIFORMS = {
  model: 'uModel',
  view: 'uView',
  projection: 'uProjection',
  normalMatrix: 'uNormalMatrix',
  color: 'uColor',
  map: 'uMap',
  hasMap: 'uHasMap',
} as const;

export const LIT_UNIFORMS = {
  roughness: 'uRoughness',
  metalness: 'uMetalness',
  cameraPosition: 'uCameraPosition',
  ambientColor: 'uAmbientColor',
  directionalCount: 'uDirectionalCount',
  directionalColor: 'uDirectionalColor[0]',
  directionalDirection: 'uDirectionalDirection[0]',
  directionalIntensity: 'uDirectionalIntensity[0]',
  pointCount: 'uPointCount',
  pointColor: 'uPointColor[0]',
  pointPosition: 'uPointPosition[0]',
  pointIntensity: 'uPointIntensity[0]',
  pointDistance: 'uPointDistance[0]',
} as const;

export const ATTRIBUTES = { position: 'position', normal: 'normal', uv: 'uv' } as const;

export type SharedUniformKey = keyof typeof SHARED_UNIFORMS;
export type LitUniformKey = keyof typeof LIT_UNIFORMS;

export type ProgramState = {
  program: WebGLProgram;
  attributes: Record<keyof typeof ATTRIBUTES, number>;
  uniforms: Record<SharedUniformKey, WebGLUniformLocation | null>;
  litUniforms: Record<LitUniformKey, WebGLUniformLocation | null> | null;
};

/** Maximum simultaneous lights per type; must match MAX_LIGHTS in the shader. */
export const MAX_LIGHTS = 4;

function compileShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('Unable to create WebGL shader');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || 'Shader compilation failed';
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

export function createProgram(
  gl: WebGL2RenderingContext,
  vertex: string,
  fragment: string,
  lit: boolean,
): ProgramState {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertex);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragment);
  const program = gl.createProgram();
  if (!program) throw new Error('Unable to create WebGL program');

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || 'Program link failed';
    gl.deleteProgram(program);
    throw new Error(log);
  }

  const attributes = {} as Record<keyof typeof ATTRIBUTES, number>;
  for (const [key, name] of Object.entries(ATTRIBUTES) as [keyof typeof ATTRIBUTES, string][])
    attributes[key] = gl.getAttribLocation(program, name);

  const uniforms = {} as Record<SharedUniformKey, WebGLUniformLocation | null>;
  for (const [key, name] of Object.entries(SHARED_UNIFORMS) as [SharedUniformKey, string][])
    uniforms[key] = gl.getUniformLocation(program, name);

  let litUniforms: Record<LitUniformKey, WebGLUniformLocation | null> | null = null;
  if (lit) {
    litUniforms = {} as Record<LitUniformKey, WebGLUniformLocation | null>;
    for (const [key, name] of Object.entries(LIT_UNIFORMS) as [LitUniformKey, string][])
      litUniforms[key] = gl.getUniformLocation(program, name);
  }

  return { program, attributes, uniforms, litUniforms };
}

export const PROGRAM_SOURCES = {
  basic: { vertex: vertexSource, fragment: basicFragmentSource, lit: false },
  lit: { vertex: vertexSource, fragment: litFragmentSource, lit: true },
} as const;
