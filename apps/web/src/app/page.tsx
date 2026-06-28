import { ArrowRight } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { BrainPulseMark } from '@/components/brand/BrandLogo';
import { IconTile, ProductIcon, RankBadge, type ProductIconName } from '@/components/brand/ProductIcon';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';
import { Card } from '@/components/ui/Card';
import { DEMO_ROOM_CODE } from '@quizpulse/shared';

export default function Home() {
  const features: Array<[ProductIconName, string, string]> = [
    ['room', 'Live-комнаты', 'Участники подключаются по коду и видят вопросы синхронно.'],
    ['accuracy', 'Честные баллы', 'Одиночный выбор даёт полный балл за правильный ответ, а multiple-choice поддерживает частичные баллы.'],
    ['mobile', 'Mobile-first', 'Адаптивный интерфейс для телефонов и ноутбуков.'],
    ['leaderboard', 'Лидерборд', 'Финальный рейтинг для всех участников.'],
    ['catalog', 'Каталог квизов', 'Публичные квизы можно выбрать, приватные открыть только по коду.'],
    ['auth', 'Авторизация', 'Регистрация, вход и защищённые кабинеты по ролям.'],
    ['theme', 'Light / Dark / Pink', 'Переключение темы и PWA-установка сохраняются в браузере.'],
    ['room', 'QR + Projector', 'Комната открывается по QR-коду, а вопрос можно вывести на экран ведущего.'],
    ['accuracy', 'Ачивки и аналитика', 'Участники получают достижения, организатор видит сложные вопросы.' ]
  ];

  const leaderboard = [
    ['Алина', 4000],
    ['Марк', 3000],
    ['София', 2000],
    ['Данил', 1000]
  ] as const;

  return (
    <AppShell>
      <section className="noise-overlay relative mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div>
          <Badge>Каталог • Live-комнаты • Solo-режим • Авторизация</Badge>
          <div className="mt-6 inline-flex items-center gap-4 rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--glass)] px-5 py-4 shadow-soft">
            <span className="grid h-14 w-14 place-items-center rounded-3xl bg-cyan/10 text-cyan">
              <BrainPulseMark className="h-10 w-10" />
            </span>
            <div>
              <div className="text-3xl font-black">VK<span className="text-cyan"> Quiz</span></div>
              <div className="text-xs font-black uppercase tracking-[0.28em] text-[color:var(--muted)]">интерактивные квизы</div>
            </div>
          </div>
          <h1 className="mt-6 text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
            Квизы в реальном времени для обучения, игр и командных встреч.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[color:var(--muted)]">
            Создавайте вопросы, публикуйте квизы в каталог, скрывайте приватные квизы за кодом доступа, проходите квизы самостоятельно или запускайте live-комнату с участниками.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="/catalog">Открыть каталог <ArrowRight size={18} /></Button>
            <Button href="/register" variant="ghost">Создать аккаунт</Button>
            <Button href="/join" variant="ghost">Войти по коду</Button>
            <PwaInstallButton />
          </div>

          <div className="mt-10 grid max-w-2xl gap-3 sm:grid-cols-3">
            {[
              ['Solo', 'без организатора'],
              ['Live', 'комнаты по коду'],
              ['Partial', 'умные баллы']
            ].map(([value, label]) => (
              <div key={label} className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--glass)] p-5 backdrop-blur-xl">
                <div className="text-2xl font-black text-[color:var(--foreground)]">{value}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-wide text-[color:var(--muted)]">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <Card className="relative overflow-hidden p-0">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-cyan/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative border-b border-[color:var(--border)] p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-[color:var(--muted)]">Демо-комната</div>
                <div className="mt-2 text-5xl font-black tracking-wider md:text-6xl">{DEMO_ROOM_CODE}</div>
              </div>
              <IconTile name="leaderboard" className="h-16 w-16 rounded-3xl" />
            </div>
          </div>

          <div className="relative p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-black uppercase tracking-wide text-cyan">Лидерборд</div>
              <div className="rounded-full bg-success/15 px-3 py-1 text-xs font-black text-success">АКТИВНО</div>
            </div>
            <div className="grid gap-3">
              {leaderboard.map(([name, score], index) => (
                <div key={name} className="flex items-center justify-between rounded-3xl border border-[color:var(--border)] bg-[color:var(--glass)] p-4">
                  <div className="flex items-center gap-3">
                    <RankBadge rank={index + 1} />
                    <div>
                      <div className="font-black">{index + 1}. {name}</div>
                      <div className="text-xs text-[color:var(--muted)]">правильный ответ</div>
                    </div>
                  </div>
                  <b className="text-xl">{score}</b>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>


      <section className="mx-auto max-w-7xl px-5 pb-16">
        <Card className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="border-b border-[color:var(--border)] bg-cyan/10 p-7 lg:border-b-0 lg:border-r">
              <Badge>Быстрый старт</Badge>
              <h2 className="mt-4 text-4xl font-black">Onboarding за 3 шага</h2>
              <p className="mt-3 text-[color:var(--muted)]">Организатор сразу понимает, что делать: создать квиз, запустить комнату и показать QR участникам.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href="/dashboard/organizer/quizzes/new">Создать квиз</Button>
                <Button href="/dashboard/organizer/quizzes" variant="ghost">Запустить live</Button>
              </div>
            </div>
            <div className="grid gap-3 p-7 md:grid-cols-3">
              {[
                ['1', 'Создать квиз', 'Добавьте вопросы вручную или импортируйте их из текста.'],
                ['2', 'Запустить комнату', 'Откройте live-комнату и экран ведущего.'],
                ['3', 'Показать QR', 'Участники сканируют QR и входят без долгих инструкций.']
              ].map(([step, title, text]) => (
                <div key={step} className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--glass)] p-5">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan/10 text-xl font-black text-cyan">{step}</div>
                  <h3 className="mt-4 text-xl font-black">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-16 md:grid-cols-2 lg:grid-cols-3">
        {features.map(([icon, title, text]) => (
          <Card key={title}>
            <ProductIcon name={icon} className="mb-4 h-8 w-8 text-cyan" />
            <b className="text-xl">{title}</b>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">{text}</p>
          </Card>
        ))}
      </section>
    </AppShell>
  );
}
