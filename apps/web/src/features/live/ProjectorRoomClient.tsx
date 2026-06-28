'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RoomQrCode } from '@/components/live/RoomQrCode';
import { getSocket } from '@/lib/socket';
import { socketEvents, type RoomSnapshot } from '@quizpulse/shared';

export function ProjectorRoomClient() {
  const params = useParams<{ code: string }>();
  const code = useMemo(() => String(params.code ?? '').toUpperCase(), [params.code]);
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const socket = getSocket();

    function onConnect() {
      setConnected(true);
      socket.emit(socketEvents.roomJoin, { code, nickname: 'Экран ведущего', role: 'HOST' });
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
    const interval = setInterval(() => setNow(Date.now()), 350);
    return () => clearInterval(interval);
  }, []);

  const currentQuestion = snapshot?.currentQuestion;
  const secondsLeft = currentQuestion ? Math.max(Math.ceil((currentQuestion.endsAt - now) / 1000), 0) : 0;
  const answeredCount = currentQuestion
    ? snapshot?.participants.filter((participant) => participant.answeredCount >= currentQuestion.index + 1).length ?? 0
    : 0;
  const participantCount = snapshot?.participants.length ?? 0;

  return (
    <main className="min-h-screen bg-[color:var(--background)] px-4 py-5 text-[color:var(--foreground)] sm:px-8 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{connected ? 'Проектор подключён' : 'Нет соединения'}</Badge>
            <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--glass)] px-4 py-2 text-sm font-black text-[color:var(--muted)]">Комната {code}</span>
          </div>
          <Button href={`/host/${code}`} variant="ghost">Вернуться к управлению</Button>
        </div>

        {!currentQuestion ? (
          <div className="grid gap-5 lg:grid-cols-[1fr_340px] lg:items-start">
            <Card className="grid min-h-[520px] place-items-center text-center">
              <div>
                <div className="text-sm font-black uppercase tracking-wide text-cyan">Ожидание старта</div>
                <h1 className="mt-4 text-5xl font-black md:text-7xl">Подключайтесь к VK Quiz</h1>
                <p className="mt-5 text-xl text-[color:var(--muted)]">Код комнаты: <b className="text-[color:var(--foreground)]">{code}</b></p>
              </div>
            </Card>
            <RoomQrCode code={code} />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
            <Card className="min-h-[calc(100vh-9rem)] p-6 sm:p-10">
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <Badge>Вопрос {currentQuestion.index + 1} из {currentQuestion.total}</Badge>
                <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--glass)] px-4 py-2 text-sm font-black text-[color:var(--muted)]">Ответили {answeredCount} / {participantCount}</span>
              </div>

              {currentQuestion.imageUrl && (
                <div className="mb-8 aspect-[16/6] overflow-hidden rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--glass)]">
                  <img src={currentQuestion.imageUrl} alt={currentQuestion.text || 'Картинка вопроса'} className="h-full w-full object-cover" />
                </div>
              )}

              <h1 className="text-4xl font-black leading-tight md:text-6xl">{currentQuestion.text || 'Вопрос по изображению'}</h1>
              <div className="mt-10 grid gap-4 md:grid-cols-2">
                {currentQuestion.options.map((option, index) => (
                  <div key={option.id} className="rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--glass)] p-5 text-2xl font-black">
                    <span className="mr-3 text-cyan">{String.fromCharCode(65 + index)}</span>
                    {option.imageUrl && <img src={option.imageUrl} alt="" className="mb-4 aspect-video w-full rounded-2xl object-cover" />}
                    {option.text}
                  </div>
                ))}
              </div>
            </Card>

            <div className="grid gap-5">
              <div className="grid min-h-64 place-items-center rounded-[2rem] border border-cyan/30 bg-cyan/10 text-center shadow-soft">
                <div>
                  <div className="text-sm font-black uppercase tracking-wide text-cyan">Таймер</div>
                  <div className="mt-2 text-8xl font-black text-cyan">{secondsLeft}</div>
                </div>
              </div>
              <RoomQrCode code={code} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
