import { Node } from '../core/Node';
export type SceneSnapshot = { name: string; type: string; visible: boolean; children: SceneSnapshot[] };
export function inspectScene(root: Node): SceneSnapshot {
  return {
    name: root.name,
    type: root.constructor.name,
    visible: root.visible,
    children: root.children.map(inspectScene),
  };
}
