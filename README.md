# Mini 3D Engine

Small TypeScript/WebGL2 library for interactive 3D scenes.

## Documentation

- [MVP specification](docs/MVP-SPEC.md), baseline document, do not rewrite
- [Extensions](docs/EXTENSIONS.md), textures, simple physics, and post-processing
- [Live showcase](https://stackblitz.com/github/razorbladee/mini-3d-engine), three browser examples

## What is implemented

The repository includes the original MVP plus small extension APIs: `Texture2D` for async image decoding, `SimplePhysics` for gravity and a floor constraint, and `PostProcess` for ordered render passes. The default demo page shows all three with interactive controls.

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

This is an MVP, not a Three.js replacement. glTF, WebGPU, advanced lighting, editor gizmos, and advanced animation remain follow-up work. The immutable baseline is in `docs/MVP-SPEC.md`; future additions go into new documentation or extension modules.
