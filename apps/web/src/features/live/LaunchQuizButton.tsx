'use client';

import { Radio } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

export function LaunchQuizButton({ quizId, label = 'Запустить live' }: { quizId: string; label?: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function launch() {
    setLoading(true);
    setError('');

    const response = await fetch(`/api/quizzes/${quizId}/rooms`, { method: 'POST' });
    const data = await response.json().catch(() => null);
    setLoading(false);

    if (!response.ok) {
      setError(data?.message || 'Не удалось создать комнату.');
      return;
    }

    window.location.assign(`/host/${data.roomCode}`);
  }

  return (
    <div className="grid gap-2">
      <Button type="button" onClick={launch} disabled={loading}>
        <Radio size={18} /> {loading ? 'Создаём комнату...' : label}
      </Button>
      {error && <div className="text-xs font-bold text-danger">{error}</div>}
    </div>
  );
}
