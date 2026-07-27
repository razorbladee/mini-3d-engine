import { describe, expect, it } from 'vitest';
import { AnimationClip, AnimationMixer } from '../../src';

function trackedClip(name: string, duration: number, keyframes: { time: number; value: number }[]) {
  const values: number[] = [];
  const clip = new AnimationClip(name, duration, [{ keyframes, apply: (value) => values.push(value) }]);
  return { clip, values };
}

describe('AnimationClip', () => {
  it('rejects an invalid duration', () => {
    expect(() => new AnimationClip('bad', -1, [])).toThrow('non-negative');
    expect(() => new AnimationClip('bad', Number.NaN, [])).toThrow('finite');
  });
});

describe('AnimationMixer', () => {
  it('interpolates linearly between keyframes and honours timeScale', () => {
    const { clip, values } = trackedClip('move', 1, [
      { time: 0, value: 0 },
      { time: 1, value: 10 },
    ]);
    const mixer = new AnimationMixer().play(clip);
    mixer.timeScale = 2;
    mixer.update(0.25);
    expect(values.at(-1)).toBe(5);
    expect(mixer.playing).toBe(true);
  });

  it('clamps before the first and after the last keyframe', () => {
    const { clip, values } = trackedClip('clamp', 10, [
      { time: 2, value: 1 },
      { time: 4, value: 3 },
    ]);
    const mixer = new AnimationMixer().play(clip, { loop: false });
    expect(values.at(-1)).toBe(1);
    mixer.update(9);
    expect(values.at(-1)).toBe(3);
  });

  it('stops non-looping clips at the end', () => {
    const { clip, values } = trackedClip('once', 1, [
      { time: 0, value: 1 },
      { time: 1, value: 3 },
    ]);
    const mixer = new AnimationMixer().play(clip, { loop: false }).update(2);
    expect(mixer.time).toBe(1);
    expect(mixer.playing).toBe(false);
    expect(values.at(-1)).toBe(3);
  });

  it('wraps looping clips around the duration', () => {
    const { clip } = trackedClip('loop', 2, [
      { time: 0, value: 0 },
      { time: 2, value: 2 },
    ]);
    const mixer = new AnimationMixer().play(clip, { loop: true }).update(2.5);
    expect(mixer.time).toBeCloseTo(0.5, 6);
    expect(mixer.playing).toBe(true);
  });

  it('pauses and resumes without losing position', () => {
    const { clip } = trackedClip('pause', 4, [
      { time: 0, value: 0 },
      { time: 4, value: 4 },
    ]);
    const mixer = new AnimationMixer().play(clip);
    mixer.update(1).pause();
    mixer.update(1);
    expect(mixer.time).toBeCloseTo(1, 6);
    mixer.resume().update(1);
    expect(mixer.time).toBeCloseTo(2, 6);
  });

  it('rewinds to the start on stop', () => {
    const { clip } = trackedClip('stop', 4, [
      { time: 0, value: 0 },
      { time: 4, value: 4 },
    ]);
    const mixer = new AnimationMixer().play(clip).update(2);
    mixer.stop();
    expect(mixer.time).toBe(0);
    expect(mixer.playing).toBe(false);
  });

  it('ignores negative delta time', () => {
    const { clip } = trackedClip('negative', 4, [
      { time: 0, value: 0 },
      { time: 4, value: 4 },
    ]);
    const mixer = new AnimationMixer().play(clip).update(1);
    mixer.update(-5);
    expect(mixer.time).toBeCloseTo(1, 6);
  });

  it('is inert before any clip is played', () => {
    const mixer = new AnimationMixer();
    expect(mixer.playing).toBe(false);
    expect(mixer.time).toBe(0);
    expect(() => mixer.update(1).stop().pause().resume()).not.toThrow();
  });

  it('starts a clip at an explicit offset', () => {
    const { clip, values } = trackedClip('offset', 4, [
      { time: 0, value: 0 },
      { time: 4, value: 8 },
    ]);
    new AnimationMixer().play(clip, { time: 2 });
    expect(values.at(-1)).toBe(4);
  });
});
