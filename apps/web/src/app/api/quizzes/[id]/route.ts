import { NextResponse } from 'next/server';
import { prisma, Prisma } from '@quizpulse/db';
import { requireRole, UserRole } from '@/lib/auth';
import { normalizeQuizPayload, validateQuizPayload } from '@/lib/quizzes/payload';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(UserRole.ORGANIZER);
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const payload = normalizeQuizPayload(body);
  const validationError = validateQuizPayload(payload);
  if (validationError) return NextResponse.json({ message: validationError }, { status: 400 });

  const existing = await prisma.quiz.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true }
  });

  if (!existing) return NextResponse.json({ message: 'Квиз не найден или недоступен.' }, { status: 404 });

  const category = await prisma.category.upsert({
    where: { name: payload.categoryName },
    update: {},
    create: { name: payload.categoryName, icon: 'Sparkles' }
  });

  try {
    const quiz = await prisma.$transaction(async (tx) => {
      await tx.question.deleteMany({ where: { quizId: id } });

      return tx.quiz.update({
        where: { id },
        data: {
          title: payload.title,
          description: payload.description || null,
          coverImageUrl: payload.coverImageUrl || null,
          defaultQuestionTime: payload.defaultQuestionTime,
          status: payload.status,
          visibility: payload.visibility,
          accessCode: payload.accessCode,
          categoryId: category.id,
          questions: {
            create: payload.questions.map((question) => ({
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
        include: {
          category: true,
          questions: { include: { options: true }, orderBy: { order: 'asc' } }
        }
      });
    });

    return NextResponse.json({ quiz });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ message: 'Такой приватный код уже используется. Выберите другой код.' }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole(UserRole.ORGANIZER);
  const { id } = await params;

  const existing = await prisma.quiz.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true }
  });

  if (!existing) return NextResponse.json({ message: 'Квиз не найден или недоступен.' }, { status: 404 });

  await prisma.quiz.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
