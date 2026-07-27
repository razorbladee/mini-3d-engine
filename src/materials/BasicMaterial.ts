import { parseHexColor } from '../math/Color';
import { Texture2D } from '../rendering/Texture2D';

export class BasicMaterial {
  color: Float32Array;
  opacity: number;
  transparent: boolean;
  wireframe: boolean;
  doubleSided: boolean;
  map?: Texture2D;
  constructor(
    options: {
      color?: string;
      opacity?: number;
      transparent?: boolean;
      wireframe?: boolean;
      doubleSided?: boolean;
      map?: Texture2D;
    } = {},
  ) {
    this.color = BasicMaterial.parseColor(options.color || '#4f8cff');
    this.opacity = options.opacity ?? 1;
    this.transparent = options.transparent ?? this.opacity < 1;
    this.wireframe = options.wireframe ?? false;
    this.doubleSided = options.doubleSided ?? false;
    this.map = options.map;
    this.color[3] = this.opacity;
  }
  /** RGBA float view of a hex colour; alpha is filled in by the constructor. */
  static parseColor(value: string) {
    const [r, g, b] = parseHexColor(value);
    return new Float32Array([r, g, b, 1]);
  }
}
