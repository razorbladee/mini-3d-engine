# API Reference

Актуальная карта публичного API Mini 3D Engine. Этот файл обновляется вместе с изменениями `src/`.

## Core

`Engine` владеет `Scene`, `Camera` и `WebGLRenderer`, запускает requestAnimationFrame, ограничивает delta time, обрабатывает resize и освобождает ресурсы через `dispose()`.

`Node` является базовым узлом scene graph: `position`, `rotation`, `scale`, `parent`, `children`, `visible`, `name`, `add`, `remove`, `updateWorldMatrix`, `traverse`. `Scene` является корнем графа и хранит активную камеру.

## Math

`Vector2`, `Vector3`, `Vector4`, `Matrix4`, `Quaternion`, `Euler`, `Color`. В текущем API доступны базовые операции векторов, TRS-композиция и инверсия матриц, нормализация, цветовые значения и преобразование Euler.

## Cameras and controls

`Camera` содержит projection/view matrices. `PerspectiveCamera` и `OrthographicCamera` обновляют projection. `OrbitControls` поддерживает pointer drag, touch, wheel zoom, reset и focus(target, distance).

## Geometry

`BufferGeometry` хранит `positions`, `normals`, `uvs`, bounding radius и GPU buffers. Примитивы: `BoxGeometry`, `PlaneGeometry`, `SphereGeometry`, `CylinderGeometry`, `TorusGeometry`, `CapsuleGeometry`.

Все примитивы должны генерировать triangle lists без вырожденных треугольников, с согласованным winding, нормалями и UV там, где они поддерживаются.

## Materials and textures

`BasicMaterial` предназначен для unlit-рендера. `StandardMaterial` добавляет `roughness`, `metalness` и diffuse `map`. `Texture2D.load(url)` асинхронно декодирует изображение, `fromImage(image)` оборачивает DOM image, `upload(gl)` кеширует GPU texture.

## Lights

`AmbientLight`, `DirectionalLight`, `PointLight`, `SpotLight`, `HemisphereLight`. WebGL2 renderer собирает источники сцены и передаёт их в lit shader. Ограничение количества источников является текущим MVP trade-off.

## Renderer

`WebGLRenderer` создаёт WebGL2 programs, включает depth test/culling, загружает geometry buffers один раз на контекст, применяет camera matrices, materials и lights. WebGPU пока не реализован, но renderer должен оставаться заменяемым backend-слоем.

## Interaction

`Raycaster.set(origin, direction)`, `setFromCamera(ndc, camera)`, `intersectObjects(meshes)` возвращает отсортированные пересечения с point и distance.

## Loaders

`GLTFLoader.load(url)`, `parseJson(json, base)`, `parseGlb(buffer, base)` строят Node/Mesh hierarchy, читают indexed/interleaved attributes, применяют TRS/matrix transforms и возвращают bounds/animations metadata. Skinning, animation playback и image maps находятся в следующем этапе.

## Extensions

`SimplePhysics` предоставляет gravity, velocity и floor constraint. `PostProcess` хранит ordered passes. Оба модуля не должны загрязнять core runtime dependencies.

## Examples

`examples/showcase-registry.ts` является источником правды для списка demo-сцен. При добавлении API добавляется демонстрационная сцена и запись в registry.
