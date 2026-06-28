'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LockKeyhole, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function PrivateQuizAccessForm({ defaultCode = '' }: { defaultCode?: string }) {
  const router = useRouter();
  const [code, setCode] = useState(defaultCode);

  function openPrivateQuiz() {
    const normalizedCode = code.trim().toUpperCase();
    if (!normalizedCode) return;
    router.push(`/catalog/private/${encodeURIComponent(normalizedCode)}`);
  }

  return (
    <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--glass)] p-5 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[image:var(--button-gradient)] text-white shadow-glow">
          <LockKeyhole size={20} />
        </div>
        <div>
          <div className="font-black">Приватный квиз</div>
          <div className="text-sm text-[color:var(--muted)]">Введите код доступа от организатора</div>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Например: AI-PRIVATE-777"
          onKeyDown={(event) => {
            if (event.key === 'Enter') openPrivateQuiz();
          }}
        />
        <Button onClick={openPrivateQuiz} className="shrink-0"><Search size={18} /> Открыть</Button>
      </div>
    </div>
  );
}
