export class Vector2 {
  constructor(
    public x = 0,
    public y = 0,
  ) {}
  set(x: number, y: number) {
    this.x = x;
    this.y = y;
    return this;
  }
  clone() {
    return new Vector2(this.x, this.y);
  }
  add(v: Vector2) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }
  sub(v: Vector2) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }
  multiplyScalar(s: number) {
    this.x *= s;
    this.y *= s;
    return this;
  }
  length() {
    return Math.hypot(this.x, this.y);
  }
  normalize() {
    return this.multiplyScalar(1 / (this.length() || 1));
  }
}
