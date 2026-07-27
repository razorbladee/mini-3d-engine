import { Node } from '../core/Node';
import { Vector3 } from '../math/Vector3';

export abstract class Light extends Node {
  constructor(public color = '#ffffff', public intensity = 1) { super(); }
}

export class AmbientLight extends Light {}

export class DirectionalLight extends Light {
  direction = new Vector3(0, -1, 0);
}

export class PointLight extends Light {
  distance = 0;
}
