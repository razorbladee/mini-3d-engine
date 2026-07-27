export class BufferGeometry {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  gpuBuffer: WebGLBuffer | null = null;
  normalBuffer: WebGLBuffer | null = null;
  uvBuffer: WebGLBuffer | null = null;
  readonly boundingRadius: number;

  constructor(positions: number[], normals?: number[], uvs?: number[]) {
    if (positions.length % 3 !== 0) throw new Error('Geometry positions must contain complete xyz triples');
    this.positions = new Float32Array(positions);
    this.normals = normals ? new Float32Array(normals) : BufferGeometry.computeFaceNormals(this.positions);
    if (this.normals.length !== this.positions.length) throw new Error('Geometry normals must match positions');
    this.uvs = uvs ? new Float32Array(uvs) : BufferGeometry.computePlanarUvs(this.positions);
    if (this.uvs.length !== (this.positions.length / 3) * 2)
      throw new Error('Geometry UVs must contain two values per vertex');
    let radiusSquared = 0;
    for (let index = 0; index < positions.length; index += 3)
      radiusSquared = Math.max(
        radiusSquared,
        positions[index] ** 2 + positions[index + 1] ** 2 + positions[index + 2] ** 2,
      );
    this.boundingRadius = Math.sqrt(radiusSquared);
  }

  private static computePlanarUvs(positions: Float32Array) {
    let minX = Infinity,
      maxX = -Infinity,
      minZ = Infinity,
      maxZ = -Infinity;
    for (let index = 0; index < positions.length; index += 3) {
      minX = Math.min(minX, positions[index]);
      maxX = Math.max(maxX, positions[index]);
      minZ = Math.min(minZ, positions[index + 2]);
      maxZ = Math.max(maxZ, positions[index + 2]);
    }
    const width = maxX - minX || 1;
    const height = maxZ - minZ || 1;
    const uvs: number[] = [];
    for (let index = 0; index < positions.length; index += 3)
      uvs.push((positions[index] - minX) / width, (positions[index + 2] - minZ) / height);
    return new Float32Array(uvs);
  }

  private static computeFaceNormals(positions: Float32Array) {
    const normals = new Float32Array(positions.length);
    for (let index = 0; index < positions.length; index += 9) {
      const ax = positions[index + 3] - positions[index],
        ay = positions[index + 4] - positions[index + 1],
        az = positions[index + 5] - positions[index + 2];
      const bx = positions[index + 6] - positions[index],
        by = positions[index + 7] - positions[index + 1],
        bz = positions[index + 8] - positions[index + 2];
      const nx = ay * bz - az * by,
        ny = az * bx - ax * bz,
        nz = ax * by - ay * bx,
        length = Math.hypot(nx, ny, nz) || 1;
      for (let vertex = 0; vertex < 3; vertex += 1) {
        const offset = index + vertex * 3;
        normals[offset] = nx / length;
        normals[offset + 1] = ny / length;
        normals[offset + 2] = nz / length;
      }
    }
    return normals;
  }

  dispose(gl: WebGL2RenderingContext) {
    if (this.gpuBuffer) gl.deleteBuffer(this.gpuBuffer);
    if (this.normalBuffer) gl.deleteBuffer(this.normalBuffer);
    if (this.uvBuffer) gl.deleteBuffer(this.uvBuffer);
    this.gpuBuffer = null;
    this.normalBuffer = null;
    this.uvBuffer = null;
  }
}
