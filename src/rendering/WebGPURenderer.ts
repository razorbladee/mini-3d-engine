import { Camera } from '../cameras/Camera';
import { Scene } from '../core/Scene';
import { Renderer } from './Renderer';
export class WebGPURenderer implements Renderer {
  constructor(public readonly canvas: HTMLCanvasElement) {
    if (!('gpu' in navigator)) throw new Error('WebGPU is not available in this browser');
    throw new Error('WebGPURenderer is reserved for the next backend implementation; use WebGLRenderer');
  }
  setSize(width: number, height: number, dpr = globalThis.devicePixelRatio || 1) {
    this.canvas.width = Math.max(1, Math.floor(width * dpr));
    this.canvas.height = Math.max(1, Math.floor(height * dpr));
  }
  render(_scene: Scene, _camera: Camera) {
    throw new Error('WebGPURenderer is not initialized');
  }
  dispose() {}
}
