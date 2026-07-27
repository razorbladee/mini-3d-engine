# API Reference

Актуальная карта публичного API Mini 3D Engine. Обновляется вместе с `src/`.

## Core
`Engine` управляет Scene, Camera, WebGLRenderer, loop, resize и dispose. `Node` хранит TRS, parent/children, visibility, matrices и traversal. `Scene` является корнем. `PerformanceMetrics` считает frames, elapsed, deltaTime и fps.

## Math
`Vector2`, `Vector3`, `Vector4`, `Matrix4`, `Quaternion`, `Euler`, `Color`.

## Geometry
`BufferGeometry` хранит positions, normals, uvs, bounds и GPU buffers. Примитивы: Box, Plane, Sphere, Cylinder, Torus, Capsule.

## Materials and textures
`BasicMaterial` и `StandardMaterial`; StandardMaterial поддерживает roughness, metalness и diffuse Texture2D map. `Texture2D` загружает изображения и кеширует GPU textures.

## Lights and cameras
Ambient, Directional, Point, Spot и Hemisphere lights. Perspective и Orthographic cameras. OrbitControls поддерживает drag, touch, zoom, reset и focus.

## Interaction and production foundations
`Raycaster` вычисляет пересечения. `InputMap` связывает действия с клавишами. `SphereBounds` и `AabbBounds` предоставляют базовые проверки bounds. `AssetManager` дедуплицирует URL-загрузки, сообщает старт/завершение progress и сбрасывает failed promises. `PerformanceMetrics` даёт runtime counters.

## Renderer
WebGLRenderer поддерживает depth test/write, culling, transparent sorting, alpha blending, depth-mask handling, cached geometry buffers и inverse-transpose normal matrix для non-uniform scale.

## Loading and animation
`GLTFLoader` читает JSON glTF/GLB, indexed/interleaved attributes, multiple primitives, transforms и bounds. `AnimationClip` и `AnimationMixer` поддерживают keyframe interpolation, play, stop, pause, resume, loop, timeScale и non-loop playback. Skinning, glTF image maps и animation channel binding остаются следующим слоем.

## Extensions
`SimplePhysics` предоставляет gravity, velocity и floor constraint. `PostProcess` хранит ordered WebGL passes.

## Rule
Любое изменение кода сопровождается тестом, обновлением документации и example при наличии пользовательского сценария.
