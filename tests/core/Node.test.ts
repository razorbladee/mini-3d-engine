import { describe, expect, it } from 'vitest';
import { Matrix4, Node } from '../../src';

describe('Node hierarchy', () => {
  it('adds and removes children, maintaining parent links', () => {
    const parent = new Node();
    const child = new Node();
    parent.add(child);
    expect(child.parent).toBe(parent);
    expect(parent.children).toContain(child);

    parent.remove(child);
    expect(child.parent).toBeNull();
    expect(parent.children).not.toContain(child);
  });

  it('reparents a node instead of listing it under two parents', () => {
    const first = new Node();
    const second = new Node();
    const child = new Node();
    first.add(child);
    second.add(child);
    expect(first.children).toHaveLength(0);
    expect(second.children).toEqual([child]);
    expect(child.parent).toBe(second);
  });

  it('ignores removal of a node that is not a child', () => {
    const parent = new Node();
    const stranger = new Node();
    expect(() => parent.remove(stranger)).not.toThrow();
    expect(stranger.parent).toBeNull();
  });

  it('prevents cyclic scene graphs', () => {
    const parent = new Node();
    const child = new Node();
    parent.add(child);
    expect(() => child.add(parent)).toThrow('cyclic');
    expect(() => parent.add(parent)).toThrow('cyclic');
  });

  it('prevents indirect cycles across several levels', () => {
    const a = new Node();
    const b = new Node();
    const c = new Node();
    a.add(b);
    b.add(c);
    expect(() => c.add(a)).toThrow('cyclic');
  });

  it('traverses depth-first including itself', () => {
    const root = new Node();
    root.name = 'root';
    const left = new Node();
    left.name = 'left';
    const leftChild = new Node();
    leftChild.name = 'left-child';
    const right = new Node();
    right.name = 'right';
    left.add(leftChild);
    root.add(left, right);

    const visited: string[] = [];
    root.traverse((node) => visited.push(node.name));
    expect(visited).toEqual(['root', 'left', 'left-child', 'right']);
  });
});

describe('Node world matrices', () => {
  it('propagates rotated parent transforms', () => {
    const parent = new Node();
    parent.rotation.z = Math.PI / 2;
    const child = new Node();
    child.position.x = 2;
    parent.add(child).updateWorldMatrix();
    expect(child.worldMatrix.elements[12]).toBeCloseTo(0, 5);
    expect(child.worldMatrix.elements[13]).toBeCloseTo(2, 5);
  });

  it('accumulates translation through three levels', () => {
    const a = new Node();
    a.position.set(1, 0, 0);
    const b = new Node();
    b.position.set(0, 2, 0);
    const c = new Node();
    c.position.set(0, 0, 3);
    a.add(b);
    b.add(c);
    a.updateWorldMatrix();
    const e = c.worldMatrix.elements;
    expect([e[12], e[13], e[14]]).toEqual([1, 2, 3]);
  });

  it('applies parent scale to child offsets', () => {
    const parent = new Node();
    parent.scale.set(2, 2, 2);
    const child = new Node();
    child.position.set(1, 0, 0);
    parent.add(child).updateWorldMatrix();
    expect(child.worldMatrix.elements[12]).toBeCloseTo(2, 6);
  });

  it('honours matrixOverride instead of TRS', () => {
    const node = new Node();
    node.position.set(5, 5, 5);
    const override = new Matrix4();
    override.elements[12] = 7;
    node.matrixOverride = override.elements;
    node.updateWorldMatrix();
    expect(node.worldMatrix.elements[12]).toBe(7);
  });
});
