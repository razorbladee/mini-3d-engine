# ТЗ: следующий цикл Mini 3D Engine

## Выполнено в текущем цикле

- API/архитектурная документация и contributing rules;
- AnimationClip/AnimationMixer: interpolation, loop, pause/resume, timeScale;
- GLTFLoader: JSON/GLB, external buffers, indexed/interleaved attributes, transforms, multiple primitives и bounds;
- AssetManager: deduplicated URL cache, progress hooks и failed-load eviction;
- InputMap, SphereBounds/AabbBounds, PerformanceMetrics;
- primitive geometry, lighting, normal matrix, transparent sorting, blending и depth-mask;
- новые production foundation demos: animation, asset-manager, transparent, bounds-input;
- тесты и docs обновлены вместе с code changes.

## Следующий production-слой

- glTF external image maps и PBR baseColorTexture;
- glTF animation channels -> AnimationMixer;
- renderer backend interface и WebGPU adapter boundary;
- frustum culling;
- particles, debug inspector, audio hooks и physics adapter.

## Definition of Done

`npm run build` и `npm run test` проходят; docs актуальны; новая фича имеет модуль, public export, test и demo; existing demo scenes не исчезают.
