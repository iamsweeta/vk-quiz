'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, CircleX, Share2, Star, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { QuizFallbackCover } from '@/components/quiz/QuizFallbackCover';
import { IconTile } from '@/components/brand/ProductIcon';

type SoloOption = {
  id: string;
  text: string;
  imageUrl?: string | null;
  isCorrect: boolean;
};

type SoloQuestion = {
  id: string;
  text: string;
  imageUrl?: string | null;
  answerMode: 'SINGLE' | 'MULTIPLE';
  points: number;
  options: SoloOption[];
};

type SoloQuiz = {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  category?: string | null;
  questions: SoloQuestion[];
};

type SoloScoreResult = {
  score: number;
  isFullyCorrect: boolean;
  selectedCorrectCount: number;
  correctTotal: number;
  selectedWrongCount: number;
  explanation: string;
};

function uniqueIds(ids: string[]) {
  return [...new Set(ids.filter(Boolean))];
}

function sameSet(a: string[], b: string[]) {
  const left = uniqueIds(a).sort();
  const right = uniqueIds(b).sort();
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function getScoreResult(question: SoloQuestion, selected: string[]): SoloScoreResult {
  const selectedIds = uniqueIds(selected);
  const correctIds = question.options.filter((option) => option.isCorrect).map((option) => option.id);
  const wrongIds = question.options.filter((option) => !option.isCorrect).map((option) => option.id);
  const selectedCorrectCount = selectedIds.filter((id) => correctIds.includes(id)).length;
  const selectedWrongCount = selectedIds.filter((id) => wrongIds.includes(id)).length;
  const correctTotal = correctIds.length;
  const isFullyCorrect = sameSet(selectedIds, correctIds);

  if (question.answerMode === 'SINGLE') {
    return {
      score: isFullyCorrect ? question.points : 0,
      isFullyCorrect,
      selectedCorrectCount,
      correctTotal,
      selectedWrongCount,
      explanation: isFullyCorrect ? 'Правильный вариант выбран.' : 'Выбран неправильный вариант.'
    };
  }

  if (!correctTotal) {
    return {
      score: 0,
      isFullyCorrect: false,
      selectedCorrectCount,
      correctTotal,
      selectedWrongCount,
      explanation: 'У вопроса не задан правильный ответ.'
    };
  }

  const share = question.points / correctTotal;
  const score = Math.max(0, Math.round(selectedCorrectCount * share - selectedWrongCount * share));

  return {
    score,
    isFullyCorrect,
    selectedCorrectCount,
    correctTotal,
    selectedWrongCount,
    explanation: isFullyCorrect
      ? 'Выбран весь правильный набор без лишних вариантов.'
      : 'Частичный балл: правильные варианты дают долю баллов, лишние варианты вычитают долю.'
  };
}

function RatingPanel({ quizId, initialRating }: { quizId: string; initialRating?: number | null }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(initialRating ?? 0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(initialRating ? `Вы оценили квиз на ${initialRating} из 5.` : '');

  async function rate(value: number) {
    if (saving) return;
    if (selected === value) {
      setMessage(`Вы оценили квиз на ${value} из 5.`);
      return;
    }

    setSaving(true);
    setMessage('');
    const response = await fetch(`/api/quizzes/${quizId}/rating`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value })
    });
    setSaving(false);

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (data?.value) setSelected(Number(data.value));
      setMessage(data?.message || 'Не удалось сохранить оценку.');
      return;
    }

    const nextValue = Number(data?.value ?? value);
    setSelected(nextValue);
    setMessage(data?.message || `Вы оценили квиз на ${nextValue} из 5.`);
  }

  const activeValue = hovered || selected;
  const hasRating = selected > 0;

  return (
    <div className="mt-8 rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--glass)] p-5">
      {hasRating ? (
        <>
          <h2 className="text-2xl font-black">Вы оценили квиз на {selected} из 5</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Можно изменить оценку — просто выберите другую звезду.</p>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-black">Оцените квиз</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Оценка влияет на порядок квизов в каталоге.</p>
        </>
      )}
      <div className="mt-4 flex justify-center gap-2 sm:justify-start">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            disabled={saving}
            onMouseEnter={() => setHovered(value)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => rate(value)}
            className={`grid h-12 w-12 place-items-center rounded-2xl border transition ${
              activeValue >= value
                ? 'border-warning bg-warning/15 text-warning'
                : 'border-[color:var(--border)] bg-[color:var(--card-strong)] text-[color:var(--muted)] hover:text-warning'
            } disabled:cursor-default disabled:opacity-60`}
            aria-label={hasRating ? `Изменить оценку на ${value}` : `Оценить на ${value}`}
            title={hasRating ? `Изменить оценку на ${value}` : `Оценить на ${value}`}
          >
            <Star size={22} className={activeValue >= value ? 'fill-current' : ''} />
          </button>
        ))}
      </div>
      {message && <p className="mt-3 text-center text-sm font-bold text-[color:var(--muted)] sm:text-left">{message}</p>}
    </div>
  );
}

