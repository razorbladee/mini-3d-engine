import { Euler } from '../math/Euler'; import { Matrix4 } from '../math/Matrix4'; import { Vector3 } from '../math/Vector3';
export class Node { readonly position=new Vector3(); readonly rotation=new Euler(); readonly scale=new Vector3(1,1,1); readonly localMatrix=new Matrix4(); worldMatrix=new Matrix4(); parent:Node|null=null; children:Node[]=[]; visible=true; name=''; matrixOverride:Float32Array|null=null;
 add(...nodes:Node[]){for(const node of nodes){if(node===this||this.isDescendantOf(node))throw new Error('Cannot create a cyclic scene graph');if(node.parent)node.parent.remove(node);node.parent=this;this.children.push(node)}return this}
 remove(node:Node){const index=this.children.indexOf(node);if(index>=0){this.children.splice(index,1);node.parent=null}return this}
 private isDescendantOf(node:Node){for(let parent:Node|null=this;parent;parent=parent.parent)if(parent===node)return true;return false}
 updateWorldMatrix(parentMatrix?:Matrix4){if(this.matrixOverride)this.localMatrix.elements.set(this.matrixOverride);else this.localMatrix.compose(this.position,this.scale,this.rotation);this.worldMatrix=parentMatrix?parentMatrix.clone().multiply(this.localMatrix):this.localMatrix.clone();for(const child of this.children)child.updateWorldMatrix(this.worldMatrix);return this}
 traverse(callback:(node:Node)=>void){callback(this);for(const child of this.children)child.traverse(callback)}
}
