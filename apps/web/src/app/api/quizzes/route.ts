import { NextResponse } from 'next/server';
import { prisma, Prisma } from '@quizpulse/db';
import { requireRole, UserRole } from '@/lib/auth';
import { normalizeQuizPayload, validateQuizPayload } from '@/lib/quizzes/payload';

export async function GET() {
  const quizzes = await prisma.quiz.findMany({
    where: {
      status: 'PUBLISHED',
      visibility: 'PUBLIC'
    },
    include: {
      category: true,
      owner: { select: { id: true, name: true } },
      _count: { select: { questions: true, rooms: true } }
    },
    orderBy: [
      { ratingAverage: 'desc' },
      { playCount: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  return NextResponse.json({ quizzes });
}

export async function POST(request: Request) {
  const user = await requireRole(UserRole.ORGANIZER);
  const body = await request.json().catch(() => null);
  const payload = normalizeQuizPayload(body);
  const validationError = validateQuizPayload(payload);
  if (validationError) return NextResponse.json({ message: validationError }, { status: 400 });

  const category = await prisma.category.upsert({
    where: { name: payload.categoryName },
    update: {},
    create: { name: payload.categoryName, icon: 'Sparkles' }
  });

  try {
    const quiz = await prisma.quiz.create({
      data: {
        title: payload.title,
        description: payload.description || null,
        coverImageUrl: payload.coverImageUrl || null,
        defaultQuestionTime: payload.defaultQuestionTime,
        status: payload.status,
        visibility: payload.visibility,
        accessCode: payload.accessCode,
        ownerId: user.id,
        categoryId: category.id,
        questions: {
          create: payload.questions.map((question: any) => ({
            text: question.text,
            imageUrl: question.imageUrl || null,
            type: question.type,
            answerMode: question.answerMode,
            timeLimit: question.timeLimit,
            points: question.points,
            order: question.order,
            options: { create: question.options }
          }))
        }
      },
      include: { _count: { select: { questions: true } } }
    });

    const roomCode = `QP-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    await prisma.room.create({
      data: {
        code: roomCode,
        quizId: quiz.id,
        hostId: user.id
      }
    });

    return NextResponse.json({ quiz, roomCode }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'Такой приватный код уже используется. Выберите другой код.' }, { status: 409 });
    }
    throw error;
  }
}
