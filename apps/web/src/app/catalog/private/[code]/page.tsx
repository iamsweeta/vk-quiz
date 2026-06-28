import { notFound } from 'next/navigation';
import { BookOpen, Clock, LockKeyhole, Radio, UserRound } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { QuizFallbackCover } from '@/components/quiz/QuizFallbackCover';
import { getCurrentUser } from '@/lib/auth';
import { prisma, QuizStatus, QuizVisibility, RoomStatus } from '@quizpulse/db';

export default async function PrivateQuizDetailsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const accessCode = decodeURIComponent(code).trim().toUpperCase();
  const user = await getCurrentUser();
  const canPlay = user?.role !== 'ORGANIZER' && user?.role !== 'ADMIN';

  const quiz = await prisma.quiz.findFirst({
    where: {
      accessCode,
      status: QuizStatus.PUBLISHED,
      visibility: QuizVisibility.PRIVATE
    },
    include: {
      category: true,
      owner: { select: { id: true, name: true } },
      questions: {
        orderBy: { order: 'asc' },
        select: { id: true, text: true, imageUrl: true, timeLimit: true, points: true, answerMode: true }
      },
      rooms: {
        where: { status: { in: [RoomStatus.WAITING, RoomStatus.ACTIVE] } },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!quiz) notFound();

  const activeRoom = quiz.rooms[0];
  const totalTimeSeconds = quiz.questions.reduce((sum, question) => sum + question.timeLimit, 0);
  const totalTimeMinutes = Math.max(1, Math.ceil(totalTimeSeconds / 60));

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8 aspect-[16/7] overflow-hidden rounded-[2rem] border border-warning/20 bg-[color:var(--glass)] shadow-soft">
          {quiz.coverImageUrl ? (
            <img src={quiz.coverImageUrl} alt={quiz.title} className="h-full w-full object-cover" />
          ) : (
            <QuizFallbackCover title={quiz.title} category={quiz.category?.name} />
          )}
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <Badge>Private access granted</Badge>
            <h1 className="mt-5 text-5xl font-black md:text-7xl">{quiz.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[color:var(--muted)]">{quiz.description}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {canPlay ? (
                <>
                  <Button href={`/solo/${quiz.id}?access=${encodeURIComponent(quiz.accessCode ?? '')}`}>Пройти без организатора</Button>
                  {activeRoom ? (
                    <Button href={`/join?room=${activeRoom.code}`} variant="ghost">Live-комната {activeRoom.code}</Button>
                  ) : (
                    <Button href="/join" variant="ghost">Войти по коду комнаты</Button>
                  )}
                </>
              ) : (
                <Button href="/dashboard/organizer">Роль организатора: перейти к проведению</Button>
              )}
              <Button href="/catalog" variant="ghost">Назад в каталог</Button>
            </div>
          </div>

          <Card>
            <div className="grid gap-3">
              <div className="flex items-center justify-between rounded-2xl bg-warning/10 p-4 text-warning">
                <span className="flex items-center gap-2"><LockKeyhole size={18} /> Доступ</span>
                <b>Приватный</b>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[color:var(--glass)] p-4">
                <span className="flex items-center gap-2 text-[color:var(--muted)]"><BookOpen size={18} /> Вопросов</span>
                <b>{quiz.questions.length}</b>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[color:var(--glass)] p-4">
                <span className="flex items-center gap-2 text-[color:var(--muted)]"><Clock size={18} /> Примерное время</span>
                <b>≈ {totalTimeMinutes} мин.</b>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-[color:var(--glass)] p-4">
                <span className="flex items-center gap-2 text-[color:var(--muted)]"><UserRound size={18} /> Автор</span>
                <a href={`/authors/${quiz.owner.id}`} className="font-black hover:text-cyan">{quiz.owner.name}</a>
              </div>
              {activeRoom && (
                <div className="flex items-center justify-between rounded-2xl bg-success/10 p-4 text-success">
                  <span className="flex items-center gap-2"><Radio size={18} /> Комната</span>
                  <b>{activeRoom.code}</b>
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="mt-10 rounded-[2rem] border border-warning/30 bg-warning/10 p-6 text-warning">
          <b>Приватный сценарий:</b> этот квиз не появляется в публичном каталоге. Участник увидит его только после ввода кода доступа: <b>{quiz.accessCode}</b>.
        </div>

        <div className="mt-10 grid gap-4">
          {quiz.questions.map((question, index) => (
            <Card key={question.id}>
              {question.imageUrl && (
                <div className="mb-4 aspect-[16/7] overflow-hidden rounded-3xl bg-[color:var(--glass)]">
                  <img src={question.imageUrl} alt={question.text} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="text-sm font-black text-cyan">Вопрос {index + 1}</div>
              <h3 className="mt-2 text-2xl font-black">{question.text}</h3>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-black uppercase tracking-wide text-[color:var(--muted)]">
                <span className="rounded-full bg-[color:var(--glass)] px-3 py-2">{question.answerMode === 'SINGLE' ? '1 ответ' : 'несколько'}</span>
                <span className="rounded-full bg-[color:var(--glass)] px-3 py-2">{question.timeLimit} сек</span>
                <span className="rounded-full bg-[color:var(--glass)] px-3 py-2">{question.points} очков</span>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
