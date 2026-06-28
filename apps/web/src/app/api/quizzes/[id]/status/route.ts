import { NextResponse } from 'next/server';
import { prisma, QuizStatus } from '@quizpulse/db';
import { requireRole, UserRole } from '@/lib/auth';

function isQuizStatus(value: unknown): value is QuizStatus {
  return value === QuizStatus.DRAFT || value === QuizStatus.PUBLISHED || value === QuizStatus.ARCHIVED;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(UserRole.ORGANIZER);
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status;

  if (!isQuizStatus(status)) {
    return NextResponse.json({ message: 'Некорректный статус квиза.' }, { status: 400 });
  }

  const existing = await prisma.quiz.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true }
  });

  if (!existing) {
    return NextResponse.json({ message: 'Квиз не найден или недоступен.' }, { status: 404 });
  }

  const quiz = await prisma.quiz.update({
    where: { id },
    data: { status },
    select: { id: true, status: true }
  });

  return NextResponse.json({ quiz });
}
