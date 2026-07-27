/**
 * Accounting fake of WebGL2RenderingContext.
 *
 * Real WebGL is unavailable in jsdom, which is why WebGLRenderer had zero test
 * coverage despite being the largest and most defect-dense module (AUDIT-TZ T-3).
 *
 * This double records every resource create/delete, every uniform lookup and
 * every draw call, so tests can assert on:
 *   - uniform names actually requested vs. names declared in the shader (P1-1)
 *   - resource leaks: create* calls vs. delete* calls (P1-6)
 *   - draw order and per-draw GL state (P2-6)
 */

export type GLResource = { id: number; kind: string; deleted: boolean };

export type DrawRecord = {
  mode: number;
  first: number;
  count: number;
  blend: boolean;
  cullFace: boolean;
  depthMask: boolean;
  program: GLResource | null;
};

export type FakeGL = WebGL2RenderingContext & {
  __resources: GLResource[];
  __uniformLookups: string[];
  __attribLookups: string[];
  __draws: DrawRecord[];
  __uniformWrites: { name: string; value: unknown }[];
  /** Uniform names the fake pretends exist; lookups outside this set return null, like real GL. */
  __declaredUniforms: Set<string> | null;
  __live(kind?: string): GLResource[];
  __shaderSources: string[];
  __texParams: { name: number; value: number }[];
  __pixelStore: { name: number; value: number }[];
  __mipmapCount: number;
  __clearColor: [number, number, number, number] | null;
};

const GL_CONSTANTS: Record<string, number> = {
  DEPTH_TEST: 0x0b71,
  CULL_FACE: 0x0b44,
  BLEND: 0x0be2,
  LESS: 0x0201,
  CCW: 0x0901,
  LINE_LOOP: 0x0002,
  TRIANGLES: 0x0004,
  ARRAY_BUFFER: 0x8892,
  ELEMENT_ARRAY_BUFFER: 0x8893,
  STATIC_DRAW: 0x88e4,
  FLOAT: 0x1406,
  TEXTURE_2D: 0x0de1,
  TEXTURE0: 0x84c0,
  TEXTURE1: 0x84c1,
  RGBA: 0x1908,
  DEPTH_COMPONENT: 0x1902,
  DEPTH_COMPONENT24: 0x81a6,
  UNSIGNED_BYTE: 0x1401,
  UNSIGNED_INT: 0x1405,
  FRAMEBUFFER: 0x8d40,
  DEPTH_ATTACHMENT: 0x8d00,
  FRAMEBUFFER_COMPLETE: 0x8cd5,
  NONE: 0,
  TEXTURE_WRAP_S: 0x2802,
  TEXTURE_WRAP_T: 0x2803,
  TEXTURE_MIN_FILTER: 0x2801,
  TEXTURE_MAG_FILTER: 0x2800,
  CLAMP_TO_EDGE: 0x812f,
  REPEAT: 0x2901,
  MIRRORED_REPEAT: 0x8370,
  LINEAR: 0x2601,
  NEAREST: 0x2600,
  NEAREST_MIPMAP_NEAREST: 0x2700,
  LINEAR_MIPMAP_LINEAR: 0x2703,
  UNPACK_FLIP_Y_WEBGL: 0x9240,
  COLOR_BUFFER_BIT: 0x4000,
  DEPTH_BUFFER_BIT: 0x0100,
  VERTEX_SHADER: 0x8b31,
  FRAGMENT_SHADER: 0x8b30,
  COMPILE_STATUS: 0x8b81,
  LINK_STATUS: 0x8b82,
  SRC_ALPHA: 0x0302,
  ONE_MINUS_SRC_ALPHA: 0x0303,
};

