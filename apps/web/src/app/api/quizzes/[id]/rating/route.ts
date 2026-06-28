import { NextResponse } from 'next/server';
import { prisma, QuizStatus } from '@quizpulse/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const value = Number(body?.value);

  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return NextResponse.json({ message: 'Оценка должна быть от 1 до 5.' }, { status: 400 });
  }

  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json({ message: 'Чтобы оценить квиз, войдите в аккаунт.' }, { status: 401 });
  }

  const quiz = await prisma.quiz.findFirst({
    where: { id, status: QuizStatus.PUBLISHED },
    select: { id: true, ratingCount: true, ratingSum: true }
  });

  if (!quiz) return NextResponse.json({ message: 'Квиз не найден.' }, { status: 404 });

  const existingRating = await prisma.quizRating.findUnique({
    where: { quizId_userId: { quizId: id, userId: user.id } },
    select: { id: true, value: true }
  });

  const ratingCount = existingRating ? Math.max(quiz.ratingCount, 1) : quiz.ratingCount + 1;
  const ratingSum = existingRating
    ? (quiz.ratingSum >= existingRating.value ? quiz.ratingSum - existingRating.value + value : value)
    : quiz.ratingSum + value;
  const ratingAverage = ratingCount ? Math.round((ratingSum / ratingCount) * 10) / 10 : 0;

  const [updated] = await prisma.$transaction([
    prisma.quiz.update({
      where: { id },
      data: {
        ratingCount,
        ratingSum,
        ratingAverage
      },
      select: { ratingAverage: true, ratingCount: true, playCount: true }
    }),
    existingRating
      ? prisma.quizRating.update({
          where: { id: existingRating.id },
          data: { value }
        })
      : prisma.quizRating.create({
          data: {
            quizId: id,
            userId: user.id,
            value
          }
        })
  ]);

  return NextResponse.json({
    ok: true,
    stats: updated,
    value,
    updated: Boolean(existingRating),
    message: existingRating ? `Оценка изменена на ${value} из 5.` : `Вы оценили квиз на ${value} из 5.`
  });
}
