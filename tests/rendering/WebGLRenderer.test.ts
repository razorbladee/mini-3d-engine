import { describe, expect, it } from 'vitest';
import {
  AmbientLight,
  SpotLight,
  BasicMaterial,
  BoxGeometry,
  DirectionalLight,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  StandardMaterial,
  Texture2D,
  WebGLRenderer,
} from '../../src';
import { basicFragmentSource, litFragmentSource, vertexSource } from '../../src/rendering/shaders';
import { createFakeCanvas, createFakeGL, declaredUniformNames } from '../helpers/fakeGL';

/** AUDIT-TZ T-7: the renderer, the largest module, had no coverage whatsoever. */

function setupRenderer(options: { declaredUniforms?: string[] } = {}) {
  const gl = createFakeGL(options);
  const canvas = createFakeCanvas(gl);
  const renderer = new WebGLRenderer(canvas);
  const scene = new Scene();
  const camera = new PerspectiveCamera(60, 1);
  camera.position.z = 5;
  return { gl, renderer, scene, camera };
}

const allShaderUniforms = [
  ...new Set([
    ...declaredUniformNames(vertexSource),
    ...declaredUniformNames(basicFragmentSource),
    ...declaredUniformNames(litFragmentSource),
  ]),
];

describe('WebGLRenderer setup', () => {
  it('fails with a clear message when WebGL2 is unavailable', () => {
    const canvas = { getContext: () => null, style: {} } as unknown as HTMLCanvasElement;
    expect(() => new WebGLRenderer(canvas)).toThrow('WebGL2');
  });

  it('compiles basic, lit and shadow-depth programs', () => {
    const { gl } = setupRenderer();
    expect(gl.__live('program')).toHaveLength(3);
  });

  it('applies device pixel ratio to the drawing buffer', () => {
    const { gl, renderer } = setupRenderer();
    renderer.setSize(400, 300, 2);
    expect(renderer.canvas.width).toBe(800);
    expect(renderer.canvas.height).toBe(600);
    expect(gl).toBeDefined();
  });

  it('never sizes the drawing buffer to zero', () => {
    const { renderer } = setupRenderer();
    renderer.setSize(0, 0, 1);
    expect(renderer.canvas.width).toBeGreaterThanOrEqual(1);
    expect(renderer.canvas.height).toBeGreaterThanOrEqual(1);
  });
});

describe('WebGLRenderer uniform lookups', () => {
  // AUDIT-TZ P1-1: uniform names are guessed by substring, producing
  // 'uAmbientColor[0]' for a non-array uniform. Fails until stage 5.
  it('only requests uniforms that the shaders declare', () => {
    const { gl } = setupRenderer({ declaredUniforms: allShaderUniforms });
    const requested = [...new Set(gl.__uniformLookups)];
    expect(requested.filter((name) => !allShaderUniforms.includes(name))).toEqual([]);
  });

  it('resolves every uniform it looks up', () => {
    const { gl } = setupRenderer({ declaredUniforms: allShaderUniforms });
    const unresolved = [...new Set(gl.__uniformLookups)].filter((name) => !allShaderUniforms.includes(name));
    expect(unresolved).toEqual([]);
  });

  it('feeds ambient light into the lit program', () => {
    const { gl, renderer, scene, camera } = setupRenderer({ declaredUniforms: allShaderUniforms });
    scene.add(new AmbientLight('#ffffff', 0.5));
    const mesh = new Mesh(new BoxGeometry(1), new StandardMaterial());
    mesh.position.z = -5;
    scene.add(mesh);

    renderer.render(scene, camera);

    const ambient = gl.__uniformWrites.find((write) => write.name === 'uAmbientColor');
    expect(ambient).toBeDefined();
    expect(Array.from(ambient!.value as ArrayLike<number>)).toEqual([0.5, 0.5, 0.5]);
  });
});

