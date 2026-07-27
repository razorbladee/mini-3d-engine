# Mini 3D Engine

Small TypeScript/WebGL2 library for interactive 3D scenes.

## MVP technical specification

Goal: browser library with scene graph, cameras, meshes, basic materials, rendering, animation loop and first interaction primitives.

### Included
- TypeScript strict mode, Vite, ESM
- Vector3 and Matrix4 foundations
- Node/Scene hierarchy and world transforms
- PerspectiveCamera
- WebGL2 renderer
- BufferGeometry, Mesh, BoxGeometry
- BasicMaterial and shader compilation
- Engine lifecycle: start, stop, resize, dispose
- working demo

### Deliberately deferred
Textures, glTF loading, physics, post-processing, WebGPU backend, editor, ECS and advanced animation.

## Run

```bash
npm install
npm run dev
npm run build
```

## API sketch

```ts
const engine = new Engine({ canvas });
const cube = new Mesh(new BoxGeometry(), new BasicMaterial({ color: '#4f8cff' }));
engine.scene.add(cube);
engine.start(({ deltaTime }) => { cube.rotation.y += deltaTime; });
```

## Issues

The MVP is tracked in 10 GitHub issues covering math, scene graph, renderer, geometry, materials, cameras, lighting, engine lifecycle, interaction, and release quality.
