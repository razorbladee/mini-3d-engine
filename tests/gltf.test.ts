import { describe, expect, it } from 'vitest';
import { GLTFLoader } from '../src';

describe('GLTF model visibility', () => {
  it('rejects an empty scene', async () => {
    const json = { scenes: [{ nodes: [0] }], nodes: [{ children: [] }], meshes: [], buffers: [] };
    await expect(new GLTFLoader().parseJson(json, new URL('https://example.com/'))).rejects.toThrow('no renderable meshes');
  });
});
