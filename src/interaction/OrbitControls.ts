import { Camera } from '../cameras/Camera';

export class OrbitControls {
  private dragging = false;
  private pointerId = -1;
  private lastX = 0;
  private lastY = 0;
  private azimuth = 0;
  private elevation = 0.18;
  private distance = 8;
  private readonly onPointerDown = (event: PointerEvent) => {
    this.dragging = true;
    this.pointerId = event.pointerId;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.element.setPointerCapture?.(event.pointerId);
  };
  private readonly onPointerMove = (event: PointerEvent) => {
    if (!this.dragging || event.pointerId !== this.pointerId) return;
    this.azimuth -= (event.clientX - this.lastX) * 0.008;
    this.elevation += (event.clientY - this.lastY) * 0.008;
    this.elevation = Math.max(-1.35, Math.min(1.35, this.elevation));
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.updateCamera();
  };
  private readonly onPointerUp = (event: PointerEvent) => {
    if (event.pointerId !== this.pointerId) return;
    this.dragging = false;
    this.element.releasePointerCapture?.(event.pointerId);
  };
  private readonly onWheel = (event: WheelEvent) => {
    event.preventDefault();
    this.distance = Math.max(2.5, Math.min(30, this.distance * Math.exp(event.deltaY * 0.001)));
    this.updateCamera();
  };

  constructor(public camera: Camera, public element: HTMLElement) {
    element.style.touchAction = 'none';
    element.addEventListener('pointerdown', this.onPointerDown);
    element.addEventListener('pointermove', this.onPointerMove);
    element.addEventListener('pointerup', this.onPointerUp);
    element.addEventListener('pointercancel', this.onPointerUp);
    element.addEventListener('wheel', this.onWheel, { passive: false });
    this.updateCamera();
  }

  updateCamera() {
    const horizontal = Math.cos(this.elevation) * this.distance;
    this.camera.position.set(
      Math.sin(this.azimuth) * horizontal,
      Math.sin(this.elevation) * this.distance,
      Math.cos(this.azimuth) * horizontal,
    );
    this.camera.rotation.set(-this.elevation, this.azimuth, 0);
    return this;
  }

  reset(distance = 8) {
    this.azimuth = 0;
    this.elevation = 0.18;
    this.distance = distance;
    return this.updateCamera();
  }

  dispose() {
    this.element.removeEventListener('pointerdown', this.onPointerDown);
    this.element.removeEventListener('pointermove', this.onPointerMove);
    this.element.removeEventListener('pointerup', this.onPointerUp);
    this.element.removeEventListener('pointercancel', this.onPointerUp);
    this.element.removeEventListener('wheel', this.onWheel);
  }
}
