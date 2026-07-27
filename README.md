# Mini 3D Engine

Small TypeScript/WebGL2 library for interactive 3D scenes.

## Documentation

- [MVP specification](docs/MVP-SPEC.md), baseline document, do not rewrite
- [Extensions](docs/EXTENSIONS.md), textures, simple physics, and post-processing

## MVP status

The original MVP issues are implemented in `main`: math primitives, scene graph, camera system, WebGL2 renderer, buffer geometry, materials, lights, Engine lifecycle, raycasting/controls, demo, tests, and documentation.

### Public surface

`Vector2`, `Vector3`, `Vector4`, `Matrix4`, `Quaternion`, `Euler`, `Color`, `Node`, `Scene`, `Engine`, `Camera`, `PerspectiveCamera`, `OrthographicCamera`, `Mesh`, `BufferGeometry`, `BufferAttribute`, `BoxGeometry`, `PlaneGeometry`, `SphereGeometry`, `BasicMaterial`, `StandardMaterial`, `AmbientLight`, `DirectionalLight`, `PointLight`, `Raycaster`, `OrbitControls`, `WebGLRenderer`, `Texture2D`, `SimplePhysics`, and `PostProcess`.

## Run

```bash
npm install
npm run dev
npm run build
npm run test
```

## Scope

This is an MVP, not a Three.js replacement. Textures, glTF, physics, post-processing, WebGPU, editor gizmos, and advanced animation remain follow-up work. The browser demo is intentionally small and StackBlitz-friendly.
