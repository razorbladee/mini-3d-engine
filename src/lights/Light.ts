import { Node } from '../core/Node';
import { Vector3 } from '../math/Vector3';
export abstract class Light extends Node {
  constructor(
    public color = '#ffffff',
    public intensity = 1,
  ) {
    super();
  }
}
export class AmbientLight extends Light {}
export class DirectionalLight extends Light {
  direction = new Vector3(0, -1, 0);
  /** Enables one directional shadow-map pass. The first shadow-casting light wins. */
  castShadow = false;
  shadowMapSize = 1024;
  shadowSize = 24;
  shadowNear = 0.1;
  shadowFar = 60;
  shadowDistance = 30;
  shadowBias = 0.0015;
  shadowStrength = 0.82;
  readonly shadowCenter = new Vector3();
}
export class PointLight extends Light {
  distance = 0;
}
export class SpotLight extends Light {
  direction = new Vector3(0, -1, 0);
  angle = Math.PI / 6;
  penumbra = 0.2;
  distance = 0;
}
export class HemisphereLight extends Light {
  groundColor = '#777777';
}
