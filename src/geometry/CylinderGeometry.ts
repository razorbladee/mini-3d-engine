import { BufferGeometry } from './BufferGeometry';

export class CylinderGeometry extends BufferGeometry {
  constructor(radius = 1, height = 2, segments = 24) {
    if (radius <= 0 || height <= 0) throw new Error('CylinderGeometry dimensions must be positive');
    if (segments < 3) throw new Error('CylinderGeometry needs at least 3 segments');
    const positions: number[] = [], normals: number[] = [], uvs: number[] = [];
    const half = height / 2;
    const push = (position: number[], normal: number[], uv: number[]) => { positions.push(...position); normals.push(...normal); uvs.push(...uv); };
    for (let i = 0; i < segments; i += 1) {
      const u0 = i / segments, u1 = (i + 1) / segments;
      const a0 = u0 * Math.PI * 2, a1 = u1 * Math.PI * 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      const side = [[radius*c0,-half,radius*s0],[radius*c1,-half,radius*s1],[radius*c1,half,radius*s1],[radius*c0,-half,radius*s0],[radius*c1,half,radius*s1],[radius*c0,half,radius*s0]];
      for (const [x,y,z] of side) push([x,y,z],[x/radius,0,z/radius],[(Math.atan2(z,x)/(Math.PI*2)+1)%1,(y+half)/height]);
      const bottom = [[0,-half,0],[radius*c1,-half,radius*s1],[radius*c0,-half,radius*s0]];
      for (const [x,y,z] of bottom) push([x,y,z],[0,-1,0],[x/radius/2+.5,z/radius/2+.5]);
      const top = [[0,half,0],[radius*c0,half,radius*s0],[radius*c1,half,radius*s1]];
      for (const [x,y,z] of top) push([x,y,z],[0,1,0],[x/radius/2+.5,z/radius/2+.5]);
    }
    super(positions, normals, uvs);
  }
}