export function createFakeGL(options: { declaredUniforms?: string[] } = {}): FakeGL {
  let nextId = 1;
  const resources: GLResource[] = [];
  const enabled = new Set<number>();
  let depthMask = true;
  let currentProgram: GLResource | null = null;

  const create = (kind: string): GLResource => {
    const resource = { id: nextId++, kind, deleted: false };
    resources.push(resource);
    return resource;
  };
  const destroy = (resource: GLResource | null) => {
    if (resource) resource.deleted = true;
  };

  const gl = {
    ...GL_CONSTANTS,

    __resources: resources,
    __uniformLookups: [] as string[],
    __attribLookups: [] as string[],
    __draws: [] as DrawRecord[],
    __uniformWrites: [] as { name: string; value: unknown }[],
    __shaderSources: [] as string[],
    __texParams: [] as { name: number; value: number }[],
    __pixelStore: [] as { name: number; value: number }[],
    __mipmapCount: 0,
    __clearColor: null as [number, number, number, number] | null,
    __declaredUniforms: options.declaredUniforms ? new Set(options.declaredUniforms) : null,
    __live(kind?: string) {
      return resources.filter((r) => !r.deleted && (kind === undefined || r.kind === kind));
    },

    createBuffer: () => create('buffer'),
    deleteBuffer: destroy,
    bindBuffer: () => {},
    bufferData: () => {},

    createTexture: () => create('texture'),
    deleteTexture: destroy,
    bindTexture: () => {},
    activeTexture: () => {},
    texParameteri: (_target: number, name: number, value: number) => {
      (gl as unknown as FakeGL).__texParams.push({ name, value });
    },
    texImage2D: () => {},
    generateMipmap: () => {
      (gl as unknown as FakeGL).__mipmapCount += 1;
    },
    pixelStorei: (name: number, value: number) => {
      (gl as unknown as FakeGL).__pixelStore.push({ name, value });
    },

    createFramebuffer: () => create('framebuffer'),
    deleteFramebuffer: destroy,
    bindFramebuffer: () => {},
    framebufferTexture2D: () => {},
    drawBuffers: () => {},
    readBuffer: () => {},
    checkFramebufferStatus: () => GL_CONSTANTS.FRAMEBUFFER_COMPLETE,

    createShader: () => create('shader'),
    deleteShader: destroy,
    shaderSource: (_shader: GLResource, source: string) => {
      (gl as unknown as FakeGL).__shaderSources.push(source);
    },
    compileShader: () => {},
    getShaderParameter: () => true,
    getShaderInfoLog: () => '',

    createProgram: () => create('program'),
    deleteProgram: destroy,
    attachShader: () => {},
    linkProgram: () => {},
    getProgramParameter: () => true,
    getProgramInfoLog: () => '',
    useProgram: (program: GLResource | null) => {
      currentProgram = program;
    },

    getAttribLocation: (_program: GLResource, name: string) => {
      (gl as unknown as FakeGL).__attribLookups.push(name);
      return 0;
    },
    getUniformLocation: (_program: GLResource, name: string) => {
      const self = gl as unknown as FakeGL;
      self.__uniformLookups.push(name);
      // Real GL returns null for names that are not active uniforms. Modelling
      // this is the whole point: it is how P1-1 stayed invisible in production.
      if (self.__declaredUniforms && !self.__declaredUniforms.has(name)) return null;
      return { id: nextId++, kind: 'uniform', deleted: false, name } as GLResource & { name: string };
    },

    enableVertexAttribArray: () => {},
    vertexAttribPointer: () => {},

    uniform1i: recordUniform,
    uniform1f: recordUniform,
    uniform1fv: recordUniform,
    uniform3fv: recordUniform,
    uniform4fv: recordUniform,
    uniformMatrix3fv: recordUniformMatrix,
    uniformMatrix4fv: recordUniformMatrix,

    enable: (cap: number) => enabled.add(cap),
    disable: (cap: number) => enabled.delete(cap),
    isEnabled: (cap: number) => enabled.has(cap),
    depthFunc: () => {},
    depthMask: (flag: boolean) => {
      depthMask = flag;
    },
    frontFace: () => {},
    clearDepth: () => {},
    clearColor: (r: number, g: number, b: number, a: number) => {
      gl.__clearColor = [r, g, b, a];
    },
    clear: () => {},
    viewport: () => {},
    blendFunc: () => {},

    drawArrays: (mode: number, first: number, count: number) => {
      (gl as unknown as FakeGL).__draws.push({
        mode,
        first,
        count,
        blend: enabled.has(GL_CONSTANTS.BLEND),
        cullFace: enabled.has(GL_CONSTANTS.CULL_FACE),
        depthMask,
        program: currentProgram,
      });
    },
  } as unknown as FakeGL;

  function recordUniform(location: unknown, value: unknown) {
    const name = (location as { name?: string } | null)?.name ?? '<null>';
    (gl as unknown as FakeGL).__uniformWrites.push({ name, value });
  }
  function recordUniformMatrix(location: unknown, _transpose: boolean, value: unknown) {
    const name = (location as { name?: string } | null)?.name ?? '<null>';
    (gl as unknown as FakeGL).__uniformWrites.push({ name, value });
  }

  return gl;
}

/** Canvas stub whose getContext('webgl2') yields the supplied fake context. */
export function createFakeCanvas(gl: FakeGL): HTMLCanvasElement {
  const canvas = {
    width: 300,
    height: 150,
    clientWidth: 800,
    clientHeight: 600,
    style: {} as CSSStyleDeclaration,
    getContext: (kind: string) => (kind === 'webgl2' ? gl : null),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) as DOMRect,
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  return canvas as unknown as HTMLCanvasElement;
}

/** Uniform names declared in a GLSL source, e.g. `uColor`, `uPointColor[0]`. */
export function declaredUniformNames(source: string): string[] {
  const names: string[] = [];
  const pattern = /uniform\s+\w+\s+(\w+)\s*(\[\s*\w+\s*\])?\s*;/g;
  for (let match = pattern.exec(source); match; match = pattern.exec(source)) {
    names.push(match[2] ? `${match[1]}[0]` : match[1]);
  }
  return names;
}
