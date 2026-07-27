# Mini 3D Engine MVP: техническое задание

> Базовая спецификация MVP. Не переписывать задним числом. Все будущие возможности добавлять отдельными разделами или документами.

## 1. Цель

Создать компактную TypeScript-библиотеку для отображения и управления интерактивными 3D-сценами в браузере. Библиотека должна покрывать базовый сценарий Three.js: создать сцену, добавить объекты, настроить камеру и свет, запустить рендеринг и обрабатывать действия пользователя.

## 2. Стек

- TypeScript, strict mode
- WebGL 2 как основной графический API
- Vite для разработки и сборки
- Vitest для unit-тестов
- ESLint и Prettier
- npm-пакет с ESM-сборкой
- Renderer должен допускать будущий WebGPU backend

## 3. Публичный API

Обязательные сущности: `Engine`, `Scene`, `Node`, `Camera`, `PerspectiveCamera`, `OrthographicCamera`, `Mesh`, `Geometry`, `BufferGeometry`, `BufferAttribute`, `BasicMaterial`, `StandardMaterial`, `Light`, `AmbientLight`, `DirectionalLight`, `PointLight`, `Vector2`, `Vector3`, `Vector4`, `Matrix4`, `Quaternion`, `Euler`, `Color`, `Raycaster`, `WebGLRenderer`.

Пример:

```ts
const engine = new Engine({ canvas });
const cube = new Mesh(
  new BoxGeometry(1, 1, 1),
  new BasicMaterial({ color: '#4f8cff' })
);
cube.position.z = -5;
engine.scene.add(cube);
engine.start(({ deltaTime }) => {
  cube.rotation.y += deltaTime;
});
```

## 4. Функциональные требования

### 4.1 Математика

Реализовать Vector2, Vector3, Vector4, Matrix4, Quaternion, Euler и Color. Поддержать сложение, масштабирование, нормализацию, интерполяцию, трансформации и преобразование локальных координат в мировые.

### 4.2 Scene graph

`Node` поддерживает position, rotation/quaternion, scale, parent, children, add, remove, clear, visible, name, localMatrix, worldMatrix и обход дочерних объектов. `Scene` является корнем графа и хранит фон, активную камеру и источники света.

### 4.3 Геометрия

В MVP входят BufferGeometry, BufferAttribute, BoxGeometry, PlaneGeometry и SphereGeometry. Геометрия хранит позиции, нормали, UV и индексы по мере поддержки конкретным примитивом. GPU-ресурсы освобождаются через dispose.

### 4.4 Материалы

В MVP входят BasicMaterial и StandardMaterial, цвет, прозрачность, alpha test, double-sided, wireframe, roughness и metalness. Shader-программы должны компилироваться с понятными ошибками и кешироваться.

### 4.5 Renderer

WebGLRenderer создаёт WebGL2 context, очищает color/depth buffers, рендерит сцену через камеру, поддерживает depth test/write, viewport, canvas size и device pixel ratio, базовую сортировку прозрачности, понятную ошибку при недоступном WebGL2 и dispose.

### 4.6 Камеры

Реализовать PerspectiveCamera и OrthographicCamera, projection matrix, aspect ratio, resize, lookAt и updateProjectionMatrix.

### 4.7 Свет

Поддержать ambient, directional и point lights. Ограничение количества источников допускается на уровне MVP.

### 4.8 Интерактивность

Поддержать pointer move/down/up, wheel, normalized device coordinates, Raycaster, пересечения с Mesh и базовые OrbitControls. Физика и сложные touch-жесты не входят в исходный MVP.

### 4.9 Animation loop

Engine поддерживает start, stop, resize, deltaTime, elapsed time, ограничение большого deltaTime, обработку переключения вкладок и dispose.

## 5. Нефункциональные требования

- TypeScript strict mode
- отсутствие runtime-зависимостей
- ESM и tree-shaking
- единая точка экспорта публичного API
- документация публичных классов
- unit-тесты математики, scene graph и raycasting
- demo с кубом, светом, выбором объекта и resize
- мобильный viewport не должен ломать layout и touch-ввод

## 6. Структура

```text
src/core, src/math, src/cameras, src/geometry, src/materials,
src/objects, src/lights, src/rendering, src/interaction
examples/
tests/
docs/
```

## 7. Этапы

1. Репозиторий, сборка, линтеры и тесты.
2. Математика и Node.
3. Scene, камеры и transform pipeline.
4. WebGL renderer.
5. BufferGeometry, Mesh и примитивы.
6. Материалы и shaders.
7. Свет, depth test и прозрачность.
8. Resize, animation loop и освобождение ресурсов.
9. Raycasting, события и OrbitControls.
10. Документация, demo и npm-релиз.

## 8. Критерии готовности

Пользователь может установить пакет, создать canvas, сцену и перспективную камеру, добавить куб/плоскость/сферу, применить материал, управлять камерой, выбрать объект кликом, запустить анимацию, изменить размер окна и освободить GPU-ресурсы.

## 9. Ограничения

Физика, glTF, текстуры, post-processing, WebGPU, редактор, ECS и сложная анимация не являются частью исходного MVP. Они добавляются только отдельными расширениями и не меняют этот документ.
