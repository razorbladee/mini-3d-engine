export type Keyframe = { time: number; value: number };
export type AnimationChannel = { apply(value: number): void; keyframes: readonly Keyframe[] };
export class AnimationClip {
  constructor(public readonly name: string, public readonly duration: number, public readonly channels: readonly AnimationChannel[]) {
    if (duration < 0 || !Number.isFinite(duration)) throw new Error('AnimationClip duration must be finite and non-negative');
  }
}
