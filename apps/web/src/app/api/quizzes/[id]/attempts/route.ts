import { NextResponse } from 'next/server';
import { prisma, QuizStatus } from '@quizpulse/db';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const quiz = await prisma.quiz.findFirst({
    where: { id, status: QuizStatus.PUBLISHED },
    select: { id: true }
  });

  if (!quiz) return NextResponse.json({ message: 'Квиз не найден.' }, { status: 404 });

  const updated = await prisma.quiz.update({
    where: { id },
    data: { playCount: { increment: 1 } },
    select: { playCount: true, ratingAverage: true, ratingCount: true }
  });

  return NextResponse.json({ ok: true, stats: updated });
}
