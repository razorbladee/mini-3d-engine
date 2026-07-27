export type ExampleGroup = 'Geometry'|'Materials'|'Textures'|'Models'|'Lighting'|'Cameras'|'Interaction'|'Simulation'|'Extensions';
export type ExampleId = 'primitives'|'advanced-primitives'|'materials'|'scene-graph'|'procedural-textures'|'wood-texture'|'brick-texture'|'cloth-texture'|'models-box'|'models-cesium'|'models-fox'|'lighting'|'cameras'|'raycasting'|'physics'|'texture'|'postprocess';
export type ExampleMeta={id:ExampleId;group:ExampleGroup;title:string;summary:string;hint:string};
export const examples:ExampleMeta[]=[
{id:'primitives',group:'Geometry',title:'Primitive workshop',summary:'Box, sphere, plane, and a lit floor.',hint:'Drag to orbit, wheel to zoom'},
{id:'advanced-primitives',group:'Geometry',title:'Cylinder, torus, capsule',summary:'The new solid primitives, shaded and animated together.',hint:'Drag to orbit, wheel to zoom'},
{id:'materials',group:'Materials',title:'Material studies',summary:'Four spheres compare roughness and metalness.',hint:'Drag to orbit, wheel to zoom'},
{id:'scene-graph',group:'Geometry',title:'Scene graph rig',summary:'A parent node rotates a small solar system.',hint:'Drag to orbit, wheel to zoom'},
{id:'procedural-textures',group:'Textures',title:'Procedural signal',summary:'Generated stripes, checker, and noise mapped onto solids.',hint:'Wait for 3 maps, then orbit'},
{id:'wood-texture',group:'Textures',title:'Wood floor image',summary:'A Wikimedia wood photograph on a rotating tile.',hint:'External image, drag to orbit'},
{id:'brick-texture',group:'Textures',title:'Brick wall image',summary:'A public brick photograph wrapped onto a cube.',hint:'External image, drag to orbit'},
{id:'cloth-texture',group:'Textures',title:'Cloth image',summary:'A real cloth photograph mapped onto a sphere.',hint:'External image, drag to orbit'},
{id:'models-box',group:'Models',title:'glTF BoxAnimated',summary:'Khronos sample model with animation metadata.',hint:'Loading GLB, then drag to orbit'},
{id:'models-cesium',group:'Models',title:'glTF CesiumMan',summary:'Textured character sample from Khronos assets.',hint:'CC BY 4.0, drag to orbit'},
{id:'models-fox',group:'Models',title:'glTF Fox',summary:'Low-poly fox sample with animation metadata.',hint:'CC0 model, CC-BY rig, drag to orbit'},
{id:'lighting',group:'Lighting',title:'Light gallery',summary:'Ambient, directional, point, spot, and hemisphere nodes.',hint:'Drag to orbit'},
{id:'cameras',group:'Cameras',title:'Camera lab',summary:'Switch between perspective and orthographic projections.',hint:'Use the camera toggle'},
{id:'raycasting',group:'Interaction',title:'Raycast playground',summary:'Click a volume to focus the orbit camera on it.',hint:'Click objects, then drag to orbit'},
{id:'physics',group:'Simulation',title:'Gravity drop',summary:'Bodies fall, spin, and settle on a floor.',hint:'Drop again, then orbit'},
{id:'texture',group:'Extensions',title:'Texture decoder',summary:'Generate, encode, and decode a Texture2D.',hint:'Run decode'},
{id:'postprocess',group:'Extensions',title:'Post-process passes',summary:'Run ordered passes and compare looks.',hint:'Run passes'}];
export function nextExample(current:ExampleId){const i=examples.findIndex(e=>e.id===current);return examples[(i+1+examples.length)%examples.length].id;}
