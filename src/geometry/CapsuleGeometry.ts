import { BufferGeometry } from './BufferGeometry';
export class CapsuleGeometry extends BufferGeometry {
  constructor(radius = .5, length = 1.5, segments = 16, rings = 8) { const p:number[]=[]; for(let y=0;y<rings;y++){const t0=y/rings*Math.PI,t1=(y+1)/rings*Math.PI;for(let x=0;x<segments;x++){const a0=x/segments*Math.PI*2,a1=(x+1)/segments*Math.PI*2;const q=(a:number,t:number)=>[radius*Math.sin(t)*Math.cos(a), length/2*Math.cos(t), radius*Math.sin(t)*Math.sin(a)];const a=q(a0,t0),b=q(a1,t0),c=q(a1,t1),d=q(a0,t1);p.push(...a,...b,...c,...a,...c,...d)}} super(p); }
}
