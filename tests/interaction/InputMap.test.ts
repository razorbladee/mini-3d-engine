import { describe, expect, it } from 'vitest';
import { InputMap } from '../../src';

/** AUDIT-TZ P1-9: wasPressed() latches forever because nobody calls endFrame(). */

function keyEvent(type: 'keydown' | 'keyup', key: string) {
  return Object.assign(new Event(type), { key });
}

describe('InputMap', () => {
  it('reports a held key as down', () => {
    const target = new EventTarget();
    const input = new InputMap(target);
    const jump = input.bind('jump', [' ']);

    expect(jump.isDown()).toBe(false);
    target.dispatchEvent(keyEvent('keydown', ' '));
    expect(jump.isDown()).toBe(true);
    target.dispatchEvent(keyEvent('keyup', ' '));
    expect(jump.isDown()).toBe(false);
    input.dispose();
  });

  it('matches any key bound to the action', () => {
    const target = new EventTarget();
    const input = new InputMap(target);
    const jump = input.bind('jump', [' ', 'ArrowUp']);
    target.dispatchEvent(keyEvent('keydown', 'ArrowUp'));
    expect(jump.isDown()).toBe(true);
    input.dispose();
  });

  it('clears the pressed edge at the end of the frame', () => {
    const target = new EventTarget();
    const input = new InputMap(target);
    const jump = input.bind('jump', [' ']);

    target.dispatchEvent(keyEvent('keydown', ' '));
    expect(jump.wasPressed()).toBe(true);
    input.endFrame();
    expect(jump.wasPressed()).toBe(false);
    input.dispose();
  });

  it('does not latch the pressed edge after the key is released', () => {
    const target = new EventTarget();
    const input = new InputMap(target);
    const jump = input.bind('jump', [' ']);

    target.dispatchEvent(keyEvent('keydown', ' '));
    target.dispatchEvent(keyEvent('keyup', ' '));
    input.endFrame();

    expect(jump.wasPressed()).toBe(false);
    expect(jump.isDown()).toBe(false);
    input.dispose();
  });

  it('does not re-fire the pressed edge while the key stays down', () => {
    const target = new EventTarget();
    const input = new InputMap(target);
    const jump = input.bind('jump', [' ']);

    target.dispatchEvent(keyEvent('keydown', ' '));
    input.endFrame();
    target.dispatchEvent(keyEvent('keydown', ' ')); // OS key repeat
    expect(jump.wasPressed()).toBe(false);
    input.dispose();
  });

  it('returns a stable action object for repeated binds', () => {
    const input = new InputMap(new EventTarget());
    expect(input.bind('jump', [' '])).toBe(input.bind('jump', [' ']));
    input.dispose();
  });

  it('stops observing after dispose', () => {
    const target = new EventTarget();
    const input = new InputMap(target);
    const jump = input.bind('jump', [' ']);
    input.dispose();
    target.dispatchEvent(keyEvent('keydown', ' '));
    expect(jump.isDown()).toBe(false);
  });
});
