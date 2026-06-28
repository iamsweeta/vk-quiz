'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Maximize2, Play, SkipForward, Square } from 'lucide-react';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RoomQrCode } from '@/components/live/RoomQrCode';
import { getSocket } from '@/lib/socket';
import { socketEvents, type RoomSnapshot } from '@quizpulse/shared';

export function HostRoomClient() {
  const params = useParams<{ code: string }>();
  const code = useMemo(() => String(params.code ?? 'QZ-4821').toUpperCase(), [params.code]);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const socket = getSocket();

    function onConnect() {
      setConnected(true);
      socket.emit(socketEvents.roomJoin, { code, nickname: 'Организатор', role: 'HOST' });
    }

    function onDisconnect() {
      setConnected(false);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on(socketEvents.roomJoined, setSnapshot);
    socket.on(socketEvents.roomState, setSnapshot);

    if (socket.connected) onConnect();

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off(socketEvents.roomJoined, setSnapshot);
      socket.off(socketEvents.roomState, setSnapshot);
    };
  }, [code]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  const secondsLeft = snapshot?.currentQuestion
    ? Math.max(Math.ceil((snapshot.currentQuestion.endsAt - now) / 1000), 0)
    : 0;

  const socket = getSocket();

  return (
    <section className="mx-auto max-w-7xl px-3 py-6 sm:px-5 sm:py-10">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <Badge>{connected ? 'Socket connected' : 'Socket offline'}</Badge>
          <h1 className="mt-3 text-3xl font-black sm:text-5xl">Host room {code}</h1>
          <div className="mt-3 flex flex-col gap-3 text-sm text-[color:var(--muted)] sm:flex-row sm:items-center sm:text-base">
            <p>Комната создана. Участник может подключиться по коду {code}.</p>
            <Button href={`/join?room=${code}`} variant="ghost">Открыть страницу подключения</Button>
          </div>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 rounded-[1.5rem] border border-[color:var(--border)] bg-[color:var(--glass)] p-2 sm:w-auto sm:grid-cols-4 sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0 md:flex md:flex-wrap md:justify-end">
          <Button onClick={() => socket.emit(socketEvents.hostStartQuiz, { code })} className="min-h-12 w-full px-3 text-xs sm:w-auto sm:text-sm"><Play size={17} /> Старт</Button>
          <Button onClick={() => socket.emit(socketEvents.hostShowQuestion, { code })} variant="ghost" className="min-h-12 w-full px-3 text-xs sm:w-auto sm:text-sm"><SkipForward size={17} /> Вопрос</Button>
          <Button href={`/host/${code}/projector`} variant="ghost" className="min-h-12 w-full px-3 text-xs sm:w-auto sm:text-sm"><Maximize2 size={17} /> Экран</Button>
          <Button onClick={() => socket.emit(socketEvents.hostFinishQuiz, { code })} variant="danger" className="min-h-12 w-full px-3 text-xs sm:w-auto sm:text-sm"><Square size={17} /> Завершить</Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.25fr_0.75fr_0.75fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-cyan">Текущий вопрос</p>
              <h2 className="mt-2 text-4xl font-black">
                {snapshot?.currentQuestion?.text || 'Вопрос ещё не показан'}
              </h2>
            </div>
            <div className="grid h-24 w-24 shrink-0 place-items-center rounded-[2rem] border border-cyan/30 bg-cyan/10 text-4xl font-black text-cyan">
              {secondsLeft}
            </div>
          </div>

          {snapshot?.currentQuestion?.imageUrl && (
            <div className="mt-6 aspect-[16/7] overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--glass)]">
              <img src={snapshot.currentQuestion.imageUrl} alt={snapshot.currentQuestion.text || 'Картинка вопроса'} className="h-full w-full object-cover" />
            </div>
          )}

          {snapshot?.currentQuestion && (
            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {snapshot.currentQuestion.options.map((option) => (
                <div key={option.id} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--glass)] p-5 text-lg font-bold">
                  {option.imageUrl && (
                    <img src={option.imageUrl} alt={option.text || 'Картинка варианта'} className="mb-3 aspect-video w-full rounded-xl object-cover" />
                  )}
                  {option.text}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-2xl font-black">Участники</h2>
          <div className="mt-5 grid gap-3">
            {snapshot?.participants.length ? snapshot.participants.map((participant) => (
              <div key={participant.id} className="flex items-center justify-between rounded-2xl bg-[color:var(--glass)] p-4">
                <span>{participant.nickname}</span>
                <b>{participant.score}</b>
              </div>
            )) : <p className="text-sm text-[color:var(--muted)]">Пока никто не подключился.</p>}
          </div>
        </Card>

        <RoomQrCode code={code} />
      </div>

      <div className="mt-4">
        <Leaderboard entries={snapshot?.leaderboard ?? []} />
      </div>
    </section>
  );
}
