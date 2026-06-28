'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function ResendVerificationForm({ defaultEmail = '' }: { defaultEmail?: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await response.json().catch(() => null);
    setLoading(false);
    if (!response.ok) {
      setError(data?.message || 'Не удалось отправить письмо.');
      return;
    }
    setMessage(data?.message || 'Письмо отправлено.');
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-8 grid max-w-md gap-3 text-left">
      <label className="grid gap-2 text-sm font-bold">
        Email для повторной отправки
        <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" type="email" />
      </label>
      {message && <div className="rounded-2xl border border-success/20 bg-success/10 p-3 text-sm font-bold text-success">{message}</div>}
      {error && <div className="rounded-2xl border border-danger/20 bg-danger/10 p-3 text-sm font-bold text-danger">{error}</div>}
      <Button type="submit" disabled={loading}>{loading ? 'Отправляем...' : 'Отправить письмо ещё раз'}</Button>
    </form>
  );
}
