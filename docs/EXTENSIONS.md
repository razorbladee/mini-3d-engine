# Расширения движка

## Texture2D и texture maps

```ts
const texture = await Texture2D.load('/assets/grid.png');
const material = new StandardMaterial({ map: texture, roughness: 0.4 });
const fromDom = Texture2D.fromImage(imageElement);
```

`Texture2D` декодирует изображения, кеширует WebGL texture на context и умеет `dispose(gl)`. `BasicMaterial` и `StandardMaterial` принимают `map`. Geometry предоставляет `uvs`.

## GLTFLoader

```ts
const model = await new GLTFLoader().load('/assets/model.gltf');
scene.add(model.scene);
```

Поддерживаются JSON glTF и GLB, data/external buffers, interleaved accessors, indexed primitives, несколько primitives на mesh, node hierarchy, TRS/matrix transforms и bounds. Текущий scope не включает skinning, animation playback и image maps из glTF material descriptors.

## AnimationMixer

```ts
const clip = new AnimationClip('pulse', 1, [
  {
    keyframes: [
      { time: 0, value: 0 },
      { time: 1, value: 1 },
    ],
    apply: (value) => mesh.scale.setScalar?.(value),
  },
]);
const mixer = new AnimationMixer().play(clip);
engine.start(({ deltaTime }) => mixer.update(deltaTime));
```

`AnimationMixer` поддерживает play, stop, pause, resume, loop и non-loop playback. Это независимый слой каналов; glTF animation channels будут подключены отдельным этапом.

## Простая физика

`SimplePhysics` интегрирует velocity, gravity и пол `y = 0`. Это не полноценный physics engine: нет столкновений между телами, friction, rotation dynamics или CCD.

## Post-processing

`PostProcess` хранит последовательность pass-объектов и намеренно оставляет низкоуровневый WebGL-контракт. Полноценные color grading, vignette и bloom запланированы в [ROADMAP-TZ.md](ROADMAP-TZ.md).

## Совместимость

Editor и examples должны оставаться usable на узких экранах. Canvas использует `touch-action: none`, renderer учитывает DPR, отсутствие WebGL2 должно давать понятную ошибку вместо белого экрана.