describe('WebGLRenderer spot lights', () => {
  // AUDIT-TZ P2-4: spot lights were pushed into the directional array, throwing
  // away position, angle, penumbra and distance.
  function litScene() {
    const setup = setupRenderer({ declaredUniforms: allShaderUniforms });
    const mesh = new Mesh(new BoxGeometry(1), new StandardMaterial());
    mesh.position.z = -5;
    setup.scene.add(mesh);
    return setup;
  }

  it('uploads spot lights separately from directional ones', () => {
    const { gl, renderer, scene, camera } = litScene();
    const spot = new SpotLight('#ffffff', 2);
    spot.position.set(1, 4, 2);
    scene.add(spot);
    scene.add(new DirectionalLight('#ffffff', 1));

    renderer.render(scene, camera);

    const spotCount = gl.__uniformWrites.findLast((w) => w.name === 'uSpotCount');
    const directionalCount = gl.__uniformWrites.findLast((w) => w.name === 'uDirectionalCount');
    expect(spotCount?.value).toBe(1);
    expect(directionalCount?.value).toBe(1);
  });

  it('passes the spot world position to the shader', () => {
    const { gl, renderer, scene, camera } = litScene();
    const spot = new SpotLight('#ffffff', 1);
    spot.position.set(1, 4, 2);
    scene.add(spot);

    renderer.render(scene, camera);

    const position = gl.__uniformWrites.findLast((w) => w.name === 'uSpotPosition[0]');
    expect(Array.from(position!.value as ArrayLike<number>).slice(0, 3)).toEqual([1, 4, 2]);
  });

  it('passes the cone angle as a cosine', () => {
    const { gl, renderer, scene, camera } = litScene();
    const spot = new SpotLight('#ffffff', 1);
    spot.angle = Math.PI / 4;
    spot.penumbra = 0.5;
    scene.add(spot);

    renderer.render(scene, camera);

    const cosAngle = gl.__uniformWrites.findLast((w) => w.name === 'uSpotCosAngle[0]');
    const penumbra = gl.__uniformWrites.findLast((w) => w.name === 'uSpotPenumbra[0]');
    expect((cosAngle!.value as Float32Array)[0]).toBeCloseTo(Math.cos(Math.PI / 4), 5);
    expect((penumbra!.value as Float32Array)[0]).toBeCloseTo(0.5, 5);
  });

  it('reports no spot lights when the scene has none', () => {
    const { gl, renderer, scene, camera } = litScene();
    renderer.render(scene, camera);
    expect(gl.__uniformWrites.findLast((w) => w.name === 'uSpotCount')?.value).toBe(0);
  });
});

