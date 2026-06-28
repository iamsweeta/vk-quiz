import { Eye, LockKeyhole, Search } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { prisma, QuizStatus, QuizVisibility } from '@quizpulse/db';
import { LaunchQuizButton } from '@/features/live/LaunchQuizButton';
import { ArchiveQuizButton } from '@/features/quizzes/ArchiveQuizButton';
import { requireRole, UserRole } from '@/lib/auth';

function statusLabel(status: string) {
  if (status === 'PUBLISHED') return 'Готово';
  if (status === 'ARCHIVED') return 'Архив';
  return 'Черновик';
}

function statusDescription(status: string) {
  if (status === 'PUBLISHED') return 'опубликован и может быть доступен пользователям';
  if (status === 'ARCHIVED') return 'скрыт из активной работы';
  return 'можно продолжить редактирование';
}

function isQuizStatus(value: string): value is QuizStatus {
  return value === QuizStatus.DRAFT || value === QuizStatus.PUBLISHED || value === QuizStatus.ARCHIVED;
}

export default async function QuizzesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await requireRole(UserRole.ORGANIZER);
  const params = await searchParams;
  const query = String(params.q || '').trim();
  const status = String(params.status || 'ALL').trim();

  const where: {
    ownerId: string;
    status?: QuizStatus;
    OR?: Array<{ title?: { contains: string; mode: 'insensitive' } } | { description?: { contains: string; mode: 'insensitive' } }>;
  } = { ownerId: user.id };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } }
    ];
  }

  if (isQuizStatus(status)) {
    where.status = status;
  }

  const [quizzes, counters] = await Promise.all([
    prisma.quiz.findMany({
      where,
      include: {
        category: true,
        _count: { select: { questions: true, rooms: true } }
      },
      orderBy: { updatedAt: 'desc' }
    }),
    prisma.quiz.groupBy({
      by: ['status'],
      where: { ownerId: user.id },
      _count: { _all: true }
    })
  ]);

  const countByStatus = Object.fromEntries(counters.map((item) => [item.status, item._count._all]));
  const totalCount = counters.reduce((sum, item) => sum + item._count._all, 0);

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-cyan">Квизы</p>
            <h1 className="mt-2 text-5xl font-black">Мои квизы</h1>
            <p className="mt-3 max-w-2xl text-[color:var(--muted)]">
              Ищите свои квизы по названию, фильтруйте черновики, готовые публикации и архив.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/dashboard/organizer/quizzes/new">Создать</Button>
            <Button href="/catalog" variant="ghost">Открыть каталог</Button>
          </div>
        </div>

        <form className="mt-8 grid gap-3 rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--glass)] p-4 shadow-soft lg:grid-cols-[1fr_260px_auto]" action="/dashboard/organizer/quizzes">
          <label className="grid gap-2 text-sm font-bold">
            Поиск по названию
            <div className="relative">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--muted)]" />
              <input
                name="q"
                defaultValue={query}
                placeholder="Например: история, команда, экзамен"
                className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--input)] py-3 pl-11 pr-4 text-[color:var(--foreground)] outline-none transition focus:border-cyan focus:ring-4 focus:ring-cyan/10"
              />
            </div>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Состояние
            <select
              name="status"
              defaultValue={status || 'ALL'}
              className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--input)] px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-cyan focus:ring-4 focus:ring-cyan/10"
            >
              <option value="ALL">Все квизы ({totalCount})</option>
              <option value="DRAFT">Черновики ({countByStatus.DRAFT ?? 0})</option>
              <option value="PUBLISHED">Готово ({countByStatus.PUBLISHED ?? 0})</option>
              <option value="ARCHIVED">Архив ({countByStatus.ARCHIVED ?? 0})</option>
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button className="h-[50px] w-full lg:w-auto" type="submit">Найти</Button>
            {(query || (status && status !== 'ALL')) && <Button className="h-[50px]" href="/dashboard/organizer/quizzes" variant="ghost">Сбросить</Button>}
          </div>
        </form>

        <div className="mt-6 grid gap-3 md:grid-cols-4">
          {[
            ['ALL', 'Все', totalCount],
            ['DRAFT', 'Черновики', countByStatus.DRAFT ?? 0],
            ['PUBLISHED', 'Готово', countByStatus.PUBLISHED ?? 0],
            ['ARCHIVED', 'Архив', countByStatus.ARCHIVED ?? 0]
          ].map(([value, label, count]) => {
            const active = status === value || (!status && value === 'ALL');
            const href = value === 'ALL' ? `/dashboard/organizer/quizzes${query ? `?q=${encodeURIComponent(query)}` : ''}` : `/dashboard/organizer/quizzes?status=${value}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
            return (
              <a
                key={String(value)}
                href={href}
                className={`rounded-3xl border p-4 shadow-soft transition hover:-translate-y-0.5 ${active ? 'border-cyan bg-cyan/10' : 'border-[color:var(--border)] bg-[color:var(--card)]'}`}
              >
                <div className="text-sm font-black text-[color:var(--muted)]">{label}</div>
                <div className="mt-1 text-3xl font-black">{String(count)}</div>
              </a>
            );
          })}
        </div>

        <div className="mt-8 grid gap-4">
          {quizzes.map((quiz) => {
            const isPublic = quiz.visibility === QuizVisibility.PUBLIC;
            return (
              <Card key={quiz.id} className="overflow-hidden p-0">
                <div className="flex flex-col justify-between gap-5 p-6 lg:flex-row lg:items-center">
                  <div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Badge>{quiz.category?.name ?? 'Без категории'}</Badge>
                      <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--glass)] px-3 py-1 text-xs font-black text-[color:var(--muted)]">
                        {isPublic ? <Eye size={14} /> : <LockKeyhole size={14} />}
                        {isPublic ? 'Public catalog' : 'Private code'}
                      </span>
                      <span className="rounded-full border border-[color:var(--border)] bg-[color:var(--glass)] px-3 py-1 text-xs font-black text-[color:var(--muted)]">
                        {statusLabel(quiz.status)} · {statusDescription(quiz.status)}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black md:text-3xl">{quiz.title}</h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">{quiz.description || 'Описание пока не заполнено.'}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs font-black uppercase tracking-wide text-[color:var(--muted)]">
                      <span className="rounded-full bg-[color:var(--glass)] px-3 py-2">{quiz._count.questions} вопросов</span>
                      <span className="rounded-full bg-[color:var(--glass)] px-3 py-2">{quiz._count.rooms} комнат</span>
                      {!isPublic && quiz.accessCode && (
                        <span className="rounded-full bg-warning/10 px-3 py-2 text-warning">код: {quiz.accessCode}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button href={`/dashboard/organizer/quizzes/${quiz.id}/edit`} variant="ghost">Редактировать</Button>
                    {isPublic ? (
                      <Button href={`/catalog/${quiz.id}`} variant="ghost">В каталоге</Button>
                    ) : quiz.accessCode ? (
                      <Button href={`/catalog/private/${quiz.accessCode}`} variant="ghost">Проверить доступ</Button>
                    ) : null}
                    <ArchiveQuizButton quizId={quiz.id} status={quiz.status} />
                    {quiz.status !== QuizStatus.ARCHIVED && <LaunchQuizButton quizId={quiz.id} label="Запустить live" />}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {quizzes.length === 0 && (
          <Card className="mt-8 text-center">
            <h2 className="text-2xl font-black">Квизы не найдены</h2>
            <p className="mt-2 text-[color:var(--muted)]">Измените поиск или сбросьте фильтры.</p>
            <Button href="/dashboard/organizer/quizzes" className="mt-5">Показать все</Button>
          </Card>
        )}
      </section>
    </AppShell>
  );
}
