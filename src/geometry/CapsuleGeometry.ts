import { BufferGeometry } from './BufferGeometry';

export class CapsuleGeometry extends BufferGeometry {
  constructor(radius = 0.5, length = 1.5, segments = 20, rings = 8) {
    if (radius <= 0 || length < 0) throw new Error('CapsuleGeometry dimensions must be valid');
    if (segments < 3 || rings < 1) throw new Error('CapsuleGeometry needs valid segments and rings');
    const positions:number[]=[],normals:number[]=[];
    const half=length/2;
    const points:{p:number[];n:number[];u:number}[]=[];
    for(let y=0;y<=rings;y+=1){const t=y/rings*Math.PI/2;points.push({p:[radius*Math.sin(t),half+radius*Math.cos(t),0],n:[Math.sin(t),Math.cos(t),0],u:y/rings*.25});}
    for(let y=1;y<rings;y+=1){const t=y/rings*Math.PI/2;points.push({p:[radius*Math.sin(t),-half-radius*Math.cos(t),0],n:[Math.sin(t),-Math.cos(t),0],u:.75+y/rings*.25});}
    const ring=(index:number,angle:number)=>{const q=points[index],ca=Math.cos(angle),sa=Math.sin(angle);return {p:[q.p[0]*ca,q.p[1],q.p[0]*sa],n:[q.n[0]*ca,q.n[1],q.n[0]*sa],u:index/(points.length-1)};};
    for(let r=0;r<points.length-1;r+=1) for(let s=0;s<segments;s+=1){const a0=s/segments*Math.PI*2,a1=(s+1)/segments*Math.PI*2;for(const v of [ring(r,a0),ring(r,a1),ring(r+1,a1),ring(r,a0),ring(r+1,a1),ring(r+1,a0)]){positions.push(...v.p);normals.push(...v.n);}}
    super(positions,normals);
  }
}
