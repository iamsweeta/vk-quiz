import { NextResponse } from 'next/server';
import { prisma } from '@quizpulse/db';
import { requireRole, UserRole } from '@/lib/auth';

function createRoomCode() {
  return `QP-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(UserRole.ORGANIZER);
  const { id } = await params;

  const quiz = await prisma.quiz.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true, questions: { select: { id: true }, take: 1 } }
  });

  if (!quiz) return NextResponse.json({ message: 'Квиз не найден или недоступен.' }, { status: 404 });
  if (!quiz.questions.length) return NextResponse.json({ message: 'Нельзя запускать квиз без вопросов.' }, { status: 400 });

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = createRoomCode();
    const existing = await prisma.room.findUnique({ where: { code }, select: { id: true } });
    if (existing) continue;

    const room = await prisma.room.create({
      data: {
        code,
        quizId: quiz.id,
        hostId: user.id
      },
      select: { id: true, code: true }
    });

    return NextResponse.json({ roomCode: room.code });
  }

  return NextResponse.json({ message: 'Не удалось сгенерировать код комнаты. Повторите попытку.' }, { status: 500 });
}
