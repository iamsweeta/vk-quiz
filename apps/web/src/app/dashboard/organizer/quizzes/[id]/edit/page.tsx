import { notFound } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { prisma } from '@quizpulse/db';
import { requireRole, UserRole } from '@/lib/auth';
import { QuizBuilderForm, type QuizBuilderInitialData } from '@/features/quiz-builder/QuizBuilderForm';

export default async function EditQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(UserRole.ORGANIZER);
  const { id } = await params;

  const quiz = await prisma.quiz.findFirst({
    where: { id, ownerId: user.id },
    include: {
      category: true,
      questions: {
        orderBy: { order: 'asc' },
        include: { options: { orderBy: { order: 'asc' } } }
      }
    }
  });

  if (!quiz) notFound();

  const initialData: QuizBuilderInitialData = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description ?? '',
    coverImageUrl: quiz.coverImageUrl ?? '',
    defaultQuestionTime: quiz.defaultQuestionTime,
    visibility: quiz.visibility,
    accessCode: quiz.accessCode ?? '',
    status: quiz.status,
    categoryName: quiz.category?.name ?? 'Пользовательские',
    questions: quiz.questions.map((question) => ({
      clientId: question.id,
      text: question.text,
      imageUrl: question.imageUrl ?? '',
      answerMode: question.answerMode,
      timeLimit: question.timeLimit,
      points: question.points,
      options: question.options.map((option) => ({
        clientId: option.id,
        text: option.text,
        imageUrl: option.imageUrl ?? '',
        isCorrect: option.isCorrect
      }))
    }))
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-cyan">Редактор квиза</p>
            <h1 className="mt-2 text-4xl font-black md:text-5xl">{quiz.title}</h1>
            <p className="mt-3 max-w-2xl text-[color:var(--muted)]">
              Можно изменить настройки, доступ, обложку, вопросы, варианты ответа, правильные ответы, баллы и порядок вопросов.
            </p>
          </div>
          <Button href="/dashboard/organizer/quizzes" variant="ghost">Назад к списку</Button>
        </div>

        <QuizBuilderForm mode="edit" initialData={initialData} />
      </section>
    </AppShell>
  );
}
