# Contributing

Пиши код небольшими модулями. Не переписывай рабочую витрину целиком ради одной фичи.

Перед commit:

```bash
npm run build
npm run test
```

Для каждого изменения:

- добавь или обнови тест;
- обнови `docs/API.md` или профильный документ;
- обнови `README.md`, если меняется public API или запуск;
- добавь example scene для пользовательской возможности;
- проверь отсутствие regressions в showcase registry;
- не добавляй runtime dependency без отдельного решения в архитектуре.

## Commit checklist

`src/`, `tests/`, `docs/`, `examples/` должны отражать одну и ту же версию поведения.
