'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getSocket } from '@/lib/socket';
import { socketEvents, type RoomSnapshot } from '@quizpulse/shared';

function PlayRoomContent() {
  const params = useParams<{ code: string }>();
  const searchParams = useSearchParams();
  const code = useMemo(() => String(params.code ?? 'QZ-4821').toUpperCase(), [params.code]);
  const nickname = searchParams.get('name') || 'Игрок';

  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('Ожидаем старт квиза...');
  const [now, setNow] = useState(Date.now());
  const [authChecked, setAuthChecked] = useState(false);
  const [roleBlocked, setRoleBlocked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        const role = data?.user?.role;
        setRoleBlocked(role === 'ORGANIZER' || role === 'ADMIN');
      })
      .catch(() => setRoleBlocked(false))
      .finally(() => setAuthChecked(true));
  }, []);

  async function switchToParticipant() {
    const response = await fetch('/api/auth/switch-role', { method: 'POST' });
    if (response.ok) window.location.reload();
  }

  useEffect(() => {
    if (!authChecked || roleBlocked) return;
    const socket = getSocket();

    function join() {
      socket.emit(socketEvents.roomJoin, { code, nickname, role: 'PARTICIPANT' });
    }

    socket.on('connect', join);
    socket.on(socketEvents.roomJoined, setSnapshot);
    socket.on(socketEvents.roomState, (state: RoomSnapshot) => {
      setSnapshot(state);
    });
    socket.on(socketEvents.questionStarted, () => {
      setSelected([]);
      setMessage('Выбери ответ, пока идёт таймер.');
    });
    socket.on(socketEvents.answerAccepted, (payload: { scoreAwarded: number; totalScore: number; result?: 'correct' | 'partial' | 'wrong' }) => {
      const soundType = payload.result || (payload.scoreAwarded > 0 ? 'correct' : 'wrong');
      window.dispatchEvent(new CustomEvent('quizpulse:sound', { detail: { type: soundType } }));
      const prefix = soundType === 'correct'
        ? 'Ответ правильный.'
        : soundType === 'partial'
          ? 'Ответ частично правильный.'
          : 'Ответ неправильный.';
      setMessage(`${prefix} Итоговые баллы покажем после завершения квиза.`);
    });
    socket.on(socketEvents.quizFinished, () => {
      setMessage('Квиз завершён. Смотри лидерборд.');
    });
    socket.on(socketEvents.error, (error: string) => {
      setMessage(error);
    });

    if (socket.connected) join();

    return () => {
      socket.off('connect', join);
      socket.off(socketEvents.roomJoined, setSnapshot);
      socket.off(socketEvents.roomState);
      socket.off(socketEvents.questionStarted);
      socket.off(socketEvents.answerAccepted);
      socket.off(socketEvents.quizFinished);
      socket.off(socketEvents.error);
    };
  }, [authChecked, roleBlocked, code, nickname]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  if (!authChecked) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-16">
        <Card>Проверяем роль...</Card>
      </section>
    );
  }

  if (roleBlocked) {
    return (
      <section className="mx-auto max-w-2xl px-5 py-16">
        <Card>
          <div className="text-sm font-bold text-cyan">Режим организатора</div>
          <h1 className="mt-3 text-4xl font-black">Участие в комнате недоступно</h1>
          <p className="mt-3 leading-7 text-[color:var(--muted)]">
            Сейчас вы вошли как организатор. В этой роли можно проводить квизы, но нельзя отвечать как игрок.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={switchToParticipant}>Стать участником</Button>
            <Button href="/dashboard/organizer" variant="ghost">Кабинет организатора</Button>
          </div>
        </Card>
      </section>
    );
  }

  const question = snapshot?.currentQuestion;
  const secondsLeft = question ? Math.max(Math.ceil((question.endsAt - now) / 1000), 0) : 0;

  function toggleOption(optionId: string) {
    if (!question) return;

    if (question.answerMode === 'SINGLE') {
      setSelected([optionId]);
      return;
    }

    setSelected((items) => items.includes(optionId) ? items.filter((id) => id !== optionId) : [...items, optionId]);
  }

  function submit() {
    if (!question || selected.length === 0) return;

    getSocket().emit(socketEvents.submitAnswer, {
      code,
      questionId: question.id,
      selectedOptionIds: selected
    });
  }

  return (
    <section className="mx-auto grid max-w-4xl gap-4 px-3 py-6 sm:px-5 sm:py-8">
      <div className="">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--glass)] px-4 py-2 text-sm font-black text-[color:var(--muted)] transition hover:bg-[color:var(--glass-hover)] hover:text-[color:var(--foreground)]"
        >
          <ArrowLeft size={16} /> Назад
        </button>
      </div>
      <Card>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge>{question ? `Вопрос ${question.index} из ${question.total}` : `Игрок: ${nickname}`}</Badge>
            <p className="mt-3 text-[color:var(--muted)]">{message}</p>
          </div>
          {question ? (
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[1.5rem] border border-cyan/30 bg-cyan/10 text-2xl font-black text-cyan">
              {secondsLeft}
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          {question ? (
            <>
              {question.text && <h2 className="text-3xl font-black">{question.text}</h2>}
              {question.imageUrl && (
                <div className="mt-5 aspect-[16/8] overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--glass)]">
                  <img src={question.imageUrl} alt={question.text || 'Картинка вопроса'} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="mt-6 grid gap-3">
                {question.options.map((option) => {
                  const active = selected.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleOption(option.id)}
                      className={`rounded-2xl border p-5 text-left text-lg font-bold transition ${active ? 'border-cyan bg-cyan/15 text-cyan' : 'border-[color:var(--border)] bg-[color:var(--glass)] text-[color:var(--foreground)] hover:bg-[color:var(--card-strong)]'}`}
                    >
                      {option.imageUrl && (
                        <img src={option.imageUrl} alt={option.text || 'Картинка варианта'} className="mb-3 aspect-video w-full rounded-xl object-cover" />
                      )}
                      {option.text}
                    </button>
                  );
                })}
              </div>
              <Button className="mt-6 w-full" disabled={selected.length === 0 || secondsLeft === 0} onClick={submit}>
                Отправить ответ
              </Button>
            </>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-[color:var(--border)] p-10 text-center text-[color:var(--muted)]">
              Квиз ещё не начался или организатор пока не показал вопрос. Оставайтесь на странице — вопрос появится автоматически.
            </div>
          )}
        </div>
      </Card>

      {snapshot?.status === 'FINISHED' ? <Leaderboard entries={snapshot?.leaderboard ?? []} /> : null}
    </section>
  );
}

export default function PlayRoomPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="mx-auto max-w-7xl px-5 py-10 text-[color:var(--muted)]">Загрузка комнаты...</div>}>
        <PlayRoomContent />
      </Suspense>
    </AppShell>
  );
}
