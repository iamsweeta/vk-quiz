import { BookOpen, Clock3, Eye, LockKeyhole, Radio, Star, TrendingUp, UserRound } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { QuizFallbackCover } from '@/components/quiz/QuizFallbackCover';

export type CatalogQuizCardData = {
  id: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  accessCode?: string | null;
  category?: { name: string; icon?: string | null } | null;
  owner?: { id?: string; name: string } | null;
  roomCode?: string | null;
  questionsCount: number;
  roomsCount: number;
  playCount: number;
  ratingAverage: number;
  ratingCount: number;
  totalTimeSeconds?: number;
};

function formatTime(seconds = 0) {
  if (!seconds) return '≈ 1 мин';
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return `≈ ${minutes} мин`;
}

export function QuizCatalogCard({ quiz, viewerRole }: { quiz: CatalogQuizCardData; viewerRole?: 'PARTICIPANT' | 'ORGANIZER' | 'ADMIN' | null }) {
  const isPrivate = quiz.visibility === 'PRIVATE';
  const soloHref = isPrivate && quiz.accessCode ? `/solo/${quiz.id}?access=${encodeURIComponent(quiz.accessCode)}` : `/solo/${quiz.id}`;
  const canPlay = viewerRole !== 'ORGANIZER' && viewerRole !== 'ADMIN';

  return (
    <Card className="group relative overflow-hidden p-0 transition hover:-translate-y-0.5">
      <div className="relative aspect-[16/10] overflow-hidden sm:aspect-[16/8] border-b border-[color:var(--border)] bg-[color:var(--card-strong)]">
        {quiz.coverImageUrl ? (
          <img src={quiz.coverImageUrl} alt={quiz.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <QuizFallbackCover title={quiz.title} category={quiz.category?.name} compact />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent dark:from-black/25" />
      </div>

      <div className="relative border-b border-[color:var(--border)] p-5 sm:p-6">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Badge className="text-[color:var(--badge-text)] bg-[color:var(--badge-bg)] border-[color:var(--badge-border)]">{quiz.category?.name ?? 'Без категории'}</Badge>
          <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--chip-bg)] px-3 py-1 text-xs font-black text-[color:var(--chip-text)]">
            {isPrivate ? <LockKeyhole size={14} /> : <Eye size={14} />}
            {isPrivate ? 'Private' : 'Public'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--chip-bg)] px-3 py-1 text-xs font-black text-[color:var(--chip-text)]">
            <Star size={14} /> {quiz.ratingCount ? `${quiz.ratingAverage.toFixed(1)} / 5 · ${quiz.ratingCount}` : 'нет оценок'}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--chip-bg)] px-3 py-1 text-xs font-black text-[color:var(--chip-text)]">
            <Clock3 size={14} /> {formatTime(quiz.totalTimeSeconds)}
          </span>
        </div>

        <h2 className="text-2xl font-black leading-tight md:text-3xl">{quiz.title}</h2>
        <p className="mt-3 min-h-12 text-sm leading-6 text-[color:var(--muted)]">
          {quiz.description || 'Интерактивный квиз с solo-прохождением, live-комнатой и лидербордом.'}
        </p>
      </div>

      <div className="relative p-5 sm:p-6">
        <div className="grid gap-2 sm:gap-3">
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="min-w-0 rounded-2xl border border-[color:var(--border)] bg-[color:var(--chip-bg)] p-3">
              <BookOpen className="mb-2 text-cyan" size={18} />
              <b className="block text-lg">{quiz.questionsCount}</b>
              <div className="text-xs text-[color:var(--muted)]">вопросов</div>
            </div>
            <div className="min-w-0 rounded-2xl border border-[color:var(--border)] bg-[color:var(--chip-bg)] p-3">
              <TrendingUp className="mb-2 text-cyan" size={18} />
              <b className="block text-lg">{quiz.playCount}</b>
              <div className="text-xs text-[color:var(--muted)]">прохождений</div>
            </div>
          </div>
          <div className="min-w-0 rounded-2xl border border-[color:var(--border)] bg-[color:var(--chip-bg)] p-3">
            <div className="flex min-w-0 items-center gap-2">
              <UserRound className="shrink-0 text-cyan" size={18} />
              {quiz.owner?.id ? (
                <a href={`/authors/${quiz.owner.id}`} className="min-w-0 truncate text-sm font-black hover:text-cyan" title={quiz.owner.name}>{quiz.owner.name}</a>
              ) : (
                <b className="min-w-0 truncate text-sm" title={quiz.owner?.name ?? 'Team'}>{quiz.owner?.name ?? 'Team'}</b>
              )}
            </div>
            <div className="mt-1 text-xs text-[color:var(--muted)]">автор</div>
          </div>
        </div>

        <div className="mt-5 flex flex-col items-start gap-3">
          <div className="flex flex-wrap gap-3">
            <Button href={isPrivate && quiz.accessCode ? `/catalog/private/${quiz.accessCode}` : `/catalog/${quiz.id}`} variant="ghost">
              Подробнее
            </Button>
            {canPlay ? (
              <>
                <Button href={soloHref}>Пройти самому</Button>
                {quiz.roomCode ? <Button href={`/join?room=${quiz.roomCode}`} variant="ghost"><Radio size={16} /> Live</Button> : null}
              </>
            ) : null}
          </div>
          {!canPlay && (
            <span className="inline-flex items-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--chip-bg)] px-4 py-3 text-sm font-black text-[color:var(--chip-text)]">
              Роль организатора: только проведение
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
