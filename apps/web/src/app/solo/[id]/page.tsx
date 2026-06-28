import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getCurrentUser } from '@/lib/auth';
import { SoloQuizClient } from '@/features/solo/SoloQuizClient';
import { prisma, QuizStatus, QuizVisibility } from '@quizpulse/db';

export default async function SoloQuizPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ access?: string }>;
}) {
  const { id } = await params;
  const { access } = await searchParams;
  const accessCode = access ? decodeURIComponent(access).trim().toUpperCase() : undefined;
  const user = await getCurrentUser();

  if (user?.role === 'ORGANIZER' || user?.role === 'ADMIN') {
    return (
      <AppShell>
        <section className="mx-auto max-w-2xl px-5 py-16">
          <Card>
            <div className="text-sm font-black text-cyan">Режим организатора</div>
            <h1 className="mt-3 text-4xl font-black">Прохождение квизов недоступно</h1>
            <p className="mt-3 leading-7 text-[color:var(--muted)]">
              Сейчас вы вошли как организатор. В этой роли доступно создание, редактирование и проведение live-квизов, но не участие в прохождении. Переключитесь на роль участника, чтобы проходить квизы.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href="/dashboard/organizer">К кабинету организатора</Button>
              <Button href="/catalog" variant="ghost">Назад в каталог</Button>
            </div>
          </Card>
        </section>
      </AppShell>
    );
  }

  const quiz = await prisma.quiz.findFirst({
    where: accessCode
      ? {
          id,
          status: QuizStatus.PUBLISHED,
          OR: [
            { visibility: QuizVisibility.PUBLIC },
            { visibility: QuizVisibility.PRIVATE, accessCode }
          ]
        }
      : {
          id,
          status: QuizStatus.PUBLISHED,
          visibility: QuizVisibility.PUBLIC
        },
    include: {
      category: true,
      questions: {
        orderBy: { order: 'asc' },
        include: {
          options: { orderBy: { order: 'asc' } }
        }
      }
    }
  });

  if (!quiz) notFound();

  const viewerRating = user
    ? await prisma.quizRating.findUnique({
        where: { quizId_userId: { quizId: quiz.id, userId: user.id } },
        select: { value: true }
      })
    : null;

  return (
    <AppShell>
      <SoloQuizClient
        viewerRating={viewerRating?.value ?? null}
        quiz={{
          id: quiz.id,
          title: quiz.title,
          description: quiz.description,
          coverImageUrl: quiz.coverImageUrl,
          category: quiz.category?.name,
          questions: quiz.questions.map((question) => ({
            id: question.id,
            text: question.text,
            imageUrl: question.imageUrl,
            answerMode: question.answerMode,
            points: question.points,
            options: question.options.map((option) => ({
              id: option.id,
              text: option.text,
              imageUrl: option.imageUrl,
              isCorrect: option.isCorrect
            }))
          }))
        }}
      />
    </AppShell>
  );
}
