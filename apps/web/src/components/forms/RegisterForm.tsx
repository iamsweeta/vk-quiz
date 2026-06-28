'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(data?.message || 'Не удалось создать аккаунт.');
      return;
    }

    router.push(`/check-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-bold">
        Имя
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Алина" autoComplete="name" />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Email
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" autoComplete="email" />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Пароль
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Минимум 6 символов" autoComplete="new-password" />
      </label>

      <div className="rounded-2xl border border-cyan/20 bg-cyan/10 p-3 text-sm text-cyan">
        Регистрация создаёт обычный аккаунт по почте. Роль выбирается уже при входе: участник или организатор.
        В dev-режиме письмо подтверждения появится в Mailpit: http://localhost:8025.
      </div>

      {error && <div className="rounded-2xl border border-danger/20 bg-danger/10 p-3 text-sm font-bold text-danger">{error}</div>}

      <Button type="submit" disabled={loading}>{loading ? 'Создаём...' : 'Создать аккаунт'}</Button>

      <p className="text-center text-sm text-[color:var(--muted)]">
        Уже есть аккаунт? <Link href="/login" className="font-bold text-cyan hover:underline">Войти</Link>
      </p>
    </form>
  );
}
