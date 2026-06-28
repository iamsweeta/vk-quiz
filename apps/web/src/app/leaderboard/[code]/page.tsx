'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { getSocket } from '@/lib/socket';
import { socketEvents, type RoomSnapshot } from '@quizpulse/shared';

export default function PublicLeaderboardPage() {
  const params = useParams<{ code: string }>();
  const code = useMemo(() => String(params.code ?? 'QZ-4821').toUpperCase(), [params.code]);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);

  useEffect(() => {
    const socket = getSocket();
    const join = () => socket.emit(socketEvents.roomJoin, { code, nickname: 'Экран лидерборда', role: 'HOST' });
    socket.on('connect', join);
    socket.on(socketEvents.roomJoined, setSnapshot);
    socket.on(socketEvents.roomState, setSnapshot);
    if (socket.connected) join();

    return () => {
      socket.off('connect', join);
      socket.off(socketEvents.roomJoined, setSnapshot);
      socket.off(socketEvents.roomState, setSnapshot);
    };
  }, [code]);

  return (
    <AppShell>
      <section className="mx-auto max-w-4xl px-5 py-10">
        <Badge>Публичный экран</Badge>
        <h1 className="mt-3 text-5xl font-black">Лидерборд {code}</h1>
        <div className="mt-8">
          <Leaderboard entries={snapshot?.leaderboard ?? []} />
        </div>
      </section>
    </AppShell>
  );
}
