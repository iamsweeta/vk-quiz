import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@quizpulse/db';

export const runtime = 'nodejs';

type SaveLiveProgressPayload = {
  code?: string;
  nickname?: string;
  questionId?: string;
  selectedOptionIds?: string[];
  scoreAwarded?: number;
  totalScore?: number;
  isCorrect?: boolean;
};

export async function POST(request: Request) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, message: 'Нужно войти в аккаунт.' },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as SaveLiveProgressPayload | null;

  const code = String(body?.code ?? '').trim().toUpperCase();
  const nickname = String(body?.nickname ?? user.name ?? 'Игрок').trim().slice(0, 32) || 'Игрок';
  const questionId = String(body?.questionId ?? '').trim();

  const selectedOptionIds = Array.isArray(body?.selectedOptionIds)
    ? body.selectedOptionIds.map(String).filter(Boolean)
    : [];

  const scoreAwarded = Number.isFinite(Number(body?.scoreAwarded))
    ? Math.max(0, Math.round(Number(body?.scoreAwarded)))
    : 0;

  const totalScore = Number.isFinite(Number(body?.totalScore))
    ? Math.max(0, Math.round(Number(body?.totalScore)))
    : 0;

  if (!code || !questionId || selectedOptionIds.length === 0) {
    return NextResponse.json(
      { ok: false, message: 'Недостаточно данных.' },
      { status: 400 }
    );
  }

  const room = await prisma.room.findUnique({
    where: { code },
    select: { id: true }
  });

  if (!room) {
    return NextResponse.json(
      { ok: false, message: 'Комната не найдена в базе.' },
      { status: 404 }
    );
  }

  let participant = await prisma.roomParticipant.findFirst({
    where: {
      roomId: room.id,
      userId: user.id
    },
    orderBy: {
      joinedAt: 'desc'
    },
    select: {
      id: true
    }
  });

  if (!participant) {
    participant = await prisma.roomParticipant.create({
      data: {
        roomId: room.id,
        userId: user.id,
        nickname,
        score: totalScore
      },
      select: {
        id: true
      }
    });
  } else {
    await prisma.roomParticipant.update({
      where: {
        id: participant.id
      },
      data: {
        nickname,
        score: totalScore
      }
    });
  }

  await prisma.answerSubmission.upsert({
    where: {
      roomId_participantId_questionId: {
        roomId: room.id,
        participantId: participant.id,
        questionId
      }
    },
    update: {
      selectedOptionIds,
      isCorrect: Boolean(body?.isCorrect),
      scoreAwarded
    },
    create: {
      roomId: room.id,
      participantId: participant.id,
      questionId,
      selectedOptionIds,
      isCorrect: Boolean(body?.isCorrect),
      scoreAwarded,
      responseTimeMs: 0
    }
  });

  return NextResponse.json({ ok: true });
}
