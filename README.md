# Mini 3D Engine

Компактная TypeScript/WebGL2-библиотека для интерактивных 3D-сцен.

## Документация

- [API Reference](docs/API.md), полный текущий публичный API
- [Architecture](docs/ARCHITECTURE.md), слои и правила изменений
- [MVP specification](docs/MVP-SPEC.md), неизменяемая базовая спецификация
- [Extensions](docs/EXTENSIONS.md), текстуры, physics и post-processing
- [Roadmap and technical specification](docs/ROADMAP-TZ.md), следующий цикл фич
- [Contributing](docs/CONTRIBUTING.md), обязательные тесты и обновление docs
- [Audit and remediation](docs/AUDIT-TZ.md), разбор дефектов и план работ

## Что реализовано

В движке есть scene graph с Euler/quaternion-поворотами, TRS-матрицы,
Perspective/Orthographic cameras с `lookAt`, WebGL2 renderer с depth/culling,
сортировкой прозрачности по глубине и освобождением GPU-ресурсов,
Basic/Standard materials, diffuse Texture2D maps с мип-мапами,
Box/Plane/Sphere/Cylinder/Torus/Capsule geometry с корректными UV,
Ambient/Directional/Point/Spot/Hemisphere lights (Spot — настоящий конус),
Raycaster с пересечением треугольников, OrbitControls с focus, SimplePhysics,
PostProcess, GLTFLoader для JSON glTF/GLB и AnimationClip/AnimationMixer.

Состояние качества: 330 тестов, `npm run verify` зелёный. История аудита и
разбор исправленных дефектов — в [AUDIT-TZ.md](docs/AUDIT-TZ.md).

## Запуск

```bash
npm install
npm run dev      # витрина примеров
npm run verify   # format + lint + typecheck + test + build
```

Отдельные проверки: `npm run lint`, `npm run typecheck`, `npm run test`,
`npm run test:coverage`, `npm run build`.

Главная страница примеров: `index.html`. Она содержит scene browser с геометрией, материалами, procedural/image textures, lighting, physics, interaction, post-processing и glTF model scenes.

## Правило проекта

Каждое изменение `src/` сопровождается тестом, актуализацией docs и, если функция пользовательская, example scene. Базовый MVP не переписывается задним числом, новые возможности добавляются отдельными расширениями.
