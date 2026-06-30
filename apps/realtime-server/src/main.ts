import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { Server } from 'socket.io';
import { prisma } from '@quizpulse/db';
import {
  DEMO_ROOM_CODE,
  calculateScoreBreakdown,
  getLiveQuizForRoomCode,
  joinRoomSchema,
  sanitizeQuestion,
  socketEvents,
  submitAnswerSchema,
  type LeaderboardEntry,
  type PublicQuestion,
  type QuizQuestion,
  type RoomParticipant,
  type RoomSnapshot,
  type RoomStatus
} from '@quizpulse/shared';

const port = Number(process.env.PORT ?? process.env.REALTIME_PORT ?? 4000);
const configuredOrigins = (process.env.WEB_ORIGIN ?? process.env.APP_URL ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = Array.from(new Set([...configuredOrigins, 'http://localhost:3000', 'http://127.0.0.1:3000']));

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: allowedOrigins,
  credentials: true
});

app.get('/health', async () => ({
  ok: true,
  service: 'quizpulse-realtime',
  room: DEMO_ROOM_CODE
}));

const io = new Server(app.server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

type LiveQuiz = {
  id: string;
  title: string;
  questions: QuizQuestion[];
};

type AnswerRecord = {
  participantId: string;
  questionId: string;
  selectedOptionIds: string[];
  scoreAwarded: number;
  answeredAt: number;
};

type ActiveRoom = {
  code: string;
  status: RoomStatus;
  quiz: LiveQuiz;
  currentQuestionIndex: number;
  currentQuestion?: PublicQuestion;
  startedAt?: number;
  endsAt?: number;
  participants: Map<string, RoomParticipant>;
  answers: AnswerRecord[];
  timeout?: NodeJS.Timeout;
};

const rooms = new Map<string, ActiveRoom>();

async function loadQuizForRoomCode(code: string): Promise<LiveQuiz> {
  const dbRoom = await prisma.room.findUnique({
    where: { code },
    include: {
      quiz: {
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: { options: { orderBy: { order: 'asc' } } }
          }
        }
      }
    }
  });

  if (!dbRoom?.quiz?.questions.length) {
    return getLiveQuizForRoomCode(code);
  }

  return {
    id: dbRoom.quiz.id,
    title: dbRoom.quiz.title,
    questions: dbRoom.quiz.questions.map((question) => ({
      id: question.id,
      text: question.text || '',
      type: question.imageUrl ? 'IMAGE' : 'TEXT',
      answerMode: question.answerMode,
      imageUrl: question.imageUrl ?? undefined,
      timeLimit: question.timeLimit,
      points: question.points,
      options: question.options.map((option) => ({
        id: option.id,
        text: option.text || 'Вариант ответа',
        imageUrl: option.imageUrl ?? undefined,
        isCorrect: option.isCorrect
      }))
    }))
  };
}

async function createRoom(code = DEMO_ROOM_CODE): Promise<ActiveRoom> {
  const normalized = code.trim().toUpperCase();
  return {
    code: normalized,
    status: 'WAITING',
    quiz: await loadQuizForRoomCode(normalized),
    currentQuestionIndex: -1,
    participants: new Map(),
    answers: []
  };
}

async function getRoom(code: string): Promise<ActiveRoom> {
  const normalized = code.trim().toUpperCase();
  const existing = rooms.get(normalized);
  if (existing) return existing;

  const created = await createRoom(normalized);
  rooms.set(normalized, created);
  return created;
}

function leaderboard(room: ActiveRoom): LeaderboardEntry[] {
  return [...room.participants.values()]
    .map((participant) => ({
      participantId: participant.id,
      nickname: participant.nickname,
      score: participant.score,
      answeredCount: participant.answeredCount
    }))
    .sort((a, b) => b.score - a.score);
}

function snapshot(room: ActiveRoom): RoomSnapshot {
  return {
    code: room.code,
    status: room.status,
    currentQuestion: room.currentQuestion,
    participants: [...room.participants.values()],
    leaderboard: leaderboard(room)
  };
}

function emitState(room: ActiveRoom) {
  io.to(room.code).emit(socketEvents.roomState, snapshot(room));
  io.to(room.code).emit(socketEvents.leaderboardUpdated, leaderboard(room));
}

function findQuestion(room: ActiveRoom): QuizQuestion | undefined {
  if (room.currentQuestionIndex < 0) return undefined;
  return room.quiz.questions[room.currentQuestionIndex];
}

function startQuestion(room: ActiveRoom, index: number) {
  const question = room.quiz.questions[index];
  if (!question) {
    finishRoom(room);
    return;
  }

  if (room.timeout) clearTimeout(room.timeout);

  const startedAt = Date.now();
  const endsAt = startedAt + question.timeLimit * 1000;

  room.status = 'ACTIVE';
  room.currentQuestionIndex = index;
  room.startedAt = startedAt;
  room.endsAt = endsAt;
  room.currentQuestion = sanitizeQuestion(question, index + 1, room.quiz.questions.length, endsAt);
  room.answers = room.answers.filter((answer) => answer.questionId !== question.id);

  io.to(room.code).emit(socketEvents.questionStarted, room.currentQuestion);
  emitState(room);

  room.timeout = setTimeout(() => {
    io.to(room.code).emit(socketEvents.questionEnded, {
      questionId: question.id,
      leaderboard: leaderboard(room)
    });

    const isLastQuestion = index >= room.quiz.questions.length - 1;

    if (isLastQuestion) {
      finishRoom(room);
      return;
    }

    room.currentQuestion = undefined;
    room.startedAt = undefined;
    room.endsAt = undefined;
    emitState(room);
  }, question.timeLimit * 1000);
}

