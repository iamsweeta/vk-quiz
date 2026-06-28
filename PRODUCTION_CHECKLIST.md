# Production checklist для VK Quiz

## Обязательные переменные

- `DATABASE_URL`
- `AUTH_SECRET`
- `APP_URL`
- `NEXT_PUBLIC_REALTIME_URL`
- `EMAIL_REQUIRE_VERIFICATION=true`
- `EMAIL_PROVIDER=smtp` или `resend`
- `EMAIL_FROM`

## Проверить безопасность

- `AUTH_SECRET` не должен быть `change-this-secret-in-production`.
- `.env` нельзя коммитить в GitHub.
- Neon connection string хранить только в Vercel/Render env vars.
- SMTP password хранить только в Vercel env vars.
- Для настоящего домена настроить SPF/DKIM в Brevo или Resend.

## Проверить UX

- Регистрация открывает `/check-email`.
- Неподтверждённый пользователь не может войти.
- Повторная отправка письма работает.
- На телефоне корректно отображаются каталог, карточки и результат.
- Live-комната открывается по QR.
