import { notFound } from 'next/navigation';
import { BookOpen, Star, UserRound } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { QuizCatalogCard } from '@/components/catalog/QuizCatalogCard';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { getCurrentUser } from '@/lib/auth';
import { prisma, QuizStatus, QuizVisibility, RoomStatus } from '@quizpulse/db';

export default async function AuthorPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getCurrentUser();

  const author = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      mascotType: true,
      mascotColor: true,
      quizzes: {
        where: { status: QuizStatus.PUBLISHED, visibility: QuizVisibility.PUBLIC },
        include: {
          category: true,
          owner: { select: { id: true, name: true } },
          rooms: {
            where: { status: { in: [RoomStatus.WAITING, RoomStatus.ACTIVE] } },
            orderBy: { createdAt: 'desc' },
            take: 1
          },
          questions: { select: { timeLimit: true } },
          _count: { select: { questions: true, rooms: true } }
        },
        orderBy: [{ ratingAverage: 'desc' }, { playCount: 'desc' }, { createdAt: 'desc' }]
      }
    }
  });

  if (!author) notFound();

  const quizCount = author.quizzes.length;
  const playCount = author.quizzes.reduce((sum, quiz) => sum + quiz.playCount, 0);
  const ratingCount = author.quizzes.reduce((sum, quiz) => sum + quiz.ratingCount, 0);
  const ratingAverage = ratingCount
    ? Math.round((author.quizzes.reduce((sum, quiz) => sum + quiz.ratingSum, 0) / ratingCount) * 10) / 10
    : 0;

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="grid gap-5 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <Badge>Публичная страница автора</Badge>
            <div className="mt-5 flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-3xl border border-[color:var(--border)] bg-[color:var(--glass)] text-cyan">
                <UserRound size={32} />
              </div>
              <div>
                <h1 className="text-5xl font-black md:text-7xl">{author.name}</h1>
                <p className="mt-2 text-[color:var(--muted)]">Все публичные квизы этого организатора.</p>
              </div>
            </div>
          </div>
          <Card>
            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-2xl bg-[color:var(--glass)] p-4"><span className="flex items-center gap-2 text-[color:var(--muted)]"><BookOpen size={18} /> Квизов</span><b>{quizCount}</b></div>
              <div className="flex items-center justify-between rounded-2xl bg-[color:var(--glass)] p-4"><span className="flex items-center gap-2 text-[color:var(--muted)]"><UserRound size={18} /> Прохождений</span><b>{playCount}</b></div>
              <div className="flex items-center justify-between rounded-2xl bg-[color:var(--glass)] p-4"><span className="flex items-center gap-2 text-[color:var(--muted)]"><Star size={18} /> Рейтинг</span><b>{ratingCount ? `${ratingAverage} / 5` : 'нет'}</b></div>
            </div>
          </Card>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {author.quizzes.map((quiz) => (
            <QuizCatalogCard
              key={quiz.id}
              quiz={{
                id: quiz.id,
                title: quiz.title,
                description: quiz.description,
                coverImageUrl: quiz.coverImageUrl,
                visibility: quiz.visibility,
                accessCode: quiz.accessCode,
                category: quiz.category,
                owner: quiz.owner,
                roomCode: quiz.rooms[0]?.code,
                questionsCount: quiz._count.questions,
                roomsCount: quiz._count.rooms,
                playCount: quiz.playCount,
                ratingAverage: quiz.ratingAverage,
                ratingCount: quiz.ratingCount,
                totalTimeSeconds: quiz.questions.reduce((sum, question) => sum + question.timeLimit, 0)
              }}
              viewerRole={viewer?.role ?? null}
            />
          ))}
        </div>

        {author.quizzes.length === 0 && (
          <Card className="mt-10 text-center">
            <h2 className="text-2xl font-black">У автора пока нет публичных квизов</h2>
            <p className="mt-2 text-[color:var(--muted)]">Когда он опубликует квизы, они появятся здесь.</p>
          </Card>
        )}
      </section>
    </AppShell>
  );
}
