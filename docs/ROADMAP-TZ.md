# ТЗ: следующий цикл Mini 3D Engine

## Выполнено в текущем цикле

- полная API/архитектурная документация и contributing rules;
- AnimationClip/AnimationMixer с interpolation, loop, pause/resume;
- базовый GLTFLoader с JSON/GLB, external buffers, indexed/interleaved attributes, transforms, multiple primitives и bounds;
- AssetManager с deduplicated URL cache и failed-load eviction;
- InputMap для keyboard action bindings;
- SphereBounds/AabbBounds;
- PerformanceMetrics;
- новые primitive geometry и light types.

## Следующий production-слой

- подключить glTF external image maps и PBR baseColorTexture;
- связать glTF animation channels с AnimationMixer;
- normal matrix для non-uniform scale;
- прозрачность, alpha test, wireframe и render-state cache;
- renderer backend interface и WebGPU adapter boundary;
- frustum culling на SphereBounds/AabbBounds;
- particles, debug inspector, audio hooks и physics adapter.

## Definition of Done

`npm run build` и `npm run test` проходят; docs актуальны; новая фича имеет отдельный модуль, публичный экспорт, тест и demo; существующие demo-сцены не исчезают.
