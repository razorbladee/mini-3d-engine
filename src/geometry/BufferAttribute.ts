export class BufferAttribute {
  constructor(
    public array: Float32Array,
    public itemSize: number,
    public normalized = false,
  ) {}
  get count() {
    return this.array.length / this.itemSize;
  }
}
