export class PerformanceMetrics {
  frames = 0;
  elapsed = 0;
  deltaTime = 0;
  update(deltaTime: number) {
    this.frames += 1;
    this.deltaTime = deltaTime;
    this.elapsed += deltaTime;
    return this;
  }
  get fps() {
    return this.deltaTime > 0 ? 1 / this.deltaTime : 0;
  }
  reset() {
    this.frames = 0;
    this.elapsed = 0;
    this.deltaTime = 0;
    return this;
  }
}
