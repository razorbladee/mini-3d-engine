import { describe, expect, it } from 'vitest';
import {
  AmbientLight,
  BasicMaterial,
  BoxGeometry,
  DirectionalLight,
  Mesh,
  PerspectiveCamera,
  Scene,
  StandardMaterial,
  WebGLRenderer,
} from '../../src';
import { basicFragmentSource, litFragmentSource, vertexSource } from '../../src/rendering/shaders';
import { createFakeCanvas, createFakeGL, declaredUniformNames } from '../helpers/fakeGL';

/** AUDIT-TZ T-7: the renderer, the largest module, had no coverage whatsoever. */

function setup(options: { declaredUniforms?: string[] } = {}) {
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

  it('compiles a basic and a lit program', () => {
    const { gl } = setup();
    expect(gl.__live('program')).toHaveLength(2);
  });

  it('applies device pixel ratio to the drawing buffer', () => {
    const { gl, renderer } = setup();
    renderer.setSize(400, 300, 2);
    expect(renderer.canvas.width).toBe(800);
    expect(renderer.canvas.height).toBe(600);
    expect(gl).toBeDefined();
  });

  it('never sizes the drawing buffer to zero', () => {
    const { renderer } = setup();
    renderer.setSize(0, 0, 1);
    expect(renderer.canvas.width).toBeGreaterThanOrEqual(1);
    expect(renderer.canvas.height).toBeGreaterThanOrEqual(1);
  });
});

describe('WebGLRenderer uniform lookups', () => {
  // AUDIT-TZ P1-1: uniform names are guessed by substring, producing
  // 'uAmbientColor[0]' for a non-array uniform. Fails until stage 5.
  it('only requests uniforms that the shaders declare', () => {
    const { gl } = setup({ declaredUniforms: allShaderUniforms });
    const requested = [...new Set(gl.__uniformLookups)];
    expect(requested.filter((name) => !allShaderUniforms.includes(name))).toEqual([]);
  });

  it('resolves every uniform it looks up', () => {
    const { gl } = setup({ declaredUniforms: allShaderUniforms });
    const unresolved = [...new Set(gl.__uniformLookups)].filter((name) => !allShaderUniforms.includes(name));
    expect(unresolved).toEqual([]);
  });

  it('feeds ambient light into the lit program', () => {
    const { gl, renderer, scene, camera } = setup({ declaredUniforms: allShaderUniforms });
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

describe('WebGLRenderer draw pass', () => {
  it('draws every visible mesh once', () => {
    const { gl, renderer, scene, camera } = setup();
    for (let i = 0; i < 3; i += 1) {
      const mesh = new Mesh(new BoxGeometry(1), new BasicMaterial());
      mesh.position.z = -2 - i;
      scene.add(mesh);
    }
    renderer.render(scene, camera);
    expect(gl.__draws).toHaveLength(3);
  });

  it('skips invisible meshes', () => {
    const { gl, renderer, scene, camera } = setup();
    const mesh = new Mesh(new BoxGeometry(1), new BasicMaterial());
    mesh.visible = false;
    scene.add(mesh);
    renderer.render(scene, camera);
    expect(gl.__draws).toHaveLength(0);
  });

  it('draws the full vertex count of the geometry', () => {
    const { gl, renderer, scene, camera } = setup();
    const geometry = new BoxGeometry(1);
    scene.add(new Mesh(geometry, new BasicMaterial()));
    renderer.render(scene, camera);
    expect(gl.__draws[0].count).toBe(geometry.positions.length / 3);
  });

  it('renders transparent meshes after opaque ones with depth writes disabled', () => {
    const { gl, renderer, scene, camera } = setup();
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
    const { gl, renderer, scene, camera } = setup();
    scene.add(new Mesh(new BoxGeometry(1), new BasicMaterial({ doubleSided: true })));
    renderer.render(scene, camera);
    expect(gl.__draws[0].cullFace).toBe(false);
  });

  it('selects the lit program for standard materials', () => {
    const { gl, renderer, scene, camera } = setup();
    scene.add(new Mesh(new BoxGeometry(1), new BasicMaterial()));
    scene.add(new Mesh(new BoxGeometry(1), new StandardMaterial()));
    scene.add(new DirectionalLight());
    renderer.render(scene, camera);
    const programs = new Set(gl.__draws.map((draw) => draw.program?.id));
    expect(programs.size).toBe(2);
  });

  it('uploads geometry buffers once across repeated frames', () => {
    const { gl, renderer, scene, camera } = setup();
    scene.add(new Mesh(new BoxGeometry(1), new BasicMaterial()));
    renderer.render(scene, camera);
    const afterFirst = gl.__live('buffer').length;
    renderer.render(scene, camera);
    renderer.render(scene, camera);
    expect(gl.__live('buffer')).toHaveLength(afterFirst);
  });

  it('restores depth writes after a transparent pass', () => {
    const { gl, renderer, scene, camera } = setup();
    scene.add(new Mesh(new BoxGeometry(1), new BasicMaterial({ opacity: 0.5 })));
    renderer.render(scene, camera);
    expect(gl.isEnabled(gl.BLEND)).toBe(false);
  });
});

describe('WebGLRenderer resource ownership', () => {
  // AUDIT-TZ P1-6: dispose() only deletes programs, leaking every VBO. The
  // showcase disposes an engine per scene switch. Fails until stage 5.
  it('releases every GPU resource it created on dispose', () => {
    const { gl, renderer, scene, camera } = setup();
    for (let i = 0; i < 4; i += 1) scene.add(new Mesh(new BoxGeometry(1), new BasicMaterial()));
    renderer.render(scene, camera);

    renderer.dispose();

    expect(gl.__live()).toEqual([]);
  });
});
