import { BarChart3, HelpCircle, Target, TrendingDown } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { prisma } from '@quizpulse/db';
import { requireRole, UserRole } from '@/lib/auth';

export default async function OrganizerAnalyticsPage() {
  const user = await requireRole(UserRole.ORGANIZER);

  const quizzes = await prisma.quiz.findMany({
    where: { ownerId: user.id },
    include: {
      category: true,
      questions: {
        orderBy: { order: 'asc' },
        include: { submissions: { select: { scoreAwarded: true, isCorrect: true } } }
      },
      rooms: { select: { id: true } },
      _count: { select: { questions: true, rooms: true, ratings: true } }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const rows = quizzes.flatMap((quiz) => quiz.questions.map((question) => {
    const submissions = question.submissions.length;
    const correct = question.submissions.filter((item) => item.isCorrect).length;
    const totalScore = question.submissions.reduce((sum, item) => sum + item.scoreAwarded, 0);
    const averageScore = submissions ? Math.round(totalScore / submissions) : 0;
    const accuracy = submissions ? Math.round((correct / submissions) * 100) : 0;
    return {
      quizId: quiz.id,
      quizTitle: quiz.title,
      questionText: question.text || 'Вопрос по изображению',
      questionPoints: question.points,
      submissions,
      correct,
      averageScore,
      accuracy
    };
  }));

  const hardest = rows
    .filter((row) => row.submissions > 0)
    .sort((a, b) => a.accuracy - b.accuracy || b.submissions - a.submissions)
    .slice(0, 8);

  const totalRooms = quizzes.reduce((sum, quiz) => sum + quiz._count.rooms, 0);
  const totalQuestions = quizzes.reduce((sum, quiz) => sum + quiz._count.questions, 0);
  const totalSubmissions = rows.reduce((sum, row) => sum + row.submissions, 0);
  const averageAccuracy = rows.filter((row) => row.submissions > 0).length
    ? Math.round(rows.filter((row) => row.submissions > 0).reduce((sum, row) => sum + row.accuracy, 0) / rows.filter((row) => row.submissions > 0).length)
    : 0;

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-3 py-6 sm:px-5 sm:py-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Badge>Аналитика организатора</Badge>
            <h1 className="mt-4 text-3xl font-black sm:text-5xl md:text-7xl">Где участники ошибаются</h1>
            <p className="mt-4 max-w-3xl text-[color:var(--muted)]">Смотрите сложные вопросы, средний балл и точность ответов, чтобы улучшать квизы.</p>
          </div>
          <Button href="/dashboard/organizer/quizzes" variant="ghost">Мои квизы</Button>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card className="grid place-items-center p-4 text-center sm:p-6"><BarChart3 className="mb-2 text-cyan" /><div className="text-xs text-[color:var(--muted)] sm:text-sm">Квизов</div><div className="mt-1 text-3xl font-black sm:text-4xl">{quizzes.length}</div></Card>
          <Card className="grid place-items-center p-4 text-center sm:p-6"><HelpCircle className="mb-2 text-cyan" /><div className="text-xs text-[color:var(--muted)] sm:text-sm">Вопросов</div><div className="mt-1 text-3xl font-black sm:text-4xl">{totalQuestions}</div></Card>
          <Card className="grid place-items-center p-4 text-center sm:p-6"><Target className="mb-2 text-cyan" /><div className="text-xs text-[color:var(--muted)] sm:text-sm">Ответов</div><div className="mt-1 text-3xl font-black sm:text-4xl">{totalSubmissions}</div></Card>
          <Card className="grid place-items-center p-4 text-center sm:p-6"><TrendingDown className="mb-2 text-cyan" /><div className="text-xs text-[color:var(--muted)] sm:text-sm">Средняя точность</div><div className="mt-1 text-3xl font-black sm:text-4xl">{averageAccuracy}%</div></Card>
        </div>

        <Card className="mt-8">
          <div className="mb-5 flex items-center gap-3">
            <TrendingDown className="text-cyan" />
            <h2 className="text-2xl font-black">Самые сложные вопросы</h2>
          </div>
          <div className="grid gap-3">
            {hardest.map((row) => (
              <div key={`${row.quizId}-${row.questionText}`} className="rounded-3xl border border-[color:var(--border)] bg-[color:var(--glass)] p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <div className="text-xs font-black uppercase tracking-wide text-cyan">{row.quizTitle}</div>
                    <div className="mt-1 text-lg font-black">{row.questionText}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm font-black">
                    <span className="rounded-full bg-[color:var(--card-strong)] px-3 py-2">точность {row.accuracy}%</span>
                    <span className="rounded-full bg-[color:var(--card-strong)] px-3 py-2">ответов {row.submissions}</span>
                    <span className="rounded-full bg-[color:var(--card-strong)] px-3 py-2">средний балл {row.averageScore}</span>
                  </div>
                </div>
              </div>
            ))}
            {!hardest.length && (
              <p className="rounded-3xl bg-[color:var(--glass)] p-5 text-[color:var(--muted)]">Пока нет ответов в live-комнатах. Запустите квиз и соберите ответы участников.</p>
            )}
          </div>
        </Card>

        <Card className="mt-8">
          <h2 className="text-2xl font-black">Сводка по квизам</h2>
          <div className="mt-5 grid gap-3">
            {quizzes.map((quiz) => {
              const quizRows = rows.filter((row) => row.quizId === quiz.id && row.submissions > 0);
              const quizAccuracy = quizRows.length ? Math.round(quizRows.reduce((sum, row) => sum + row.accuracy, 0) / quizRows.length) : 0;
              return (
                <div key={quiz.id} className="flex flex-col justify-between gap-3 rounded-3xl border border-[color:var(--border)] bg-[color:var(--glass)] p-4 md:flex-row md:items-center">
                  <div>
                    <div className="font-black">{quiz.title}</div>
                    <div className="mt-1 text-sm text-[color:var(--muted)]">{quiz.category?.name ?? 'Без категории'} · {quiz._count.questions} вопросов · {quiz._count.rooms} комнат</div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm font-black text-[color:var(--muted)]">
                    <span className="rounded-full bg-[color:var(--card-strong)] px-3 py-2">точность {quizAccuracy}%</span>
                    <span className="rounded-full bg-[color:var(--card-strong)] px-3 py-2">оценок {quiz._count.ratings}</span>
                    <span className="rounded-full bg-[color:var(--card-strong)] px-3 py-2">рейтинг {quiz.ratingAverage || '—'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
