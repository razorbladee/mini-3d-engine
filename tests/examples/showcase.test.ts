import { describe, expect, it } from 'vitest';
import { examples, nextExample, type ExampleId } from '../../examples/showcase-registry';
import { nextIndex, pointerToNdc } from '../../examples/showcase-utils';

/**
 * AUDIT-TZ T-4: the previous test asserted `toHaveLength(17)` against a registry
 * of 21 entries. A hard-coded count breaks on every addition while proving
 * nothing. These assert structural invariants instead.
 */

describe('example registry', () => {
  it('is not empty', () => {
    expect(examples.length).toBeGreaterThan(0);
  });

  it('has unique ids', () => {
    const ids = examples.map((example) => example.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every entry non-empty metadata', () => {
    for (const example of examples) {
      expect(example.title.trim()).not.toBe('');
      expect(example.summary.trim()).not.toBe('');
      expect(example.hint.trim()).not.toBe('');
      expect(example.group.trim()).not.toBe('');
    }
  });

  it('assigns every entry to a group that the sidebar can render', () => {
    // renderNav derives its sections from the distinct groups, so each group must
    // be non-empty and every entry must belong to exactly one of them.
    const groups = [...new Set(examples.map((example) => example.group))];
    expect(groups.length).toBeGreaterThan(0);
    const grouped = groups.flatMap((group) => examples.filter((example) => example.group === group));
    expect(grouped).toHaveLength(examples.length);
  });

  it('cycles through every entry exactly once before repeating', () => {
    const visited: ExampleId[] = [examples[0].id];
    let current = examples[0].id;
    for (let step = 0; step < examples.length - 1; step += 1) {
      current = nextExample(current);
      visited.push(current);
    }
    expect(new Set(visited).size).toBe(examples.length);
    expect(nextExample(current)).toBe(examples[0].id);
  });

  it('advances to the immediately following entry', () => {
    expect(nextExample(examples[0].id)).toBe(examples[1].id);
  });
});

describe('pointerToNdc', () => {
  const rect = { left: 100, top: 50, width: 400, height: 200 };

  it('maps the centre of the target to the origin', () => {
    expect(pointerToNdc(300, 150, rect)).toEqual({ x: 0, y: 0 });
  });

  it('maps the corners to the unit square', () => {
    expect(pointerToNdc(100, 50, rect)).toEqual({ x: -1, y: 1 });
    expect(pointerToNdc(500, 250, rect)).toEqual({ x: 1, y: -1 });
  });

  it('never yields negative zero', () => {
    const { x, y } = pointerToNdc(300, 150, rect);
    expect(Object.is(x, -0)).toBe(false);
    expect(Object.is(y, -0)).toBe(false);
  });

  it('extrapolates outside the target', () => {
    expect(pointerToNdc(700, 150, rect).x).toBeCloseTo(2, 6);
  });

  it('rejects zero-sized targets', () => {
    expect(() => pointerToNdc(0, 0, { left: 0, top: 0, width: 0, height: 10 })).toThrow('positive size');
    expect(() => pointerToNdc(0, 0, { left: 0, top: 0, width: 10, height: 0 })).toThrow('positive size');
  });
});

describe('nextIndex', () => {
  it('cycles deterministically', () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(2, 3)).toBe(0);
  });

  it('rejects an empty or invalid collection', () => {
    expect(() => nextIndex(0, 0)).toThrow('must not be empty');
    expect(() => nextIndex(0, 2.5)).toThrow('must not be empty');
  });
});
