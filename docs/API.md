# API Reference

Актуальная карта публичного API Mini 3D Engine. Обновляется вместе с `src/`.

## Core

`Engine` управляет Scene, Camera, Renderer, loop, resize и dispose. Принимает
`createRenderer` для подмены backend-а и `track(consumer)` для объектов,
которым нужен `endFrame()` в конце кадра (например `InputMap`). Большие
интервалы между кадрами обрезаются до 0.1 с.

`Node` хранит TRS, parent/children, visibility, matrices и traversal. Поворот
представлен двумя способами: `rotation` (Euler) и `quaternion`; последний
записанный считается источником истины — переключение через `useEuler()`,
`useQuaternion()` или `setRotationFromQuaternion()`. Есть `clear()`.
`Scene` является корнем. `PerformanceMetrics` считает frames, elapsed,
deltaTime и fps.

## Math

`Vector2`, `Vector3`, `Vector4`, `Matrix4`, `Quaternion`, `Euler`, `Color`.

`Vector3` поддерживает `dot`, `cross`, `lerp`, `distanceTo`, `applyMatrix4`,
`transformDirection`, `addScaledVector`, `setScalar`, `negate`, `equals`.
`Quaternion` — `setFromEuler`, `setFromAxisAngle`, `multiply`, `slerp`, `dot`.
`Matrix4` — `compose` (принимает Euler **с учётом `order`** или Quaternion),
`multiplyMatrices`, `premultiply`, `invert`, `lookAt`. `elements` выделяется
один раз и мутируется на месте, ссылка на буфер остаётся валидной.
`parseHexColor` — единственная реализация разбора hex, с валидацией.

## Geometry

`BufferGeometry` хранит positions, normals, uvs, `boundingRadius`,
`vertexCount` и `attributes` (views типа `BufferAttribute`). GPU-ресурсами
владеет renderer, а не геометрия. Примитивы: Box, Plane, Sphere, Cylinder,
Torus, Capsule — все с корректной CCW-намоткой, без вырожденных треугольников
и с собственными UV-развёртками.

## Materials and textures

`BasicMaterial` и `StandardMaterial`; StandardMaterial поддерживает roughness,
metalness и diffuse `Texture2D` map. `Texture2D` загружает изображения,
поддерживает `minFilter`/`magFilter`/`wrapS`/`wrapT`/`generateMipmaps`/`flipY`,
восстанавливает pixel-store после загрузки и даёт понятную ошибку при сбое.

`wireframe` рисует каждый треугольник как `LINE_LOOP`; `doubleSided` отключает
face culling, а `transparent` включает alpha blending с отключённой записью
gлубины.

## Lights and cameras

Ambient, Directional, Point, Spot и Hemisphere lights. **SpotLight — настоящий
конус**: учитываются позиция, направление, `angle`, `penumbra` и `distance`.
Ограничение — 4 источника каждого типа (`MAX_LIGHTS`).

Perspective и Orthographic cameras. `Camera.lookAt(target, up)` и
`setViewportSize(width, height)`. OrbitControls поддерживает drag, touch, zoom,
reset и focus; наведение на цель точно на любых углах.

## Interaction and production foundations

`Raycaster` выполняет broad phase по bounding sphere и narrow phase по
треугольникам (Möller–Trumbore), возвращая `point`, `normal` и `triangleIndex`;
`{ boundsOnly: true }` оставляет только быструю проверку. `InputMap` связывает
действия с клавишами, возвращает стабильные объекты и различает
`isDown`/`wasPressed`/`wasReleased`. `SphereBounds`, `AabbBounds` и `Frustum`
предоставляют visibility tests; Frustum извлекает 6 плоскостей из
view-projection матрицы. `AssetManager` дедуплицирует загрузки, считает
подписчиков и отменяет запрос только когда отписались все. `ParticleSystem`
моделирует CPU particles. `SceneInspector` строит debug snapshot. `AudioHooks`
и `PhysicsAdapter` задают optional boundaries без runtime-зависимостей.

## Renderer

`Renderer` задаёт backend contract, `WebGLRenderer implements Renderer`.
Поддерживает depth test/write, culling, сортировку по глубине **вдоль оси
взгляда камеры** (opaque front-to-back, transparent back-to-front), alpha
blending, depth-mask handling и inverse-transpose normal matrix для
non-uniform scale.

Имена uniform-ов заданы явными таблицами в `programs.ts` и сверяются с GLSL
тестом. `ResourceCache` — единственный владелец buffers, textures и programs;
`stats` сообщает их количество. `WebGLRenderer.resourceStats`,
`releaseGeometry()` и `releaseTexture()` доступны диагностическим инструментам.
`dispose()` освобождает всё созданное, повторный `render()` бросает ошибку.
Кадр в установившемся режиме не аллоцирует.

`WebGPURenderer` пока является явной boundary-заглушкой с понятной ошибкой,
WebGL2 остаётся default.

## Loading and animation

`GLTFLoader` читает JSON glTF/GLB, indexed/interleaved attributes, multiple
primitives, transforms и bounds. Вращения узлов сохраняются как кватернионы без
конвертации. Индексы аксессоров валидируются явно (включая индекс `0`).
`AnimationClip` и `AnimationMixer` поддерживают keyframe interpolation, play,
stop, pause, resume, loop, timeScale и non-loop playback. Skinning, glTF image
maps и animation channel binding остаются следующим слоем.

## Extensions

`SimplePhysics implements PhysicsAdapter`: gravity, velocity, настраиваемый
`floor`, `addBody` возвращает `PhysicsBody`, есть `dispose()`. `PostProcess`
хранит упорядоченную цепочку passes; каждый pass получает результат
предыдущего.

## Rule

Любое изменение кода сопровождается тестом, обновлением документации и example
при наличии пользовательского сценария.
