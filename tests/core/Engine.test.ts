import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Engine, PerspectiveCamera } from '../../src';
import { createFakeCanvas, createFakeGL, type FakeGL } from '../helpers/fakeGL';

/** AUDIT-TZ T-7: Engine had no lifecycle coverage at all. */

let gl: FakeGL;
let canvas: HTMLCanvasElement;
let frameCallbacks: FrameRequestCallback[];
let now: number;

beforeEach(() => {
  gl = createFakeGL();
  canvas = createFakeCanvas(gl);
  frameCallbacks = [];
  now = 0;

  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    frameCallbacks.push(callback);
    return frameCallbacks.length;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(performance, 'now').mockImplementation(() => now);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** Runs the most recently scheduled frame at the given timestamp. */
function advance(to: number) {
  now = to;
  const callback = frameCallbacks.pop();
  if (!callback) throw new Error('No frame was scheduled');
  callback(to);
}

describe('Engine lifecycle', () => {
  it('creates a renderer and a default camera', () => {
    const engine = new Engine({ canvas });
    expect(engine.renderer).toBeDefined();
    expect(engine.camera).toBeInstanceOf(PerspectiveCamera);
    engine.dispose();
  });

  it('accepts an injected camera', () => {
    const camera = new PerspectiveCamera(40, 2);
    const engine = new Engine({ canvas, camera });
    expect(engine.camera).toBe(camera);
    engine.dispose();
  });

  it('schedules frames and reports delta and elapsed time', () => {
    const engine = new Engine({ canvas });
    const times: { deltaTime: number; elapsed: number }[] = [];
    engine.start((time) => times.push(time));

    advance(16);
    advance(32);

    expect(times).toHaveLength(2);
    expect(times[0].deltaTime).toBeCloseTo(0.016, 5);
    expect(times[1].elapsed).toBeCloseTo(0.032, 5);
    engine.dispose();
  });

  it('clamps large frame gaps so a background tab cannot jump the simulation', () => {
    const engine = new Engine({ canvas });
    const deltas: number[] = [];
    engine.start(({ deltaTime }) => deltas.push(deltaTime));

    advance(5000);

    expect(deltas[0]).toBeLessThanOrEqual(0.1);
    engine.dispose();
  });

  it('ignores a second start while already running', () => {
    const engine = new Engine({ canvas });
    engine.start();
    const scheduled = frameCallbacks.length;
    engine.start();
    expect(frameCallbacks.length).toBe(scheduled);
    engine.dispose();
  });

  it('stops invoking the update callback after stop()', () => {
    const engine = new Engine({ canvas });
    const update = vi.fn();
    engine.start(update);
    advance(16);
    expect(update).toHaveBeenCalledTimes(1);

    engine.stop();
    const pending = frameCallbacks.pop();
    pending?.(32);
    expect(update).toHaveBeenCalledTimes(1);
    engine.dispose();
  });

  it('can restart after stop', () => {
    const engine = new Engine({ canvas });
    const update = vi.fn();
    engine.start(update);
    advance(16);
    engine.stop();
    engine.start(update);
    advance(48);
    expect(update).toHaveBeenCalledTimes(2);
    engine.dispose();
  });

  it('updates the camera aspect ratio on resize', () => {
    const engine = new Engine({ canvas });
    const camera = engine.camera as PerspectiveCamera;
    engine.resize();
    expect(camera.aspect).toBeCloseTo(800 / 600, 5);
    engine.dispose();
  });

  it('accepts an alternative renderer backend', () => {
    // AUDIT-TZ P2-1: Engine used to construct WebGLRenderer itself and type the
    // field concretely, so the swappable backend was impossible.
    const calls: string[] = [];
    const fake = {
      canvas,
      setSize: () => calls.push('setSize'),
      render: () => calls.push('render'),
      dispose: () => calls.push('dispose'),
    };
    const engine = new Engine({ canvas, createRenderer: () => fake });
    expect(engine.renderer).toBe(fake);
    engine.start();
    advance(16);
    engine.dispose();
    expect(calls).toContain('render');
    expect(calls).toContain('dispose');
  });

  it('delegates viewport changes to the camera', () => {
    const camera = new PerspectiveCamera(60, 1);
    const engine = new Engine({ canvas, camera });
    engine.resize();
    expect(camera.aspect).toBeCloseTo(800 / 600, 5);
    engine.dispose();
  });

  it('detaches the resize listener on dispose', () => {
    const add = vi.spyOn(globalThis, 'addEventListener');
    const remove = vi.spyOn(globalThis, 'removeEventListener');
    const engine = new Engine({ canvas });
    const handler = add.mock.calls.find(([type]) => type === 'resize')?.[1];
    engine.dispose();
    expect(remove.mock.calls.some(([type, fn]) => type === 'resize' && fn === handler)).toBe(true);
  });
});
