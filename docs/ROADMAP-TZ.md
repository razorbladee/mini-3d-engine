# ТЗ: следующий цикл Mini 3D Engine

## Выполнено

- API/архитектура/contributing docs;
- AnimationClip/AnimationMixer: interpolation, loop, pause/resume, timeScale;
- GLTFLoader: JSON/GLB, external buffers, indexed/interleaved attributes, transforms, multiple primitives и bounds;
- AssetManager, InputMap, SphereBounds/AabbBounds, PerformanceMetrics;
- primitive geometry, lighting, normal matrix, transparent sorting, blending, depth-mask;
- `Renderer` backend contract и явный WebGPURenderer boundary;
- `Frustum` для point/sphere tests;
- `ParticleSystem` CPU simulation;
- `AudioHooks` no-op boundary;
- `SceneInspector` snapshot helper;
- `PhysicsAdapter` extension boundary;
- roadmap modules, tests and docs synchronized.

## Осталось отдельным production backlog

- glTF external image maps и PBR baseColorTexture;
- glTF animation channels -> AnimationMixer;
- полноценный WebGPU backend;
- GPU frustum culling, particles renderer, inspector UI и audio backend.

## Definition of Done

`npm run verify` (format + lint + typecheck + test + build) проходит; docs
актуальны; новая фича имеет module, export, test и demo; existing demo scenes не
исчезают.

## Статус после аудита

Полный разбор дефектов и план работ — в [AUDIT-TZ.md](AUDIT-TZ.md). Этапы 0–7
выполнены: сборка и линтер зелёные, 330 тестов проходят, каждый исправленный
дефект закрыт тестом, который падал до правки.
