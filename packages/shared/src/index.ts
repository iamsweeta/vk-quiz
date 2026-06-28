import { z } from 'zod';

export const DEMO_ROOM_CODE = 'QZ-4821';
export const PRIVATE_DEMO_ACCESS_CODE = 'AI-PRIVATE-777';
export const PRIVATE_DEMO_ROOM_CODE = 'AI-777';

export const socketEvents = {
  roomJoin: 'room:join',
  roomJoined: 'room:joined',
  participantJoined: 'room:participantJoined',
  roomState: 'room:state',
  hostStartQuiz: 'host:startQuiz',
  hostShowQuestion: 'host:showQuestion',
  hostNextQuestion: 'host:nextQuestion',
  hostFinishQuiz: 'host:finishQuiz',
  quizStarted: 'quiz:started',
  questionStarted: 'quiz:questionStarted',
  questionEnded: 'quiz:questionEnded',
  submitAnswer: 'participant:submitAnswer',
  answerAccepted: 'participant:answerAccepted',
  leaderboardUpdated: 'room:leaderboardUpdated',
  quizFinished: 'quiz:finished',
  error: 'app:error'
} as const;

export type SocketEventName = (typeof socketEvents)[keyof typeof socketEvents];

export type QuestionType = 'TEXT' | 'IMAGE';
export type AnswerMode = 'SINGLE' | 'MULTIPLE';
export type RoomStatus = 'WAITING' | 'ACTIVE' | 'FINISHED';
export type QuizVisibility = 'PUBLIC' | 'PRIVATE';
export type ClientRole = 'HOST' | 'PARTICIPANT';

export type QuizOption = {
  id: string;
  text: string;
  imageUrl?: string;
  isCorrect?: boolean;
};

export type QuizQuestion = {
  id: string;
  text: string;
  type: QuestionType;
  answerMode: AnswerMode;
  imageUrl?: string;
  timeLimit: number;
  points: number;
  options: QuizOption[];
};

export type PublicQuestion = Omit<QuizQuestion, 'options'> & {
  options: Array<Omit<QuizOption, 'isCorrect'>>;
  index: number;
  total: number;
  endsAt: number;
};

export type LeaderboardEntry = {
  participantId: string;
  nickname: string;
  score: number;
  answeredCount: number;
};

export type RoomParticipant = {
  id: string;
  nickname: string;
  score: number;
  answeredCount: number;
};

export type RoomSnapshot = {
  code: string;
  status: RoomStatus;
  currentQuestion?: PublicQuestion;
  participants: RoomParticipant[];
  leaderboard: LeaderboardEntry[];
};

export const joinRoomSchema = z.object({
  code: z.string().min(3).max(12),
  nickname: z.string().min(1).max(32),
  role: z.enum(['HOST', 'PARTICIPANT'])
});

export const submitAnswerSchema = z.object({
  code: z.string().min(3).max(12),
  questionId: z.string().min(1),
  selectedOptionIds: z.array(z.string()).min(1)
});

export function sanitizeQuestion(question: QuizQuestion, index: number, total: number, endsAt: number): PublicQuestion {
  return {
    id: question.id,
    text: question.text,
    type: question.type,
    answerMode: question.answerMode,
    imageUrl: question.imageUrl,
    timeLimit: question.timeLimit,
    points: question.points,
    index,
    total,
    endsAt,
    options: question.options.map(({ id, text, imageUrl }) => ({ id, text, imageUrl }))
  };
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids.filter(Boolean))];
}

export function isCorrectAnswer(question: QuizQuestion, selectedOptionIds: string[]): boolean {
  const selected = uniqueIds(selectedOptionIds).sort();
  const correct = question.options
    .filter((option) => option.isCorrect)
    .map((option) => option.id)
    .sort();

  return selected.length === correct.length && selected.every((id, index) => id === correct[index]);
}

export type ScoreBreakdown = {
  score: number;
  isFullyCorrect: boolean;
  selectedCorrectCount: number;
  correctTotal: number;
  selectedWrongCount: number;
  penalty: number;
  explanation: string;
};

