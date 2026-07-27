export class Euler {
  constructor(
    public x = 0,
    public y = 0,
    public z = 0,
    public order = 'XYZ',
  ) {}
  set(x: number, y: number, z: number) {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }
}
