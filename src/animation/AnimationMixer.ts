import { AnimationClip, AnimationChannel, Keyframe } from './AnimationClip';
function sample(keyframes: readonly Keyframe[], time: number) {
  if (!keyframes.length) return 0;
  if (time <= keyframes[0].time) return keyframes[0].value;
  const last = keyframes[keyframes.length - 1];
  if (time >= last.time) return last.value;
  for (let index = 1; index < keyframes.length; index += 1) {
    const right = keyframes[index];
    const left = keyframes[index - 1];
    if (time <= right.time) {
      const range = right.time - left.time || 1;
      const alpha = (time - left.time) / range;
      return left.value + (right.value - left.value) * alpha;
    }
  }
  return last.value;
}
export class AnimationMixer {
  private current: { clip: AnimationClip; time: number; loop: boolean; playing: boolean } | null = null;
  play(clip: AnimationClip, options: { loop?: boolean } = {}) { this.current = { clip, time: 0, loop: options.loop ?? true, playing: true }; this.apply(); return this; }
  stop() { if (this.current) this.current.playing = false; return this; }
  pause() { return this.stop(); }
  resume() { if (this.current) this.current.playing = true; return this; }
  update(deltaTime: number) { if (!this.current?.playing) return this; this.current.time += Math.max(0, deltaTime); if (this.current.clip.duration > 0 && this.current.time >= this.current.clip.duration) { if (this.current.loop) this.current.time %= this.current.clip.duration; else { this.current.time = this.current.clip.duration; this.current.playing = false; } } this.apply(); return this; }
  get time() { return this.current?.time ?? 0; }
  private apply() { if (!this.current) return; for (const channel of this.current.clip.channels) channel.apply(sample(channel.keyframes, this.current.time)); }
}
