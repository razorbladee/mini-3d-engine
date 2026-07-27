import { Camera } from '../cameras/Camera';
import { PerspectiveCamera } from '../cameras/PerspectiveCamera';
import { WebGLRenderer } from '../rendering/WebGLRenderer';
import { Scene } from './Scene';

export class Engine {
  scene = new Scene();
  camera: Camera;
  renderer: WebGLRenderer;
  private frame = 0;
  private last = 0;
  private startedAt = 0;
  private running = false;
  private readonly onResize = () => this.resize();

  constructor(options: { canvas: HTMLCanvasElement; camera?: Camera }) {
    this.renderer = new WebGLRenderer(options.canvas);
    this.camera = options.camera || new PerspectiveCamera(60, 1);
    this.resize();
    globalThis.addEventListener?.('resize', this.onResize);
  }

  resize() {
    const width = this.renderer.canvas.clientWidth || globalThis.innerWidth || 1;
    const height = this.renderer.canvas.clientHeight || globalThis.innerHeight || 1;
    this.renderer.setSize(width, height);
    if (this.camera instanceof PerspectiveCamera) {
      this.camera.aspect = width / Math.max(height, 1);
      this.camera.updateProjectionMatrix();
    }
  }

  start(update?: (time: { deltaTime: number; elapsed: number }) => void) {
    if (this.running) return this;
    this.running = true;
    this.last = performance.now();
    this.startedAt = this.last;
    const tick = (now: number) => {
      if (!this.running) return;
      const deltaTime = Math.min(Math.max((now - this.last) / 1000, 0), 0.1);
      this.last = now;
      update?.({ deltaTime, elapsed: (now - this.startedAt) / 1000 });
      this.renderer.render(this.scene, this.camera);
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
