'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function VerifyEmailClient({ token }: { token: string }) {
  const [state, setState] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Проверяем ссылку подтверждения...');

  useEffect(() => {
    if (!token) {
      setState('error');
      setMessage('Ссылка подтверждения неполная: нет token.');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
      .then(async (response) => {
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.message || 'Не удалось подтвердить email.');
        setState('success');
        setMessage('Email подтверждён. Сейчас можно пользоваться кабинетом.');
      })
      .catch((error) => {
        setState('error');
        setMessage(error.message || 'Не удалось подтвердить email.');
      });
  }, [token]);

  return (
    <AppShell>
      <section className="mx-auto grid min-h-[calc(100vh-90px)] max-w-2xl place-items-center px-5 py-12">
        <Card className="w-full text-center">
          <div className={`mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl ${state === 'success' ? 'bg-success/10 text-success' : state === 'error' ? 'bg-danger/10 text-danger' : 'bg-cyan/10 text-cyan'}`}>
            {state === 'success' ? <CheckCircle2 size={32} /> : state === 'error' ? <XCircle size={32} /> : <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan/20 border-t-cyan" />}
          </div>
          <h1 className="text-4xl font-black">Подтверждение email</h1>
          <p className="mx-auto mt-4 max-w-lg text-[color:var(--muted)]">{message}</p>
          <div className="mt-8 flex justify-center gap-3">
            <Button href="/login" variant="ghost">Войти</Button>
            <Button href="/dashboard/organizer">В кабинет</Button>
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
