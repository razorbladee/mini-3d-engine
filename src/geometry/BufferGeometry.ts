import { BufferAttribute } from './BufferAttribute';

export class BufferGeometry {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  readonly boundingRadius: number;

  /** Number of vertices in this geometry. */
  get vertexCount() {
    return this.positions.length / 3;
  }

  /** Vertex channels as BufferAttribute views, per MVP-SPEC 4.3. */
  get attributes() {
    return {
      position: new BufferAttribute(this.positions, 3),
      normal: new BufferAttribute(this.normals, 3),
      uv: new BufferAttribute(this.uvs, 2),
    };
  }

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

  /**
   * Planar projection onto the two axes with the largest extent.
   *
   * Projecting onto a fixed XZ plane collapsed every v to zero for geometry
   * lying in XY, such as PlaneGeometry (AUDIT-TZ P1-8). Choosing the dominant
   * axes keeps the fallback usable for arbitrary custom geometry; primitives
   * supply purpose-built UVs instead of relying on it.
   */
  private static computePlanarUvs(positions: Float32Array) {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let index = 0; index < positions.length; index += 3) {
      for (let axis = 0; axis < 3; axis += 1) {
        min[axis] = Math.min(min[axis], positions[index + axis]);
        max[axis] = Math.max(max[axis], positions[index + axis]);
      }
    }

    const extent = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
    // Drop the axis with the smallest extent, project onto the other two.
    const thinnest = extent.indexOf(Math.min(...extent));
    const [u, v] = [0, 1, 2].filter((axis) => axis !== thinnest);

    const width = extent[u] || 1;
    const height = extent[v] || 1;
    const uvs = new Float32Array((positions.length / 3) * 2);
    for (let index = 0, target = 0; index < positions.length; index += 3, target += 2) {
      uvs[target] = (positions[index + u] - min[u]) / width;
      uvs[target + 1] = (positions[index + v] - min[v]) / height;
    }
    return uvs;
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
}
