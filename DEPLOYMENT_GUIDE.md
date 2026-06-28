# VK Quiz: деплой на реальный хостинг

## Что будет в продакшене

- **Vercel** — `apps/web`, сайт VK Quiz.
- **Neon PostgreSQL** — база данных.
- **Render** — `apps/realtime-server`, Socket.IO для live-комнат.
- **Brevo SMTP** или **Resend** — реальные письма подтверждения email.
- **GitHub** — репозиторий и автодеплой.

## 0. Перед началом

Нужно создать аккаунты:

1. GitHub
2. Vercel
3. Neon
4. Render
5. Brevo или Resend

## 1. Залить проект на GitHub

```powershell
cd D:\vk-quiz-production-ready
git init
git add .
git commit -m "VK Quiz production ready"
git branch -M main
git remote add origin https://github.com/YOUR_LOGIN/vk-quiz.git
git push -u origin main
```

## 2. Создать PostgreSQL в Neon

1. Создай новый проект в Neon.
2. Скопируй connection string.
3. Убедись, что в конце есть `?sslmode=require`.
4. Это значение понадобится как `DATABASE_URL`.

Пример:

```env
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"
```

## 3. Подготовить базу

Локально временно вставь Neon `DATABASE_URL` в `.env` и выполни:

```powershell
npm.cmd install
npm.cmd run db:generate
npm.cmd run db:push:prod
npm.cmd run db:seed
```

Для учебного MVP `db:push:prod` проще, потому что текущий проект развивался без набора production migrations.

## 4. Задеплоить realtime-сервер на Render

В Render создай **New Web Service** из GitHub-репозитория.

Настройки:

```txt
Name: vk-quiz-realtime
Runtime: Node
Build command: npm install && npm run db:generate && npm run build -w @quizpulse/realtime-server
Start command: npm run start -w @quizpulse/realtime-server
Health check path: /health
```

Environment variables:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
WEB_ORIGIN=https://ТВОЙ-САЙТ.vercel.app
```

После деплоя Render даст URL вроде:

```txt
https://vk-quiz-realtime.onrender.com
```

Его надо вставить в Vercel как `NEXT_PUBLIC_REALTIME_URL`.

## 5. Настроить письма через Brevo SMTP

В Brevo:

1. Создай аккаунт.
2. Перейди в SMTP / Transactional emails.
3. Получи SMTP key.
4. В Vercel добавь:

```env
EMAIL_REQUIRE_VERIFICATION=true
EMAIL_PROVIDER=smtp
EMAIL_FROM="VK Quiz <noreply@your-domain.com>"
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=твой_brevo_login
SMTP_PASSWORD=твой_brevo_smtp_key
```

Если домена пока нет, можно использовать подтверждённый sender email в Brevo. Для более серьёзного вида лучше купить домен и настроить SPF/DKIM.

## 6. Задеплоить сайт на Vercel

В Vercel импортируй GitHub-репозиторий.

Настройки проекта:

```txt
Framework Preset: Next.js
Build Command: npm run build:web
Install Command: npm install
```

Environment variables для Vercel:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
AUTH_SECRET=длинный_случайный_секрет
APP_URL=https://ТВОЙ-САЙТ.vercel.app
NEXT_PUBLIC_REALTIME_URL=https://vk-quiz-realtime.onrender.com
EMAIL_REQUIRE_VERIFICATION=true
EMAIL_PROVIDER=smtp
EMAIL_FROM="VK Quiz <noreply@your-domain.com>"
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=...
SMTP_PASSWORD=...
```

После первого деплоя обнови `APP_URL`, если Vercel дал другой домен.

## 7. Проверка после деплоя

Проверь:

1. Регистрация нового пользователя.
2. Приходит письмо подтверждения.
3. Ссылка `/verify-email?token=...` подтверждает аккаунт.
4. Вход после подтверждения работает.
5. Организатор создаёт квиз.
6. Организатор запускает live-комнату.
7. Участник входит по коду или QR.
8. Projector mode показывает вопрос.
9. После завершения появляется лидерборд.
10. Solo-режим и рейтинг работают.

## 8. Важное про бесплатный Render

На бесплатном Render realtime-сервер может засыпать при простое. Для защиты проекта это нормально, но первый вход после паузы может быть медленным. Для стабильного реального мероприятия лучше платный Render/Railway/Fly/VPS.
