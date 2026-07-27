import { Camera } from '../cameras/Camera';
import { Scene } from '../core/Scene';
export interface Renderer {
  readonly canvas: HTMLCanvasElement;
  setSize(width: number, height: number, dpr?: number): void;
  render(scene: Scene, camera: Camera): void;
  dispose(): void;
}
