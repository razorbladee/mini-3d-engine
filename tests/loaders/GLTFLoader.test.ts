import { describe, expect, it } from 'vitest';
import { GLTFLoader, Mesh, type Node } from '../../src';

/** Consolidates the former gltf.test.ts and loader.test.ts, which duplicated a case verbatim. */

function dataUri(values: number[]) {
  const buffer = new ArrayBuffer(values.length * 4);
  const view = new DataView(buffer);
  values.forEach((value, index) => view.setFloat32(index * 4, value, true));
  const bytes = new Uint8Array(buffer);
  return `data:application/octet-stream;base64,${btoa(String.fromCharCode(...bytes))}`;
}

const TRIANGLE = [0, 0, 0, 1, 0, 0, 0, 1, 0];

/** Minimal single-triangle document; `overrides` are merged over the top. */
function triangleDocument(overrides: Record<string, unknown> = {}) {
  return {
    buffers: [{ uri: dataUri(TRIANGLE) }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: 36 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    nodes: [{ mesh: 0 }],
    scenes: [{ nodes: [0] }],
    scene: 0,
    ...overrides,
  };
}

const base = new URL('https://example.com/');
const load = (json: Record<string, unknown>) => new GLTFLoader().parseJson(json, base);

function countMeshes(root: Node) {
  let total = 0;
  root.traverse((node) => {
    if (node instanceof Mesh) total += 1;
  });
  return total;
}

describe('GLTFLoader validation', () => {
  it('rejects an invalid GLB header', async () => {
    await expect(new GLTFLoader().parseGlb(new ArrayBuffer(8))).rejects.toThrow('Invalid GLB header');
  });

  it('rejects a scene with no renderable meshes', async () => {
    await expect(load({ scenes: [{ nodes: [0] }], nodes: [{}], meshes: [], buffers: [] })).rejects.toThrow(
      'no renderable meshes',
    );
  });

  it('rejects a malformed node translation', async () => {
    await expect(load(triangleDocument({ nodes: [{ mesh: 0, translation: [1, 2] }] }))).rejects.toThrow('translation');
  });
});

describe('GLTFLoader geometry', () => {
  // AUDIT-TZ P0-2: `if (!prim.attributes?.POSITION)` treated accessor index 0,
  // the most common index in real files, as absent.
  it('accepts accessor index 0 for POSITION', async () => {
    const model = await load(triangleDocument());
    expect(countMeshes(model.scene)).toBe(1);
  });

  it('supports multiple primitives on one mesh', async () => {
    const json = triangleDocument({
      meshes: [{ primitives: [{ attributes: { POSITION: 0 } }, { attributes: { POSITION: 0 } }] }],
    });
    const model = await load(json);
    expect(countMeshes(model.scene)).toBe(2);
  });

  it('finds orphan mesh nodes that no scene references', async () => {
    const model = await load(triangleDocument({ scenes: [{ nodes: [] }] }));
    expect(countMeshes(model.scene)).toBe(1);
  });

  it('expands indexed primitives', async () => {
    const indexBuffer = new Uint16Array([0, 1, 2, 2, 1, 0]);
    const indexUri = `data:application/octet-stream;base64,${btoa(
      String.fromCharCode(...new Uint8Array(indexBuffer.buffer)),
    )}`;
    const json = {
      buffers: [{ uri: dataUri(TRIANGLE) }, { uri: indexUri }],
      bufferViews: [
        { buffer: 0, byteOffset: 0, byteLength: 36 },
        { buffer: 1, byteOffset: 0, byteLength: 12 },
      ],
      accessors: [
        { bufferView: 0, componentType: 5126, count: 3, type: 'VEC3' },
        { bufferView: 1, componentType: 5123, count: 6, type: 'SCALAR' },
      ],
      meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
      nodes: [{ mesh: 0 }],
      scenes: [{ nodes: [0] }],
      scene: 0,
    };
    const model = await load(json);
    let vertices = 0;
    model.scene.traverse((node) => {
      if (node instanceof Mesh) vertices += node.geometry.positions.length / 3;
    });
    expect(vertices).toBe(6);
  });

  it('reports bounds for the loaded model', async () => {
    const model = await load(triangleDocument());
    expect(model.bounds.radius).toBeGreaterThan(0);
    expect(model.bounds.center).toHaveLength(3);
    expect(model.bounds.center.every(Number.isFinite)).toBe(true);
  });

  it('exposes the animations array', async () => {
    const model = await load(triangleDocument({ animations: [{ name: 'idle' }] }));
    expect(model.animations).toHaveLength(1);
  });
});

describe('GLTFLoader node transforms', () => {
  it('applies a node matrix verbatim', async () => {
    const matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 6, 7, 1];
    const model = await load(triangleDocument({ nodes: [{ mesh: 0, matrix }] }));
    const meshHolder = model.scene.children[0];
    expect(Array.from(meshHolder.matrixOverride ?? [])).toEqual(matrix);
  });

  it('applies translation and scale', async () => {
    const json = triangleDocument({ nodes: [{ mesh: 0, translation: [1, 2, 3], scale: [2, 2, 2] }] });
    const model = await load(json);
    const holder = model.scene.children[0];
    expect([holder.position.x, holder.position.y, holder.position.z]).toEqual([1, 2, 3]);
    expect(holder.scale.x).toBe(2);
  });

  // AUDIT-TZ P1-5: the loader converts the quaternion with a ZYX formula and
  // stores it in an Euler that compose() interprets as XYZ. Fails until stage 3.
  it('applies a node rotation that matches the quaternion', async () => {
    const axis = [0.3, 0.5, -0.8];
    const length = Math.hypot(...axis);
    const angle = 1.1;
    const s = Math.sin(angle / 2) / length;
    const [x, y, z] = axis.map((value) => value * s);
    const w = Math.cos(angle / 2);

    const model = await load(triangleDocument({ nodes: [{ mesh: 0, rotation: [x, y, z, w] }] }));
    model.scene.updateWorldMatrix();
    const holder = model.scene.children[0];
    holder.updateWorldMatrix();
    const e = holder.localMatrix.elements;

    const expected = [
      1 - 2 * (y * y + z * z),
      2 * (x * y + z * w),
      2 * (x * z - y * w),
      2 * (x * y - z * w),
      1 - 2 * (x * x + z * z),
      2 * (y * z + x * w),
      2 * (x * z + y * w),
      2 * (y * z - x * w),
      1 - 2 * (x * x + y * y),
    ];
    const actual = [e[0], e[1], e[2], e[4], e[5], e[6], e[8], e[9], e[10]];
    actual.forEach((value, index) => expect(value).toBeCloseTo(expected[index], 5));
  });
});