function finishRoom(room: ActiveRoom) {
  if (room.timeout) {
    clearTimeout(room.timeout);
    room.timeout = undefined;
  }

  room.status = 'FINISHED';
  room.currentQuestion = undefined;
  room.startedAt = undefined;
  room.endsAt = undefined;
  io.to(room.code).emit(socketEvents.quizFinished, leaderboard(room));
  emitState(room);
}

io.on('connection', (socket) => {
  socket.on(socketEvents.roomJoin, async (rawPayload) => {
    const parsed = joinRoomSchema.safeParse(rawPayload);
    if (!parsed.success) {
      socket.emit(socketEvents.error, 'Некорректные данные подключения к комнате.');
      return;
    }

    const { code, nickname, role } = parsed.data;
    const room = await getRoom(code);
    const participantId = socket.id;

    socket.join(room.code);

    if (role === 'PARTICIPANT') {
      const participant: RoomParticipant = {
        id: participantId,
        nickname,
        score: 0,
        answeredCount: 0
      };

      room.participants.set(participantId, participant);
      io.to(room.code).emit(socketEvents.participantJoined, participant);
    }

    socket.emit(socketEvents.roomJoined, snapshot(room));
    emitState(room);
  });

  socket.on(socketEvents.hostStartQuiz, async (rawPayload: { code?: string }) => {
    const code = rawPayload?.code?.trim().toUpperCase() || DEMO_ROOM_CODE;
    const room = await getRoom(code);

    room.status = 'ACTIVE';
    room.currentQuestionIndex = -1;
    room.currentQuestion = undefined;
    room.answers = [];
    room.participants.forEach((participant) => {
      participant.score = 0;
      participant.answeredCount = 0;
    });

    io.to(room.code).emit(socketEvents.quizStarted, {
      title: room.quiz.title,
      totalQuestions: room.quiz.questions.length
    });
    emitState(room);
  });

  socket.on(socketEvents.hostShowQuestion, async (rawPayload: { code?: string; index?: number }) => {
    const code = rawPayload?.code?.trim().toUpperCase() || DEMO_ROOM_CODE;
    const room = await getRoom(code);
    const nextIndex = typeof rawPayload?.index === 'number' ? rawPayload.index : room.currentQuestionIndex + 1;
    startQuestion(room, nextIndex);
  });

  socket.on(socketEvents.hostNextQuestion, async (rawPayload: { code?: string }) => {
    const code = rawPayload?.code?.trim().toUpperCase() || DEMO_ROOM_CODE;
    const room = await getRoom(code);
    startQuestion(room, room.currentQuestionIndex + 1);
  });

  socket.on(socketEvents.hostFinishQuiz, async (rawPayload: { code?: string }) => {
    const code = rawPayload?.code?.trim().toUpperCase() || DEMO_ROOM_CODE;
    const room = await getRoom(code);
    finishRoom(room);
  });

  socket.on(socketEvents.submitAnswer, async (rawPayload) => {
    const parsed = submitAnswerSchema.safeParse(rawPayload);
    if (!parsed.success) {
      socket.emit(socketEvents.error, 'Ответ не прошёл валидацию.');
      return;
    }

    const { code, questionId, selectedOptionIds } = parsed.data;
    const room = await getRoom(code);
    const question = findQuestion(room);
    const participant = room.participants.get(socket.id);

    if (!participant) {
      socket.emit(socketEvents.error, 'Участник не найден в комнате.');
      return;
    }

    if (!question || question.id !== questionId || !room.startedAt || !room.endsAt || Date.now() > room.endsAt) {
      socket.emit(socketEvents.error, 'Время ответа истекло.');
      return;
    }

    const alreadyAnswered = room.answers.some(
      (answer) => answer.participantId === participant.id && answer.questionId === question.id
    );

    if (alreadyAnswered) {
      socket.emit(socketEvents.error, 'Ответ уже был отправлен.');
      return;
    }

    const scoreBreakdown = calculateScoreBreakdown({
      question,
      selectedOptionIds,
      answeredAt: Date.now(),
      startedAt: room.startedAt,
      endsAt: room.endsAt
    });
    const scoreAwarded = scoreBreakdown.score;
    const result = scoreBreakdown.isFullyCorrect ? 'correct' : scoreAwarded > 0 ? 'partial' : 'wrong';

    participant.score += scoreAwarded;
    participant.answeredCount += 1;

    room.answers.push({
      participantId: participant.id,
      questionId: question.id,
      selectedOptionIds,
      scoreAwarded,
      answeredAt: Date.now()
    });

    socket.emit(socketEvents.answerAccepted, {
      scoreAwarded,
      totalScore: participant.score,
      result
    });

    emitState(room);
  });

  socket.on('disconnect', () => {
    for (const room of rooms.values()) {
      if (room.participants.delete(socket.id)) {
        emitState(room);
      }
    }
  });
});

await app.listen({ port, host: '0.0.0.0' });