export function calculateScoreBreakdown(params: {
  question: QuizQuestion;
  selectedOptionIds: string[];
  answeredAt: number;
  startedAt: number;
  endsAt: number;
}): ScoreBreakdown {
  const selected = uniqueIds(params.selectedOptionIds);
  const correctIds = params.question.options.filter((option) => option.isCorrect).map((option) => option.id);
  const wrongIds = params.question.options.filter((option) => !option.isCorrect).map((option) => option.id);
  const selectedCorrectCount = selected.filter((id) => correctIds.includes(id)).length;
  const selectedWrongCount = selected.filter((id) => wrongIds.includes(id)).length;
  const correctTotal = correctIds.length;
  const isFullyCorrect = isCorrectAnswer(params.question, selected);

  if (params.answeredAt > params.endsAt) {
    return {
      score: 0,
      isFullyCorrect: false,
      selectedCorrectCount,
      correctTotal,
      selectedWrongCount,
      penalty: 0,
      explanation: 'Время ответа истекло.'
    };
  }

  if (params.question.answerMode === 'SINGLE') {
    return {
      score: isFullyCorrect ? params.question.points : 0,
      isFullyCorrect,
      selectedCorrectCount,
      correctTotal,
      selectedWrongCount,
      penalty: selectedWrongCount > 0 ? params.question.points : 0,
      explanation: isFullyCorrect ? 'Одиночный выбор: полный балл за правильный вариант.' : 'Одиночный выбор: неправильный вариант даёт 0 баллов.'
    };
  }

  // Multiple choice scoring:
  // each correct selected option gives an equal share of the question points;
  // each wrong selected option subtracts one such share. The result never goes below 0.
  // Full points are awarded only when all correct options are selected and no wrong options are selected.
  if (correctTotal === 0) {
    return {
      score: 0,
      isFullyCorrect: false,
      selectedCorrectCount,
      correctTotal,
      selectedWrongCount,
      penalty: 0,
      explanation: 'Для вопроса не задан правильный ответ.'
    };
  }

  const share = params.question.points / correctTotal;
  const earnedRaw = selectedCorrectCount * share;
  const penaltyRaw = selectedWrongCount * share;
  const score = Math.max(0, Math.round(earnedRaw - penaltyRaw));

  return {
    score,
    isFullyCorrect,
    selectedCorrectCount,
    correctTotal,
    selectedWrongCount,
    penalty: Math.round(penaltyRaw),
    explanation: isFullyCorrect
      ? 'Множественный выбор: выбран весь правильный набор без лишних вариантов.'
      : 'Множественный выбор: частичный балл за правильные варианты, штраф за лишние варианты.'
  };
}

export function calculateScore(params: {
  question: QuizQuestion;
  selectedOptionIds: string[];
  answeredAt: number;
  startedAt: number;
  endsAt: number;
}): number {
  return calculateScoreBreakdown(params).score;
}

export const demoQuiz = {
  id: 'demo-quiz',
  title: 'Демо-квиз: Космос и технологии',
  description: 'Короткий live-квиз для проверки realtime-логики.',
  questions: [
    {
      id: 'q1',
      text: 'Какая планета самая большая в Солнечной системе?',
      type: 'IMAGE' as QuestionType,
      imageUrl: '/covers/space-tech.svg',
      answerMode: 'SINGLE' as AnswerMode,
      timeLimit: 25,
      points: 1000,
      options: [
        { id: 'mars', text: 'Марс' },
        { id: 'jupiter', text: 'Юпитер', isCorrect: true },
        { id: 'venus', text: 'Венера' },
        { id: 'saturn', text: 'Сатурн' }
      ]
    },
    {
      id: 'q2',
      text: 'Какие технологии обычно используются для realtime-веб-приложений?',
      type: 'TEXT' as QuestionType,
      answerMode: 'MULTIPLE' as AnswerMode,
      timeLimit: 30,
      points: 1200,
      options: [
        { id: 'websocket', text: 'WebSocket', isCorrect: true },
        { id: 'socketio', text: 'Socket.IO', isCorrect: true },
        { id: 'html-only', text: 'Только HTML без сервера' },
        { id: 'polling', text: 'Long polling', isCorrect: true }
      ]
    },
    {
      id: 'q3',
      text: 'Что отвечает за миграции и типобезопасную работу с БД в этом проекте?',
      type: 'TEXT' as QuestionType,
      answerMode: 'SINGLE' as AnswerMode,
      timeLimit: 20,
      points: 1000,
      options: [
        { id: 'tailwind', text: 'Tailwind CSS' },
        { id: 'prisma', text: 'Prisma ORM', isCorrect: true },
        { id: 'lucide', text: 'Lucide Icons' },
        { id: 'figma', text: 'Figma' }
      ]
    }
  ] satisfies QuizQuestion[]
};

