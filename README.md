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

Состояние качества проверяется командой `npm run verify`. История аудита и
разбор исправленных дефектов — в [AUDIT-TZ.md](docs/AUDIT-TZ.md).

## Запуск

```bash
npm install
npm run dev      # витрина примеров
npm run verify   # format + lint + typecheck + test + build
```

Отдельные проверки: `npm run lint`, `npm run typecheck`, `npm run test`,
`npm run test:coverage`, `npm run build`.

Главная страница примеров: `index.html`. Первой открывается полностью
процедурная low-poly сцена леса с рельефом, прудом, деревьями, кустарниками,
брёвнами, пнями, скальной группой, травой, облаками и мягкими направленными
тенями — без внешних моделей. Рядом находится идентичная по составу сцена на
`ShaderMaterial`: toon lighting, процедурные оттенки, ветер, вода и PCF-тени
реализованы пользовательским GLSL. Третий вариант объединяет эти shaders с
шестью временными web textures для земли, листвы, воды, облаков, камня и
дерева. Четвёртый cinematic-вариант добавляет triplanar mapping, detail/normal
maps, anisotropic filtering, улучшенный ветер, Fresnel-воду, процедурное небо,
атмосферу и filmic tone mapping. Scene browser также покрывает геометрию, материалы,
transforms, procedural/image textures, lighting, cameras, bounds,
input, frustum culling, particles, physics, animation, assets, GPU resources,
scene inspection, renderer/audio boundaries, post-processing и glTF/GLB.
Каждая сцена показывает FPS, frame time, количество видимых meshes/vertices,
размер canvas, DPR и специфичные для примера показатели.

## Правило проекта

Каждое изменение `src/` сопровождается тестом, актуализацией docs и, если функция пользовательская, example scene. Базовый MVP не переписывается задним числом, новые возможности добавляются отдельными расширениями.
