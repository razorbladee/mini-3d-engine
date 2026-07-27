// @vitest-environment node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { examples } from '../../examples/showcase-registry';

/**
 * AUDIT-TZ T-4 / P3-4.
 *
 * The registry advertises entries that `build()` never handles: 'cameras',
 * 'texture' and 'postprocess' fall through to a 2D canvas placeholder that has
 * nothing to do with their titles, despite the last commit claiming every entry
 * routes to its own scene.
 *
 * showcase.ts runs DOM setup at import time, so this asserts against the source
 * text rather than importing the module. Expected to fail until stage 7.
 */

const source = readFileSync(fileURLToPath(new URL('../../examples/showcase.ts', import.meta.url)), 'utf8');

const functionBody = (name: string) => {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`${name}() not found in showcase.ts`);
  const next = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, next < 0 ? undefined : next);
};

const buildBody = (() => {
  const start = source.indexOf('function build(');
  if (start < 0) throw new Error('build() not found in showcase.ts');
  const next = source.indexOf('\nfunction ', start + 1);
  return source.slice(start, next < 0 ? undefined : next);
})();

describe('showcase scene coverage', () => {
  it.each(examples.map((example) => ({ id: example.id, title: example.title })))(
    'routes "$title" ($id) to a dedicated scene',
    ({ id }) => {
      expect(buildBody).toContain(`'${id}'`);
    },
  );

  it('reports the scene count from the registry rather than hard-coding it', () => {
    const hardCoded = source.match(/WebGL2\s*·\s*(\d+)\s*scenes/);
    if (hardCoded) expect(Number(hardCoded[1])).toBe(examples.length);
  });
});

describe('featured low-poly forest', () => {
  const forest = functionBody('lowPolyForest');

  it('is the first example', () => {
    expect(examples[0].id).toBe('low-poly-forest');
  });

  it('builds every requested environment layer procedurally', () => {
    expect(forest).toContain('terrainPositions');
    expect(forest).toContain('treePositions');
    expect(forest).toContain('grassGeometry');
    expect(forest).toContain('shrubPositions');
    expect(forest).toContain('addLog');
    expect(forest).toContain('stumpGeometry');
    expect(forest).toContain('cliffPieces');
    expect(forest).toContain('cloudGeometry');
    expect(forest).toContain("name = 'Low-poly pond'");
  });

  it('builds the shader comparison from the identical scene function', () => {
    expect(buildBody).toContain("if (id === 'shader-forest') return lowPolyForest(true)");
    expect(source).toContain('const forestVertexShader');
    expect(source).toContain('const forestFragmentShader');
    expect(forest).toContain('new ShaderMaterial');
  });

  it('does not load external models or textures', () => {
    expect(forest).not.toContain('GLTFLoader');
    expect(forest).not.toContain('Texture2D.load');
    expect(forest).not.toContain('models.');
  });
});
