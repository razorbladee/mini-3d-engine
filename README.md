# Mini 3D Engine

Компактная TypeScript/WebGL2-библиотека для интерактивных 3D-сцен.

## Документация

- [API Reference](docs/API.md), полный текущий публичный API
- [Architecture](docs/ARCHITECTURE.md), слои и правила изменений
- [MVP specification](docs/MVP-SPEC.md), неизменяемая базовая спецификация
- [Extensions](docs/EXTENSIONS.md), текстуры, physics и post-processing
- [Roadmap and technical specification](docs/ROADMAP-TZ.md), следующий цикл фич
- [Contributing](docs/CONTRIBUTING.md), обязательные тесты и обновление docs

## Что реализовано

В движке есть scene graph, TRS-матрицы, Perspective/Orthographic cameras, WebGL2 renderer с depth/culling и lighting, Basic/Standard materials, diffuse Texture2D maps, Box/Plane/Sphere/Cylinder/Torus/Capsule geometry, Ambient/Directional/Point/Spot/Hemisphere lights, Raycaster, OrbitControls с focus, SimplePhysics, PostProcess, GLTFLoader для JSON glTF/GLB и базовый AnimationClip/AnimationMixer.

## Запуск

```bash
npm install
npm run dev
npm run build
npm run test
```

Главная страница примеров: `index.html`. Она содержит scene browser с геометрией, материалами, procedural/image textures, lighting, physics, interaction, post-processing и glTF model scenes.

## Правило проекта

Каждое изменение `src/` сопровождается тестом, актуализацией docs и, если функция пользовательская, example scene. Базовый MVP не переписывается задним числом, новые возможности добавляются отдельными расширениями.
