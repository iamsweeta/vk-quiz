# VK Quiz — заметные фичи

В этой сборке добавлены:

- QR-код для live-комнаты на экране организатора.
- Projector mode: `/host/[code]/projector` — большой экран ведущего с вопросом, таймером и количеством ответивших.
- Карточка результата solo-квиза с кнопкой «Поделиться результатом».
- PWA-режим: manifest + service worker, сайт можно установить на телефон.
- Ачивки после solo-прохождения: 100% точность, серия побед, сильный результат.
- Аналитика организатора: `/dashboard/organizer/analytics`.
- Импорт вопросов из текста в редакторе квиза.
- Публичная страница автора: `/authors/[id]`.
- Onboarding на главной: создать квиз → запустить комнату → показать QR.
- Дополнительный mobile polish для карточек и экранов.

## Импорт вопросов

Формат:

```txt
Столица Франции?
* Париж
Берлин
Мадрид

Какие технологии относятся к frontend?
* HTML
* CSS
* JavaScript
PostgreSQL
```

Правильный вариант можно пометить `*`, `+`, `[x]` или `правильно:`.

## Mobile UI polish update

- Host controls on small screens are now a compact 2x2 action grid instead of a crowded button row.
- Solo result stats are centered and compact on mobile.
- The result sharing block now shows only the share action button and status text.
- Retry/catalog buttons were removed from the result screen to reduce clutter.
