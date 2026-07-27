export type ExampleGroup =
  | 'Featured'
  | 'Geometry'
  | 'Materials'
  | 'Textures'
  | 'Models'
  | 'Lighting'
  | 'Cameras'
  | 'Interaction'
  | 'Simulation'
  | 'Production'
  | 'Extensions';
export type ExampleId =
  | 'low-poly-forest'
  | 'shader-forest'
  | 'textured-shader-forest'
  | 'cinematic-shader-forest'
  | 'primitives'
  | 'advanced-primitives'
  | 'materials'
  | 'scene-graph'
  | 'procedural-textures'
  | 'wood-texture'
  | 'brick-texture'
  | 'cloth-texture'
  | 'models-box'
  | 'models-cesium'
  | 'models-fox'
  | 'lighting'
  | 'cameras'
  | 'raycasting'
  | 'physics'
  | 'animation'
  | 'asset-manager'
  | 'transparent'
  | 'bounds-input'
  | 'texture'
  | 'postprocess'
  | 'custom-geometry'
  | 'material-flags'
  | 'transform-lab'
  | 'frustum-culling'
  | 'particles'
  | 'performance-metrics'
  | 'scene-inspector'
  | 'resource-lifecycle'
  | 'input-actions'
  | 'physics-adapter'
  | 'gltf-features'
  | 'audio-hooks'
  | 'renderer-backends';
