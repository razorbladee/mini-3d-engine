export class BufferGeometry {
  positions: Float32Array;
  gpuBuffer: WebGLBuffer | null = null;
  readonly boundingRadius: number;

  constructor(positions: number[]) {
    if (positions.length % 3 !== 0) throw new Error('Geometry positions must contain complete xyz triples');
    this.positions = new Float32Array(positions);
    let radiusSquared = 0;
    for (let index = 0; index < positions.length; index += 3) {
      radiusSquared = Math.max(radiusSquared, positions[index] ** 2 + positions[index + 1] ** 2 + positions[index + 2] ** 2);
    }
    this.boundingRadius = Math.sqrt(radiusSquared);
  }

  dispose(gl: WebGL2RenderingContext) {
    if (this.gpuBuffer) gl.deleteBuffer(this.gpuBuffer);
    this.gpuBuffer = null;
  }
}