export const historyLiveQuiz = {
  id: 'history-web-quiz',
  title: 'История веб-разработки',
  description: 'Публичный live-квиз про HTML, CSS, JavaScript и frontend-инструменты.',
  questions: [
    {
      id: 'history-q1',
      text: 'Что появилось раньше?',
      type: 'TEXT' as QuestionType,
      answerMode: 'SINGLE' as AnswerMode,
      timeLimit: 25,
      points: 900,
      options: [
        { id: 'react', text: 'React' },
        { id: 'html', text: 'HTML', isCorrect: true },
        { id: 'nextjs', text: 'Next.js' },
        { id: 'tailwind', text: 'Tailwind CSS' }
      ]
    },
    {
      id: 'history-q2',
      text: 'Какие технологии относятся к frontend-разработке?',
      type: 'TEXT' as QuestionType,
      answerMode: 'MULTIPLE' as AnswerMode,
      timeLimit: 30,
      points: 1000,
      options: [
        { id: 'html', text: 'HTML', isCorrect: true },
        { id: 'css', text: 'CSS', isCorrect: true },
        { id: 'js', text: 'JavaScript', isCorrect: true },
        { id: 'postgres', text: 'PostgreSQL' }
      ]
    }
  ] satisfies QuizQuestion[]
};

export const privateAiLiveQuiz = {
  id: 'private-ai-quiz',
  title: 'Закрытый AI Challenge',
  description: 'Приватный live-квиз, доступный только по коду.',
  questions: [
    {
      id: 'ai-q1',
      text: 'Что лучше всего описывает LLM?',
      type: 'TEXT' as QuestionType,
      answerMode: 'SINGLE' as AnswerMode,
      timeLimit: 30,
      points: 1000,
      options: [
        { id: 'db', text: 'База данных' },
        { id: 'llm', text: 'Большая языковая модель', isCorrect: true },
        { id: 'css', text: 'CSS-фреймворк' },
        { id: 'browser', text: 'Тип браузера' }
      ]
    },
    {
      id: 'ai-q2',
      text: 'Что важно учитывать при проектировании AI-продукта?',
      type: 'TEXT' as QuestionType,
      answerMode: 'MULTIPLE' as AnswerMode,
      timeLimit: 35,
      points: 1200,
      options: [
        { id: 'privacy', text: 'Приватность данных', isCorrect: true },
        { id: 'ux', text: 'UX', isCorrect: true },
        { id: 'evals', text: 'Проверка качества ответов', isCorrect: true },
        { id: 'ignore-errors', text: 'Игнорирование ошибок' }
      ]
    }
  ] satisfies QuizQuestion[]
};

export function getLiveQuizForRoomCode(code?: string) {
  const normalizedCode = (code || DEMO_ROOM_CODE).trim().toUpperCase();
  if (normalizedCode === 'HIST-2026') return historyLiveQuiz;
  if (normalizedCode === PRIVATE_DEMO_ROOM_CODE) return privateAiLiveQuiz;
  return demoQuiz;
}
