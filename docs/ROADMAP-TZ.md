# ТЗ: следующий цикл Mini 3D Engine

## Цель

Превратить MVP в небольшой, предсказуемый engine core для browser interactive scenes, не ломая WebGL2, текущие demos и tree-shaking.

## Фаза 1, документация и API discipline

- полный API reference
- architecture rules
- docs обязаны обновляться вместе с кодом
- public API smoke tests

## Фаза 2, animation and assets

- `AnimationClip`: immutable channels/keyframes
- `AnimationMixer`: play, stop, pause, loop, timeScale, update
- `GLTFLoader`: multiple primitives, external buffers/images, PBR baseColorTexture, matrix/TRS, useful diagnostics
- `AssetManager`: deduplicated URL loads, cache, abort and progress hooks

## Фаза 3, renderer

- backend interface
- render state cache
- normal matrix для non-uniform scale
- transparent sorting, alpha test, wireframe
- optional MSAA/antialias configuration
- WebGPU adapter boundary без обязательного WebGPU runtime

## Фаза 4, interaction and production

- bounds and frustum culling
- input abstraction for mouse/touch/keyboard/gamepad
- debug helpers, inspector and performance metrics
- particles and audio hooks
- physics adapter boundary

## Приоритет

Сначала надёжность asset/render pipeline, затем animation, затем renderer quality, затем production tooling. Новые фичи не принимаются без tests, docs и example.

## Definition of Done

`npm run build` и `npm run test` проходят; docs/API.md и docs/ROADMAP-TZ.md актуальны; новая фича доступна через public API, имеет отдельный модуль, тест и demo; существующие demo-сцены не исчезают.
