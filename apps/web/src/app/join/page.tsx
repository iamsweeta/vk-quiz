'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { DEMO_ROOM_CODE, PRIVATE_DEMO_ROOM_CODE } from '@quizpulse/shared';

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoom = searchParams.get('room') || DEMO_ROOM_CODE;
  const [code, setCode] = useState(initialRoom);
  const [nickname, setNickname] = useState('Игрок');
  const [roleBlocked, setRoleBlocked] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        const role = data?.user?.role;
        setRoleBlocked(role === 'ORGANIZER' || role === 'ADMIN');
      })
      .catch(() => setRoleBlocked(false))
      .finally(() => setAuthChecked(true));
  }, []);

  async function switchToParticipant() {
    const response = await fetch('/api/auth/switch-role', { method: 'POST' });
    if (response.ok) window.location.reload();
  }

  function joinRoom() {
    const normalizedCode = code.trim().toUpperCase();
    const normalizedName = nickname.trim() || 'Игрок';
    router.push(`/play/${normalizedCode}?name=${encodeURIComponent(normalizedName)}`);
  }

  if (!authChecked) return <Card>Проверяем роль...</Card>;

  if (roleBlocked) {
    return (
      <Card>
        <div className="text-sm font-bold text-cyan">Режим организатора</div>
        <h1 className="mt-3 text-4xl font-black">Войти по коду можно только участнику</h1>
        <p className="mt-3 leading-7 text-[color:var(--muted)]">
          Организатор проводит квизы и управляет комнатами. Чтобы отвечать на вопросы, переключитесь на роль участника.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button onClick={switchToParticipant}>Стать участником</Button>
          <Button href="/dashboard/organizer" variant="ghost">Кабинет организатора</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="text-sm font-bold text-cyan">Подключение к live-квизу</div>
      <h1 className="mt-3 text-4xl font-black">Войти по коду комнаты</h1>
      <p className="mt-3 text-[color:var(--muted)]">
        Для демо используй публичный код {DEMO_ROOM_CODE} или приватный live-код {PRIVATE_DEMO_ROOM_CODE}.
      </p>

      <div className="mt-8 grid gap-4">
        <label className="grid gap-2 text-sm font-bold">
          Код комнаты
          <Input value={code} onChange={(event) => setCode(event.target.value)} />
        </label>
        <label className="grid gap-2 text-sm font-bold">
          Никнейм
          <Input value={nickname} onChange={(event) => setNickname(event.target.value)} />
        </label>
        <Button onClick={joinRoom}>Подключиться</Button>
      </div>
    </Card>
  );
}

export default function JoinPage() {
  return (
    <AppShell>
      <section className="mx-auto max-w-lg px-5 py-16">
        <Suspense fallback={<Card>Загрузка формы подключения...</Card>}>
          <JoinForm />
        </Suspense>
      </section>
    </AppShell>
  );
}
