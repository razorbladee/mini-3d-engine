# Расширения движка

## Текстуры

```ts
const texture = await Texture2D.load('/assets/grid.png');
const textureFromDom = Texture2D.fromImage(imageElement);
```

`Texture2D` пока отвечает только за безопасную загрузку изображения и декодирование. Подключение sampler uniforms к материалам будет следующим расширением.

## Простая физика

`SimplePhysics` интегрирует velocity, gravity и пол пола `y = 0`:

```ts
const physics = new SimplePhysics();
physics.addBody(cube, new Vector3(0, 4, 0));
engine.start(({ deltaTime }) => physics.step(deltaTime));
```

Это не physics engine: нет вращения, столкновений между телами, трения или continuous collision detection.

## Post-processing

`PostProcess` хранит последовательность pass-объектов:

```ts
const post = new PostProcess().add({
  apply(input, output, gl) {
    // bind shader, sample input, draw fullscreen triangle
  }
});
```

Текущий контракт intentionally низкоуровневый. Первым реальным pass будет цветокоррекция, затем vignette и bloom.

## Совместимость с Redmi

Редактор должен оставаться usable на узких экранах: панели превращаются в горизонтально прокручиваемые секции, canvas получает `touch-action: none`, DPR ограничивается для слабых устройств, а отсутствие WebGL2 показывает понятный fallback вместо белого экрана.