export type ExampleMeta = { id: ExampleId; group: ExampleGroup; title: string; summary: string; hint: string };
export const examples: ExampleMeta[] = [
  {
    id: 'low-poly-forest',
    group: 'Featured',
    title: 'Low-poly forest world',
    summary: 'A procedural forest, pond, terrain and moving clouds with soft directional shadows.',
    hint: 'Drag to explore, toggle shadows',
  },
  {
    id: 'shader-forest',
    group: 'Featured',
    title: 'Shader forest world',
    summary: 'The same forest objects rendered with custom toon, wind, water and shadow GLSL.',
    hint: 'Compare with the scene above',
  },
  {
    id: 'textured-shader-forest',
    group: 'Featured',
    title: 'Textured shader forest',
    summary: 'The same world with custom GLSL plus web textures on every object class.',
    hint: 'Wait for 6 maps, then compare',
  },
  {
    id: 'cinematic-shader-forest',
    group: 'Featured',
    title: 'Cinematic shader forest',
    summary: 'Enhanced terrain, water, foliage, clouds and atmosphere with layered GLSL and detail maps.',
    hint: 'Wait for 8 maps, then explore',
  },
  {
    id: 'primitives',
    group: 'Geometry',
    title: 'Primitive workshop',
    summary: 'Box, sphere, plane, and a lit floor.',
    hint: 'Drag to orbit, wheel to zoom',
  },
  {
    id: 'advanced-primitives',
    group: 'Geometry',
    title: 'Cylinder, torus, capsule',
    summary: 'Closed solid primitives with normals and UVs.',
    hint: 'Drag to orbit, wheel to zoom',
  },
  {
    id: 'materials',
    group: 'Materials',
    title: 'Material studies',
    summary: 'Four spheres compare roughness and metalness.',
    hint: 'Drag to orbit, wheel to zoom',
  },
  {
    id: 'scene-graph',
    group: 'Geometry',
    title: 'Scene graph rig',
    summary: 'A parent node rotates a small solar system.',
    hint: 'Drag to orbit, wheel to zoom',
  },
  {
    id: 'procedural-textures',
    group: 'Textures',
    title: 'Procedural signal',
    summary: 'Generated stripes, checker, and noise.',
    hint: 'Wait for 3 maps, then orbit',
  },
  {
    id: 'wood-texture',
    group: 'Textures',
    title: 'Wood floor image',
    summary: 'A Wikimedia wood photograph on a tile.',
    hint: 'External image, drag to orbit',
  },
  {
    id: 'brick-texture',
    group: 'Textures',
    title: 'Brick wall image',
    summary: 'A public brick photograph on a cube.',
    hint: 'External image, drag to orbit',
  },
  {
    id: 'cloth-texture',
    group: 'Textures',
    title: 'Cloth image',
    summary: 'A cloth photograph mapped onto a sphere.',
    hint: 'External image, drag to orbit',
  },
  {
    id: 'models-box',
    group: 'Models',
    title: 'glTF BoxAnimated',
    summary: 'Khronos sample with animation metadata.',
    hint: 'Loading glTF, then drag',
  },
  {
    id: 'models-cesium',
    group: 'Models',
    title: 'glTF CesiumMan',
    summary: 'Textured character sample.',
    hint: 'CC BY 4.0, drag to orbit',
  },
  {
    id: 'models-fox',
    group: 'Models',
    title: 'glTF Fox',
    summary: 'Low-poly fox sample.',
    hint: 'CC0/CC-BY, drag to orbit',
  },
  {
    id: 'lighting',
    group: 'Lighting',
    title: 'Light gallery',
    summary: 'Ambient, directional, point, spot, hemisphere.',
    hint: 'Drag to orbit',
  },
  {
    id: 'cameras',
    group: 'Cameras',
    title: 'Camera lab',
    summary: 'Perspective and orthographic projections.',
    hint: 'Use camera toggle',
  },
  {
    id: 'raycasting',
    group: 'Interaction',
    title: 'Raycast playground',
    summary: 'Click a volume to focus the orbit camera.',
    hint: 'Click, then drag',
  },
  {
    id: 'physics',
    group: 'Simulation',
    title: 'Gravity drop',
    summary: 'Bodies settle on a floor.',
    hint: 'Drop again, then orbit',
  },
  {
    id: 'animation',
    group: 'Production',
    title: 'Animation mixer',
    summary: 'Keyframe interpolation, loop and timeScale.',
    hint: 'Click play and change speed',
  },
  {
    id: 'asset-manager',
    group: 'Production',
    title: 'Asset manager',
    summary: 'Deduplicated loading with progress.',
    hint: 'Three requests share one load',
  },
  {
    id: 'transparent',
    group: 'Production',
    title: 'Transparent sorting',
    summary: 'Alpha blending and depth-mask behavior.',
    hint: 'Drag to orbit',
  },
  {
    id: 'bounds-input',
    group: 'Production',
    title: 'Bounds + input',
    summary: 'AABB checks and keyboard action mapping.',
    hint: 'Press Space or ArrowUp',
  },
  {
    id: 'texture',
    group: 'Extensions',
    title: 'Texture decoder',
    summary: 'Generate, encode, decode Texture2D.',
    hint: 'Run decode',
  },
  {
    id: 'postprocess',
    group: 'Extensions',
    title: 'Post-process passes',
    summary: 'Ordered passes and look changes.',
    hint: 'Run passes',
  },
  {
    id: 'custom-geometry',
    group: 'Geometry',
    title: 'Custom geometry',
    summary: 'BufferGeometry and BufferAttribute built from raw vertex channels.',
    hint: 'Inspect attributes, then orbit',
  },
  {
    id: 'material-flags',
    group: 'Materials',
    title: 'Material flags',
    summary: 'Unlit, wireframe, double-sided and transparent material modes.',
    hint: 'Orbit to compare both sides',
  },
  {
    id: 'transform-lab',
    group: 'Geometry',
    title: 'Transform lab',
    summary: 'Euler, quaternion and matrix transforms side by side.',
    hint: 'Watch three transform paths',
  },
  {
    id: 'frustum-culling',
    group: 'Interaction',
    title: 'Frustum culling',
    summary: 'Point and sphere bounds tested against the live camera frustum.',
    hint: 'Orbit to change visibility',
  },
  {
    id: 'particles',
    group: 'Simulation',
    title: 'Particle fountain',
    summary: 'Emission, velocity, gravity, lifetime and capacity.',
    hint: 'Emit a burst or clear',
  },
  {
    id: 'performance-metrics',
    group: 'Production',
    title: 'Performance metrics',
    summary: 'FPS, frame time and a switchable mesh workload.',
    hint: 'Toggle the stress load',
  },
  {
    id: 'scene-inspector',
    group: 'Production',
    title: 'Scene inspector',
    summary: 'A live snapshot of names, node types and hierarchy.',
    hint: 'Toggle a branch',
  },
  {
    id: 'resource-lifecycle',
    group: 'Production',
    title: 'GPU resource lifecycle',
    summary: 'Shared geometry upload, release and lazy re-upload.',
    hint: 'Release the shared geometry',
  },
  {
    id: 'input-actions',
    group: 'Interaction',
    title: 'Input actions',
    summary: 'Held, pressed and released keyboard action states.',
    hint: 'Use arrows and Space',
  },
  {
    id: 'physics-adapter',
    group: 'Simulation',
    title: 'Physics adapter',
    summary: 'SimplePhysics used exclusively through the backend contract.',
    hint: 'Add or remove a body',
  },
  {
    id: 'gltf-features',
    group: 'Models',
    title: 'glTF feature diagnostics',
    summary: 'Switch between JSON glTF and binary GLB loading paths.',
    hint: 'Switch format and inspect metadata',
  },
  {
    id: 'audio-hooks',
    group: 'Extensions',
    title: 'Audio hooks',
    summary: 'Backend-neutral play, stop and volume event integration.',
    hint: 'Trigger mock audio events',
  },
  {
    id: 'renderer-backends',
    group: 'Extensions',
    title: 'Renderer backends',
    summary: 'Active WebGL backend and explicit WebGPU capability reporting.',
    hint: 'Probe WebGPU support',
  },
];
export function nextExample(current: ExampleId) {
  const i = examples.findIndex((e) => e.id === current);
  return examples[(i + 1 + examples.length) % examples.length].id;
}
