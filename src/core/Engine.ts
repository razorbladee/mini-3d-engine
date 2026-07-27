import { Camera } from '../cameras/Camera';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera';
import type { Renderer } from '../rendering/Renderer';
import { WebGLRenderer } from '../rendering/WebGLRenderer';
import { Scene } from './Scene';

export type FrameInfo = { deltaTime: number; elapsed: number };

/** Anything needing per-frame edge cleanup, such as InputMap. */
export type FrameConsumer = { endFrame(): unknown };

export type EngineOptions = {
  canvas: HTMLCanvasElement;
  camera?: Camera;
  /** Supply an alternative backend; defaults to WebGL2. */
  createRenderer?: (canvas: HTMLCanvasElement) => Renderer;
};

/** Frame gaps beyond this are clamped, so a background tab cannot jump the simulation. */
const MAX_DELTA_SECONDS = 0.1;

export class Engine {
  scene = new Scene();
  camera: Camera;
  /**
   * Typed as the backend contract rather than WebGLRenderer, so the swappable
   * backend the architecture doc promises is actually possible (AUDIT-TZ P2-1).
   */
  renderer: Renderer;

  private frame = 0;
  private last = 0;
  private startedAt = 0;
  private running = false;
  private readonly frameConsumers = new Set<FrameConsumer>();
  private readonly onResize = () => this.resize();

  /**
   * Registers something whose per-frame edges must be cleared after each
   * update, such as an InputMap. Without this nothing called endFrame() and
   * wasPressed() stayed true forever (AUDIT-TZ P1-9).
   */
  track<T extends FrameConsumer>(consumer: T) {
    this.frameConsumers.add(consumer);
    return consumer;
  }

  untrack(consumer: FrameConsumer) {
    this.frameConsumers.delete(consumer);
    return this;
  }

  constructor(options: EngineOptions) {
    const createRenderer = options.createRenderer ?? ((canvas: HTMLCanvasElement) => new WebGLRenderer(canvas));
    this.renderer = createRenderer(options.canvas);
    this.camera = options.camera || new PerspectiveCamera(60, 1);
    this.resize();
    globalThis.addEventListener?.('resize', this.onResize);
  }

  resize() {
    const canvas = this.renderer.canvas;
    const width = canvas.clientWidth || globalThis.innerWidth || 1;
    const height = canvas.clientHeight || globalThis.innerHeight || 1;
    this.renderer.setSize(width, height);
    // Projection updates belong to the camera; Engine no longer branches on
    // the concrete camera type (AUDIT-TZ P2-1).
    this.camera.setViewportSize(width, Math.max(height, 1));
    return this;
  }

  start(update?: (time: FrameInfo) => void) {
    if (this.running) return this;
    this.running = true;
    this.last = performance.now();
    this.startedAt = this.last;

    const tick = (now: number) => {
      if (!this.running) return;
      const deltaTime = Math.min(Math.max((now - this.last) / 1000, 0), MAX_DELTA_SECONDS);
      this.last = now;
      update?.({ deltaTime, elapsed: (now - this.startedAt) / 1000 });
      this.renderer.render(this.scene, this.camera);
      for (const consumer of this.frameConsumers) consumer.endFrame();
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
    return this;
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.frame);
    return this;
  }

  dispose() {
    this.stop();
    globalThis.removeEventListener?.('resize', this.onResize);
    this.renderer.dispose();
  }
}
