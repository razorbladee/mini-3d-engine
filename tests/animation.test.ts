import { describe, expect, it } from 'vitest';
import { AnimationClip, AnimationMixer } from '../src';
describe('AnimationMixer', () => {
  it('interpolates keyframes and loops', () => {
    const values: number[] = [];
    const clip = new AnimationClip('move', 1, [{ keyframes: [{ time: 0, value: 0 }, { time: 1, value: 10 }], apply: (value) => values.push(value) }]);
    new AnimationMixer().play(clip).update(0.5);
    expect(values.at(-1)).toBe(5);
    new AnimationMixer().play(clip).update(1.25);
    expect(values.at(-1)).toBeCloseTo(2.5);
  });
  it('stops non-looping clips at their end', () => {
    const values: number[] = [];
    const clip = new AnimationClip('once', 1, [{ keyframes: [{ time: 0, value: 1 }, { time: 1, value: 3 }], apply: (value) => values.push(value) }]);
    const mixer = new AnimationMixer().play(clip, { loop: false }).update(2);
    expect(mixer.time).toBe(1);
    expect(values.at(-1)).toBe(3);
  });
});
