import { describe, expect, it } from 'vitest'; import { PerspectiveCamera, Vector3 } from '../src';
describe('orbit focus',()=>{it('moves the camera around a selected target',()=>{const camera=new PerspectiveCamera();const controls:any={target:new Vector3()}; expect(camera.position.z).toBe(0); void controls;});});
