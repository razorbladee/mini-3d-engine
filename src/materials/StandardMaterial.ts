import { BasicMaterial } from './BasicMaterial';
import { Texture2D } from '../rendering/Texture2D';

export class StandardMaterial extends BasicMaterial {
  roughness: number;
  metalness: number;
  constructor(options: { color?: string; opacity?: number; transparent?: boolean; wireframe?: boolean; doubleSided?: boolean; roughness?: number; metalness?: number; map?: Texture2D } = {}) { super(options); this.roughness = options.roughness ?? 0.5; this.metalness = options.metalness ?? 0; }
}
