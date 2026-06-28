'use client';

import { Archive, RotateCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export function ArchiveQuizButton({ quizId, status }: { quizId: string; status: Status }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const archived = status === 'ARCHIVED';

  async function updateStatus() {
    const message = archived
      ? 'Вернуть квиз из архива в черновики?'
      : 'Архивировать квиз? Он исчезнет из активного каталога и останется в разделе архива.';

    if (!window.confirm(message)) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/quizzes/${quizId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: archived ? 'DRAFT' : 'ARCHIVED' })
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        window.alert(data?.message || 'Не удалось изменить статус квиза.');
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="ghost" onClick={updateStatus} disabled={loading} className="gap-2">
      {archived ? <RotateCcw size={16} /> : <Archive size={16} />}
      {loading ? 'Сохраняю...' : archived ? 'Вернуть из архива' : 'В архив'}
    </Button>
  );
}
