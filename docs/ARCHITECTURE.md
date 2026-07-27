# Архитектура

## Слои

- `math`: чистые структуры данных без DOM/WebGL.
- `core`: Node, Scene, Engine и lifecycle.
- `cameras`: projection/view state.
- `geometry`: CPU attributes, bounds и GPU upload metadata.
- `materials`: material data и shader selection.
- `lights`: scene nodes с параметрами освещения.
- `objects`: Mesh как связка geometry + material.
- `rendering`: WebGL2 backend, textures, shaders и post-processing.
- `interaction`: raycasting и input controls.
- `loaders`: внешние asset formats, прежде всего glTF.
- `physics`: отдельная optional simulation layer.

## Правила изменений

1. Новый публичный класс получает отдельный файл и экспорт из `src/index.ts`.
2. Renderer не должен содержать parser-логику форматов.
3. Loader не должен напрямую управлять камерой или DOM.
4. Geometry не должна зависеть от renderer.
5. Любая GPU resource имеет owner (`ResourceCache`), cache и dispose path.
6. Любая новая возможность получает тест и example scene.
7. Документация обновляется в том же commit, что и код.

## Render lifecycle

`Engine.start()` вызывает user update, затем `renderer.render(scene, camera)`, затем `endFrame()` у зарегистрированных через `Engine.track()` потребителей кадра. Renderer обновляет world matrices, собирает lights, сортирует меши по глубине вдоль оси взгляда, выбирает shader, bind-ит cached buffers/textures и рисует mesh. `Engine.stop()` останавливает loop, `dispose()` снимает listeners и освобождает **все** GPU-ресурсы через `ResourceCache`.

`Engine` типизирован интерфейсом `Renderer` и принимает `createRenderer`, поэтому backend действительно заменяем. Пересчёт проекции при resize принадлежит камере (`Camera.setViewportSize`), а не ядру.

## Решения из других движков

Полезные идеи, которые берём из Three.js/Babylon.js/Godot без копирования архитектуры: заменяемые renderer backends, asset manager и loaders, animation mixer, bounds/frustum culling, render graph/post-process chain, debug inspector, performance counters и WebXR-ready input boundary.
