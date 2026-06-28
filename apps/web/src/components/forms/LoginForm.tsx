'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

type Role = 'PARTICIPANT' | 'ORGANIZER';

type AuthUser = {
  role: Role | 'ADMIN';
};

function targetForRole(role: AuthUser['role']) {
  return role === 'PARTICIPANT' ? '/dashboard/participant' : '/dashboard/organizer';
}

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('organizer@quizpulse.local');
  const [password, setPassword] = useState('demo1234');
  const [role, setRole] = useState<Role>('ORGANIZER');
  const [error, setError] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setVerificationRequired(false);
    setLoading(true);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });

    const data = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setVerificationRequired(Boolean(data?.verificationRequired));
      setError(data?.message || 'Не удалось войти.');
      return;
    }

    router.push(targetForRole(data.user.role));
    router.refresh();
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
      <label className="grid gap-2 text-sm font-bold">
        Email
        <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" autoComplete="email" />
      </label>
      <label className="grid gap-2 text-sm font-bold">
        Пароль
        <Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Пароль" autoComplete="current-password" />
      </label>

      <div className="grid gap-2 text-sm font-bold">
        Войти как
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--glass)] p-1">
          <button
            type="button"
            onClick={() => setRole('PARTICIPANT')}
            className={`rounded-xl px-3 py-3 text-sm font-black transition ${role === 'PARTICIPANT' ? 'bg-[color:var(--card-strong)] text-[color:var(--foreground)] shadow-soft' : 'text-[color:var(--muted)]'}`}
          >
            Участник
          </button>
          <button
            type="button"
            onClick={() => setRole('ORGANIZER')}
            className={`rounded-xl px-3 py-3 text-sm font-black transition ${role === 'ORGANIZER' ? 'bg-[color:var(--card-strong)] text-[color:var(--foreground)] shadow-soft' : 'text-[color:var(--muted)]'}`}
          >
            Организатор
          </button>
        </div>
        <p className="text-xs font-medium leading-5 text-[color:var(--muted)]">
          Роль выбирается при входе. После входа её можно переключить в верхней панели.
        </p>
      </div>

      {error && <div className="rounded-2xl border border-danger/20 bg-danger/10 p-3 text-sm font-bold text-danger">{error}</div>}
      {verificationRequired && (
        <Button href={`/check-email?email=${encodeURIComponent(email)}`} variant="ghost">Отправить / проверить письмо</Button>
      )}

      <Button type="submit" disabled={loading}>{loading ? 'Входим...' : role === 'ORGANIZER' ? 'Войти как организатор' : 'Войти как участник'}</Button>

      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--glass)] p-4 text-sm text-[color:var(--muted)]">
        Демо-аккаунты уже подтверждены:<br />
        <b className="text-[color:var(--foreground)]">organizer@quizpulse.local</b> / demo1234<br />
        <b className="text-[color:var(--foreground)]">participant@quizpulse.local</b> / demo1234
      </div>

      <p className="text-center text-sm text-[color:var(--muted)]">
        Нет аккаунта? <Link href="/register" className="font-bold text-cyan hover:underline">Зарегистрироваться</Link>
      </p>
    </form>
  );
}
