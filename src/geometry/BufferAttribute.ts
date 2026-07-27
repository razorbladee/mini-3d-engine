/**
 * Typed view over interleaved-free vertex data.
 *
 * MVP-SPEC 4.3 lists BufferAttribute as public API. It used to be exported but
 * referenced nowhere (AUDIT-TZ P2-2); BufferGeometry now exposes its channels
 * through this type so consumers have a uniform way to inspect vertex data.
 */
export class BufferAttribute {
  constructor(
    public array: Float32Array,
    public itemSize: number,
    public normalized = false,
  ) {
    if (itemSize <= 0 || !Number.isInteger(itemSize))
      throw new Error('BufferAttribute itemSize must be a positive integer');
    if (array.length % itemSize !== 0) throw new Error('BufferAttribute array length must be a multiple of itemSize');
  }

  /** Number of vertices described by this attribute. */
  get count() {
    return this.array.length / this.itemSize;
  }

  getX(index: number) {
    return this.array[index * this.itemSize];
  }

  getY(index: number) {
    return this.array[index * this.itemSize + 1];
  }

  getZ(index: number) {
    return this.array[index * this.itemSize + 2];
  }

  /** Copies the components of one vertex into a plain array. */
  getItem(index: number) {
    const start = index * this.itemSize;
    return Array.from(this.array.subarray(start, start + this.itemSize));
  }
}