describe('WebGLRenderer draw pass', () => {
  it('uses a configurable canvas clear colour', () => {
    const { gl, renderer, scene, camera } = setupRenderer();
    renderer.setClearColor('#87b8d8').render(scene, camera);
    expect(gl.__clearColor?.[0]).toBeCloseTo(0x87 / 255, 6);
    expect(gl.__clearColor?.[1]).toBeCloseTo(0xb8 / 255, 6);
    expect(gl.__clearColor?.[2]).toBeCloseTo(0xd8 / 255, 6);
    expect(gl.__clearColor?.[3]).toBe(1);
  });

  it('compiles and reuses custom shader programs and uploads uniforms', () => {
    const { gl, renderer, scene, camera } = setupRenderer();
    const detail = Texture2D.fromImage({ width: 2, height: 2 } as HTMLImageElement);
    const material = new ShaderMaterial({
      vertexShader:
        '#version 300 es\nin vec3 position; uniform mat4 uModel; uniform mat4 uView; uniform mat4 uProjection; void main(){ gl_Position=uProjection*uView*uModel*vec4(position,1.0); }',
      fragmentShader:
        '#version 300 es\nprecision highp float; uniform vec4 uColor; uniform float uTime; out vec4 outColor; void main(){ outColor=uColor+vec4(uTime*0.0); }',
      uniforms: { uTime: 1.5, uDetailMap: detail },
    });
    scene.add(new Mesh(new BoxGeometry(1), material), new Mesh(new BoxGeometry(1), material));
    renderer.render(scene, camera);
    expect(gl.__live('program')).toHaveLength(4);
    expect(gl.__live('texture')).toHaveLength(1);
    expect(gl.__uniformWrites.findLast((write) => write.name === 'uTime')?.value).toBe(1.5);
    expect(gl.__uniformWrites.findLast((write) => write.name === 'uDetailMap')?.value).toBe(2);
  });

  it('renders a depth pass and enables shadow sampling for a shadow-casting sun', () => {
    const { gl, renderer, scene, camera } = setupRenderer();
    const sun = new DirectionalLight();
    sun.castShadow = true;
    sun.shadowMapSize = 256;
    scene.add(sun, new Mesh(new BoxGeometry(1), new StandardMaterial()));
    renderer.render(scene, camera);
    expect(gl.__live('framebuffer')).toHaveLength(1);
    expect(gl.__draws).toHaveLength(2);
    expect(gl.__uniformWrites.findLast((write) => write.name === 'uShadowEnabled')?.value).toBe(1);
  });

  it('renders double-sided foliage into the shadow map without culling', () => {
    const { gl, renderer, scene, camera } = setupRenderer();
    const sun = new DirectionalLight();
    sun.castShadow = true;
    scene.add(sun, new Mesh(new BoxGeometry(1), new StandardMaterial({ doubleSided: true })));
    renderer.render(scene, camera);
    expect(gl.__draws[0].cullFace).toBe(false);
  });

  it('lets a receiving mesh opt out of shadows', () => {
    const { gl, renderer, scene, camera } = setupRenderer();
    const sun = new DirectionalLight();
    sun.castShadow = true;
    const mesh = new Mesh(new BoxGeometry(1), new StandardMaterial());
    mesh.receiveShadow = false;
    scene.add(sun, mesh);
    renderer.render(scene, camera);
    expect(gl.__uniformWrites.findLast((write) => write.name === 'uShadowEnabled')?.value).toBe(0);
  });

  it('draws every visible mesh once', () => {
    const { gl, renderer, scene, camera } = setupRenderer();
    for (let i = 0; i < 3; i += 1) {
      const mesh = new Mesh(new BoxGeometry(1), new BasicMaterial());
      mesh.position.z = -2 - i;
      scene.add(mesh);
    }
    renderer.render(scene, camera);
    expect(gl.__draws).toHaveLength(3);
  });

  it('skips invisible meshes', () => {
    const { gl, renderer, scene, camera } = setupRenderer();
    const mesh = new Mesh(new BoxGeometry(1), new BasicMaterial());
    mesh.visible = false;
    scene.add(mesh);
    renderer.render(scene, camera);
    expect(gl.__draws).toHaveLength(0);
  });

  it('draws the full vertex count of the geometry', () => {
    const { gl, renderer, scene, camera } = setupRenderer();
    const geometry = new BoxGeometry(1);
    scene.add(new Mesh(geometry, new BasicMaterial()));
    renderer.render(scene, camera);
    expect(gl.__draws[0].count).toBe(geometry.positions.length / 3);
  });

  it('renders wireframe materials as one line loop per triangle', () => {
    const { gl, renderer, scene, camera } = setupRenderer();
    const geometry = new BoxGeometry(1);
    scene.add(new Mesh(geometry, new BasicMaterial({ wireframe: true })));
    renderer.render(scene, camera);
    expect(gl.__draws).toHaveLength(geometry.vertexCount / 3);
    expect(gl.__draws.every((draw) => draw.mode === gl.LINE_LOOP)).toBe(true);
  });

  it('renders transparent meshes after opaque ones with depth writes disabled', () => {
    const { gl, renderer, scene, camera } = setupRenderer();
    const opaque = new Mesh(new BoxGeometry(1), new BasicMaterial());
    const transparent = new Mesh(new BoxGeometry(1), new BasicMaterial({ opacity: 0.4 }));
    opaque.position.z = -3;
    transparent.position.z = -2;
    scene.add(transparent, opaque);

    renderer.render(scene, camera);

    expect(gl.__draws).toHaveLength(2);
    expect(gl.__draws[0].blend).toBe(false);
    expect(gl.__draws[0].depthMask).toBe(true);
    expect(gl.__draws[1].blend).toBe(true);
    expect(gl.__draws[1].depthMask).toBe(false);
  });

  it('disables face culling for double-sided materials', () => {
    const { gl, renderer, scene, camera } = setupRenderer();
    scene.add(new Mesh(new BoxGeometry(1), new BasicMaterial({ doubleSided: true })));
    renderer.render(scene, camera);
    expect(gl.__draws[0].cullFace).toBe(false);
  });

  it('selects the lit program for standard materials', () => {
    const { gl, renderer, scene, camera } = setupRenderer();
    scene.add(new Mesh(new BoxGeometry(1), new BasicMaterial()));
    scene.add(new Mesh(new BoxGeometry(1), new StandardMaterial()));
    scene.add(new DirectionalLight());
    renderer.render(scene, camera);
    const programs = new Set(gl.__draws.map((draw) => draw.program?.id));
    expect(programs.size).toBe(2);
  });

  it('uploads geometry buffers once across repeated frames', () => {
    const { gl, renderer, scene, camera } = setupRenderer();
    scene.add(new Mesh(new BoxGeometry(1), new BasicMaterial()));
    renderer.render(scene, camera);
    const afterFirst = gl.__live('buffer').length;
    renderer.render(scene, camera);
    renderer.render(scene, camera);
    expect(gl.__live('buffer')).toHaveLength(afterFirst);
  });

  it('restores depth writes after a transparent pass', () => {
    const { gl, renderer, scene, camera } = setupRenderer();
    scene.add(new Mesh(new BoxGeometry(1), new BasicMaterial({ opacity: 0.5 })));
    renderer.render(scene, camera);
    expect(gl.isEnabled(gl.BLEND)).toBe(false);
  });
});

describe('WebGLRenderer resource ownership', () => {
  // AUDIT-TZ P1-6: dispose() only deletes programs, leaking every VBO. The
  // showcase disposes an engine per scene switch. Fails until stage 5.
  it('releases every GPU resource it created on dispose', () => {
    const { gl, renderer, scene, camera } = setupRenderer();
    for (let i = 0; i < 4; i += 1) scene.add(new Mesh(new BoxGeometry(1), new BasicMaterial()));
    const sun = new DirectionalLight();
    sun.castShadow = true;
    scene.add(sun);
    renderer.render(scene, camera);

    renderer.dispose();

    expect(gl.__live()).toEqual([]);
  });
});
