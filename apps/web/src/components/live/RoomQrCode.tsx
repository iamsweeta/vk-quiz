'use client';

import { useEffect, useMemo, useState } from 'react';
import { QrCode } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function RoomQrCode({ code }: { code: string }) {
  const [joinUrl, setJoinUrl] = useState('');

  useEffect(() => {
    const url = new URL('/join', window.location.origin);
    url.searchParams.set('room', code);
    setJoinUrl(url.toString());
  }, [code]);

  const qrUrl = useMemo(() => {
    if (!joinUrl) return '';
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=16&data=${encodeURIComponent(joinUrl)}`;
  }, [joinUrl]);

  return (
    <div className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--card)] p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-black uppercase tracking-wide text-cyan">QR для участников</div>
          <p className="mt-1 text-sm text-[color:var(--muted)]">Сканируют и сразу попадают на вход в комнату.</p>
        </div>
        <QrCode className="shrink-0 text-cyan" size={28} />
      </div>
      <div className="grid place-items-center rounded-3xl border border-[color:var(--border)] bg-white p-4">
        {qrUrl ? <img src={qrUrl} alt={`QR-код для комнаты ${code}`} className="h-56 w-56" /> : <div className="h-56 w-56 animate-pulse rounded-2xl bg-slate-100" />}
      </div>
      <div className="mt-4 grid gap-2">
        <div className="rounded-2xl bg-[color:var(--glass)] px-4 py-3 text-center text-2xl font-black tracking-widest">{code}</div>
        <Button href={`/join?room=${code}`} variant="ghost" className="w-full">Открыть вход участника</Button>
      </div>
    </div>
  );
}
