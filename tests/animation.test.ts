import { describe, expect, it } from 'vitest';
import { AnimationClip, AnimationMixer } from '../src';
describe('AnimationMixer', () => {
  it('interpolates, loops, and applies timeScale', () => {
    const values: number[] = [];
    const clip = new AnimationClip('move', 1, [
      {
        keyframes: [
          { time: 0, value: 0 },
          { time: 1, value: 10 },
        ],
        apply: (value) => values.push(value),
      },
    ]);
    const mixer = new AnimationMixer().play(clip);
    mixer.timeScale = 2;
    mixer.update(0.25);
    expect(values.at(-1)).toBe(5);
    expect(mixer.playing).toBe(true);
  });
  it('stops non-looping clips at the end', () => {
    const values: number[] = [];
    const clip = new AnimationClip('once', 1, [
      {
        keyframes: [
          { time: 0, value: 1 },
          { time: 1, value: 3 },
        ],
        apply: (value) => values.push(value),
      },
    ]);
    const mixer = new AnimationMixer().play(clip, { loop: false }).update(2);
    expect(mixer.time).toBe(1);
    expect(mixer.playing).toBe(false);
    expect(values.at(-1)).toBe(3);
  });
});
