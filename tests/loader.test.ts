import { describe, expect, it } from 'vitest'; import { GLTFLoader } from '../src';
describe('GLTFLoader',()=>{it('rejects invalid GLB headers',async()=>{await expect(new GLTFLoader().parseGlb(new ArrayBuffer(8))).rejects.toThrow('Invalid GLB header')});});