export function SoloQuizClient({ quiz, viewerRating }: { quiz: SoloQuiz; viewerRating?: number | null }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<Array<{ questionId: string; fullyCorrect: boolean; points: number }>>([]);
  const [shareStatus, setShareStatus] = useState('');
  const attemptRecorded = useRef(false);

  const question = quiz.questions[index];
  const finished = index >= quiz.questions.length;
  const maxScore = useMemo(() => quiz.questions.reduce((sum, item) => sum + item.points, 0), [quiz.questions]);
  const currentScoreResult = question ? getScoreResult(question, selected) : null;

  useEffect(() => {
    if (!finished || attemptRecorded.current) return;
    attemptRecorded.current = true;
    fetch(`/api/quizzes/${quiz.id}/attempts`, { method: 'POST' }).catch(() => undefined);
  }, [finished, quiz.id]);

  useEffect(() => {
    function beforeUnload(event: BeforeUnloadEvent) {
      if (finished || answered.length === 0) return;
      event.preventDefault();
      event.returnValue = '';
    }

    function captureLinkClick(event: MouseEvent) {
      if (finished || answered.length === 0) return;
      const target = event.target as HTMLElement | null;
      const link = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!link) return;
      if (link.target === '_blank' || link.download) return;
      if (link.origin !== window.location.origin) return;
      const shouldLeave = window.confirm('Квиз ещё не завершён. Если уйти сейчас, текущий результат не сохранится. Выйти?');
      if (!shouldLeave) event.preventDefault();
    }

    window.addEventListener('beforeunload', beforeUnload);
    document.addEventListener('click', captureLinkClick, true);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      document.removeEventListener('click', captureLinkClick, true);
    };
  }, [answered.length, finished]);

  function toggleOption(optionId: string) {
    if (!question || checked) return;
    if (question.answerMode === 'SINGLE') {
      setSelected([optionId]);
      return;
    }
    setSelected((items) => items.includes(optionId) ? items.filter((id) => id !== optionId) : [...items, optionId]);
  }

  function checkAnswer() {
    if (!question || selected.length === 0 || checked) return;
    const result = getScoreResult(question, selected);
    const earned = result.score;
    setScore((value) => value + earned);
    setAnswered((items) => [...items, { questionId: question.id, fullyCorrect: result.isFullyCorrect, points: earned }]);
    playAnswerSound(result.isFullyCorrect ? 'correct' : earned > 0 ? 'partial' : 'wrong');
    setChecked(true);
  }

  function next() {
    setIndex((value) => value + 1);
    setSelected([]);
    setChecked(false);
  }

  function playAnswerSound(type: 'correct' | 'partial' | 'wrong') {
    window.dispatchEvent(new CustomEvent('quizpulse:sound', { detail: { type } }));
  }

  function goBack() {
    if (!finished && answered.length > 0) {
      const shouldLeave = window.confirm('Квиз ещё не завершён. Если вернуться назад, текущий результат не сохранится. Выйти?');
      if (!shouldLeave) return;
    }
    window.history.back();
  }


  async function shareResult() {
    const text = `Я прошёл ${quiz.title} в VK Quiz на ${score} из ${maxScore} баллов!`;
    const url = `${window.location.origin}/catalog/${quiz.id}`;
    setShareStatus('');

    try {
      if (navigator.share) {
        await navigator.share({ title: 'VK Quiz', text, url });
        setShareStatus('Карточка результата готова к отправке.');
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShareStatus('Текст результата скопирован.');
    } catch {
      setShareStatus('Не удалось открыть отправку, но результат можно переслать вручную.');
    }
  }

  function getAchievements(percent: number) {
    const fullCorrectCount = answered.filter((item) => item.fullyCorrect).length;
    const achievements = [] as Array<{ title: string; text: string }>;
    if (percent === 100) achievements.push({ title: '100% точность', text: 'Все вопросы пройдены идеально.' });
    if (fullCorrectCount >= 3) achievements.push({ title: 'Серия побед', text: `${fullCorrectCount} полностью верных ответа.` });
    if (score > 0 && percent >= 70) achievements.push({ title: 'Сильный результат', text: 'Ты набрал больше 70% баллов.' });
    if (!achievements.length) achievements.push({ title: 'Первый шаг', text: 'Квиз завершён, можно пройти ещё раз и улучшить результат.' });
    return achievements;
  }


  if (finished) {
    const percent = maxScore ? Math.round((score / maxScore) * 100) : 0;
    const achievements = getAchievements(percent);
    return (
      <section className="mx-auto max-w-5xl px-3 py-6 sm:px-5 sm:py-10">
        <Card className="overflow-hidden p-0">
          <div className="aspect-[16/6] overflow-hidden border-b border-[color:var(--border)]">
            {quiz.coverImageUrl ? (
              <img src={quiz.coverImageUrl} alt={quiz.title} className="h-full w-full object-cover" />
            ) : (
              <QuizFallbackCover title={quiz.title} category={quiz.category} />
            )}
          </div>
          <div className="p-5 sm:p-8">
            <Badge>Итог самостоятельного прохождения</Badge>
            <h1 className="mt-5 text-3xl font-black sm:text-5xl">Результат: {score} / {maxScore}</h1>
            <p className="mt-3 text-sm leading-relaxed text-[color:var(--muted)] sm:text-lg">
              Ты набрал {percent}%. В одиночном выборе баллы начисляются только за правильный ответ. В множественном выборе возможен частичный балл: правильные варианты добавляют очки, лишние варианты их уменьшают.
            </p>
            <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="grid min-h-28 place-items-center rounded-2xl bg-[color:var(--glass)] p-3 text-center sm:min-h-36 sm:rounded-3xl sm:p-5">
                <IconTile name="accuracy" className="mx-auto h-10 w-10 rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl" />
                <div className="mt-3 text-2xl font-black sm:text-3xl">{answered.filter((item) => item.fullyCorrect).length}</div>
                <div className="text-[11px] leading-tight text-[color:var(--muted)] sm:text-sm">полностью верных</div>
              </div>
              <div className="grid min-h-28 place-items-center rounded-2xl bg-[color:var(--glass)] p-3 text-center sm:min-h-36 sm:rounded-3xl sm:p-5">
                <IconTile name="leaderboard" className="mx-auto h-10 w-10 rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl" />
                <div className="mt-3 text-2xl font-black sm:text-3xl">{score}</div>
                <div className="text-[11px] leading-tight text-[color:var(--muted)] sm:text-sm">баллов</div>
              </div>
              <div className="grid min-h-28 place-items-center rounded-2xl bg-[color:var(--glass)] p-3 text-center sm:min-h-36 sm:rounded-3xl sm:p-5">
                <IconTile name="pulse" className="mx-auto h-10 w-10 rounded-xl sm:h-12 sm:w-12 sm:rounded-2xl" />
                <div className="mt-3 text-2xl font-black sm:text-3xl">{quiz.questions.length}</div>
                <div className="text-[11px] leading-tight text-[color:var(--muted)] sm:text-sm">вопросов</div>
              </div>
            </div>

            <div className="mt-7 flex flex-col items-center gap-2">
              <Button onClick={shareResult} className="w-full max-w-sm"><Share2 size={18} /> Поделиться результатом</Button>
              {shareStatus && <p className="text-center text-sm font-bold text-[color:var(--muted)]">{shareStatus}</p>}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {achievements.map((achievement) => (
                <div key={achievement.title} className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--glass)] p-4">
                  <Trophy className="mb-3 text-cyan" size={24} />
                  <div className="font-black">{achievement.title}</div>
                  <p className="mt-1 text-sm text-[color:var(--muted)]">{achievement.text}</p>
                </div>
              ))}
            </div>

            <RatingPanel quizId={quiz.id} initialRating={viewerRating} />
          </div>
        </Card>
      </section>
    );
  }

  if (!question) return null;

  return (
    <section className="mx-auto grid max-w-4xl gap-4 px-3 py-6 sm:px-5 sm:py-8">
      <div className="lg:col-span-2">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--glass)] px-4 py-2 text-sm font-black text-[color:var(--muted)] transition hover:bg-[color:var(--glass-hover)] hover:text-[color:var(--foreground)]"
        >
          <ArrowLeft size={16} /> Назад
        </button>
      </div>
      <Card>
        <div className="flex items-center justify-between gap-4">
          <Badge>Вопрос {index + 1} из {quiz.questions.length}</Badge>
          <span className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--chip-bg)] px-3 py-2 text-xs font-black text-[color:var(--chip-text)]">
            {question.answerMode === 'SINGLE' ? 'Один ответ' : 'Несколько ответов'}
          </span>
        </div>

        {question.imageUrl && (
          <div className="mt-6 aspect-[16/7] overflow-hidden rounded-3xl border border-[color:var(--border)] bg-[color:var(--glass)]">
            <img src={question.imageUrl} alt={question.text || 'Картинка вопроса'} className="h-full w-full object-cover" />
          </div>
        )}

        <div className="mt-8">
          {question.text && <h2 className="text-3xl font-black">{question.text}</h2>}
          <div className="mt-6 grid gap-3">
            {question.options.map((option) => {
              const active = selected.includes(option.id);
              const revealCorrect = checked && option.isCorrect;
              const revealWrong = checked && active && !option.isCorrect;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleOption(option.id)}
                  className={`rounded-2xl border p-5 text-left text-lg font-bold transition ${
                    revealCorrect
                      ? 'border-success bg-success/10 text-success'
                      : revealWrong
                        ? 'border-danger bg-danger/10 text-danger'
                        : active
                          ? 'border-cyan bg-cyan/15 text-cyan'
                          : 'border-[color:var(--border)] bg-[color:var(--glass)] hover:bg-[color:var(--card-strong)]'
                  }`}
                >
                  <span className="flex items-center justify-between gap-4">
                    <span className="flex min-w-0 items-center gap-3">
                      {option.imageUrl && (
                        <img src={option.imageUrl} alt="" className="h-12 w-16 rounded-xl object-cover" />
                      )}
                      <span>{option.text}</span>
                    </span>
                    {revealCorrect && <CheckCircle2 size={20} />}
                    {revealWrong && <CircleX size={20} />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {!checked ? (
            <Button onClick={checkAnswer} disabled={selected.length === 0}>Проверить ответ</Button>
          ) : (
            <Button onClick={next}>{index + 1 === quiz.questions.length ? 'Завершить квиз' : 'Следующий вопрос'}</Button>
          )}
          <Button href="/catalog" variant="ghost">Выйти</Button>
        </div>
      </Card>

    </section>
  );
}
