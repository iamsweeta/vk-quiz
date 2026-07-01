'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Leaderboard } from '@/components/leaderboard/Leaderboard';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getSocket } from '@/lib/socket';
import { socketEvents, type RoomSnapshot } from '@quizpulse/shared';

type AnswerAcceptedPayload = {
  scoreAwarded: number;
  totalScore: number;
  result?: 'correct' | 'partial' | 'wrong';
};

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

  const lastSubmittedAnswerRef = useRef<{
    questionId: string;
    selectedOptionIds: string[];
  } | null>(null);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        const role = data?.user?.role;
        setRoleBlocked(role === 'ORGANIZER' || role === 'ADMIN');
      })
      .catch(() => {
        setRoleBlocked(false);
      })
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
      socket.emit(socketEvents.roomJoin, {
        code,
        nickname,
        role: 'PARTICIPANT'
      });
    }

    function handleRoomState(state: RoomSnapshot) {
      setSnapshot(state);
    }

    function handleQuestionStarted() {
      setSelected([]);
      lastSubmittedAnswerRef.current = null;
      setMessage('Выбери ответ, пока идёт таймер.');
    }

    function handleAnswerAccepted(payload: AnswerAcceptedPayload) {
      const soundType = payload.result || (payload.scoreAwarded > 0 ? 'correct' : 'wrong');

      window.dispatchEvent(
        new CustomEvent('quizpulse:sound', {
          detail: { type: soundType }
        })
      );

      const prefix =
        soundType === 'correct'
          ? 'Ответ правильный.'
          : soundType === 'partial'
            ? 'Ответ частично правильный.'
            : 'Ответ неправильный.';

      setMessage(`${prefix} Итоговые баллы покажем после завершения квиза.`);

      const lastAnswer = lastSubmittedAnswerRef.current;

      if (!lastAnswer) return;

      fetch('/api/live/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          nickname,
          questionId: lastAnswer.questionId,
          selectedOptionIds: lastAnswer.selectedOptionIds,
          scoreAwarded: payload.scoreAwarded,
          totalScore: payload.totalScore,
          isCorrect: payload.result === 'correct'
        })
      }).catch((error) => {
        console.error('Failed to save live progress', error);
      });
    }

    function handleQuizFinished() {
      setMessage('Квиз завершён. Смотри лидерборд.');
    }

    function handleError(error: string) {
      setMessage(error);
    }

    socket.on('connect', join);
    socket.on(socketEvents.roomJoined, setSnapshot);
    socket.on(socketEvents.roomState, handleRoomState);
    socket.on(socketEvents.questionStarted, handleQuestionStarted);
    socket.on(socketEvents.answerAccepted, handleAnswerAccepted);
    socket.on(socketEvents.quizFinished, handleQuizFinished);
    socket.on(socketEvents.error, handleError);

    if (socket.connected) join();

    return () => {
      socket.off('connect', join);
      socket.off(socketEvents.roomJoined, setSnapshot);
      socket.off(socketEvents.roomState, handleRoomState);
      socket.off(socketEvents.questionStarted, handleQuestionStarted);
      socket.off(socketEvents.answerAccepted, handleAnswerAccepted);
      socket.off(socketEvents.quizFinished, handleQuizFinished);
      socket.off(socketEvents.error, handleError);
    };
  }, [authChecked, roleBlocked, code, nickname]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  if (!authChecked) {
    return (
      <AppShell>
        <Card className="mx-auto max-w-xl p-8 text-center">
          <p className="text-sm font-bold text-[color:var(--muted)]">Проверяем роль...</p>
        </Card>
      </AppShell>
    );
  }

  if (roleBlocked) {
    return (
      <AppShell>
        <Card className="mx-auto max-w-xl p-8 text-center">
          <Badge>Режим организатора</Badge>
          <h1 className="mt-4 text-3xl font-black">Участие в комнате недоступно</h1>
          <p className="mt-3 text-[color:var(--muted)]">
            Сейчас вы вошли как организатор. В этой роли можно проводить квизы, но нельзя отвечать как игрок.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button onClick={switchToParticipant}>Стать участником</Button>
            <Button href="/dashboard/organizer" variant="ghost">
              Кабинет организатора
            </Button>
          </div>
        </Card>
      </AppShell>
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

    setSelected((items) =>
      items.includes(optionId) ? items.filter((id) => id !== optionId) : [...items, optionId]
    );
  }

  function submit() {
    if (!question || selected.length === 0) return;

    const selectedOptionIds = [...selected];

    lastSubmittedAnswerRef.current = {
      questionId: question.id,
      selectedOptionIds
    };

    getSocket().emit(socketEvents.submitAnswer, {
      code,
      questionId: question.id,
      selectedOptionIds
    });
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 pb-24">
        <button
          onClick={() => window.history.back()}
          className="inline-flex w-fit items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--glass)] px-4 py-2 text-sm font-black text-[color:var(--muted)] transition hover:bg-[color:var(--glass-hover)] hover:text-[color:var(--foreground)]"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад
        </button>

        <Card className="p-5 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge>{question ? `Вопрос ${question.index} из ${question.total}` : `Игрок: ${nickname}`}</Badge>
              <p className="mt-3 text-sm font-bold text-[color:var(--muted)]">{message}</p>
            </div>

            {question ? (
              <div className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--glass)] px-5 py-3 text-center">
                <p className="text-xs font-black uppercase text-[color:var(--muted)]">Время</p>
                <p className="text-3xl font-black text-cyan">{secondsLeft}</p>
              </div>
            ) : null}
          </div>

          {question ? (
            <div className="mt-8 space-y-6">
              {question.text ? <h1 className="text-3xl font-black">{question.text}</h1> : null}

              {question.imageUrl ? (
                <img
                  src={question.imageUrl}
                  alt=""
                  className="max-h-80 w-full rounded-3xl object-cover"
                />
              ) : null}

              <div className="grid gap-3">
                {question.options.map((option) => {
                  const active = selected.includes(option.id);

                  return (
                    <button
                      key={option.id}
                      onClick={() => toggleOption(option.id)}
                      className={`rounded-2xl border p-5 text-left text-lg font-bold transition ${
                        active
                          ? 'border-cyan bg-cyan/15 text-cyan'
                          : 'border-[color:var(--border)] bg-[color:var(--glass)] text-[color:var(--foreground)] hover:bg-[color:var(--card-strong)]'
                      }`}
                    >
                      {option.imageUrl ? (
                        <img
                          src={option.imageUrl}
                          alt=""
                          className="mb-3 max-h-40 w-full rounded-2xl object-cover"
                        />
                      ) : null}
                      {option.text}
                    </button>
                  );
                })}
              </div>

              <Button onClick={submit} disabled={selected.length === 0 || secondsLeft <= 0}>
                Отправить ответ
              </Button>
            </div>
          ) : (
            <p className="mt-8 rounded-3xl border border-dashed border-[color:var(--border)] p-6 text-center text-[color:var(--muted)]">
              Квиз ещё не начался или организатор пока не показал вопрос. Оставайтесь на странице — вопрос появится автоматически.
            </p>
          )}
        </Card>

        {snapshot?.status === 'FINISHED' ? <Leaderboard entries={snapshot.leaderboard} /> : null}
      </div>
    </AppShell>
  );
}

export default function PlayRoomPage() {
  return (
    <Suspense fallback={<AppShell>Загрузка комнаты...</AppShell>}>
      <PlayRoomContent />
    </Suspense>
  );
}
