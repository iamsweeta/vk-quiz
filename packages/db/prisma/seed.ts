import { PrismaClient, UserRole, QuizStatus, QuizVisibility, QuestionType, AnswerMode, RoomStatus } from '@prisma/client';
import { pbkdf2Sync, randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  return `pbkdf2$120000$${salt}$${derivedKey}`;
}

const demoPasswordHash = hashPassword('demo1234');

async function createCategory(name: string, icon: string) {
  return prisma.category.upsert({
    where: { name },
    update: { icon },
    create: { name, icon }
  });
}

async function main() {
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@quizpulse.local' },
    update: { passwordHash: demoPasswordHash, role: UserRole.ORGANIZER, emailVerifiedAt: new Date(), mascotType: 'PULSE_BOT', mascotColor: 'cyan' },
    create: {
      name: 'Demo Organizer',
      email: 'organizer@quizpulse.local',
      passwordHash: demoPasswordHash,
      role: UserRole.ORGANIZER,
      emailVerifiedAt: new Date(),
      mascotType: 'PULSE_BOT',
      mascotColor: 'cyan'
    }
  });

  const participant = await prisma.user.upsert({
    where: { email: 'participant@quizpulse.local' },
    update: { passwordHash: demoPasswordHash, role: UserRole.PARTICIPANT, emailVerifiedAt: new Date(), mascotType: 'STAR_FOX', mascotColor: 'violet' },
    create: {
      name: 'Demo Participant',
      email: 'participant@quizpulse.local',
      passwordHash: demoPasswordHash,
      role: UserRole.PARTICIPANT,
      emailVerifiedAt: new Date(),
      mascotType: 'STAR_FOX',
      mascotColor: 'violet'
    }
  });

  const categorySeeds = [
    ['Технологии', 'Zap'],
    ['Наука', 'Atom'],
    ['История', 'Landmark'],
    ['География', 'Globe2'],
    ['Космос', 'Rocket'],
    ['Искусство', 'Palette'],
    ['Кино и сериалы', 'Clapperboard'],
    ['Музыка', 'Music2'],
    ['Спорт', 'Trophy'],
    ['Литература', 'BookOpen'],
    ['Игры', 'Gamepad2'],
    ['Бизнес', 'BriefcaseBusiness'],
    ['Медицина', 'HeartPulse'],
    ['Образование', 'GraduationCap'],
    ['Еда и культура', 'Utensils'],
    ['Другое', 'Sparkles']
  ] as const;

  const categories = new Map<string, Awaited<ReturnType<typeof createCategory>>>();
  for (const [name, icon] of categorySeeds) {
    categories.set(name, await createCategory(name, icon));
  }

  const tech = categories.get('Технологии')!;
  const space = categories.get('Космос')!;
  const history = categories.get('История')!;
  const privateLab = categories.get('Другое')!;

  await prisma.room.deleteMany({
    where: {
      code: {
        in: ['QZ-4821', 'HIST-2026', 'AI-777']
      }
    }
  });

  await prisma.quiz.deleteMany({
    where: {
      title: {
        in: [
          'Демо-квиз: Космос и технологии',
          'История веб-разработки',
          'Frontend Battle',
          'Закрытый AI Challenge'
        ]
      }
    }
  });

  const demoQuiz = await prisma.quiz.create({
    data: {
      title: 'Демо-квиз: Космос и технологии',
      description: 'Публичный live-квиз для проверки каталога, комнаты и realtime-логики.',
      coverImageUrl: '/covers/space-tech.svg',
      defaultQuestionTime: 25,
      status: QuizStatus.PUBLISHED,
      visibility: QuizVisibility.PUBLIC,
      ownerId: organizer.id,
      categoryId: space.id,
      playCount: 128,
      ratingCount: 34,
      ratingSum: 158,
      ratingAverage: 4.6,
      questions: {
        create: [
          {
            text: 'Какая планета самая большая в Солнечной системе?',
            type: QuestionType.IMAGE,
            imageUrl: '/covers/space-tech.svg',
            answerMode: AnswerMode.SINGLE,
            timeLimit: 25,
            points: 1000,
            order: 1,
            options: {
              create: [
                { text: 'Марс', order: 1 },
                { text: 'Юпитер', isCorrect: true, order: 2 },
                { text: 'Венера', order: 3 },
                { text: 'Сатурн', order: 4 }
              ]
            }
          },
          {
            text: 'Какие технологии обычно используются для realtime-веб-приложений?',
            type: QuestionType.TEXT,
            answerMode: AnswerMode.MULTIPLE,
            timeLimit: 30,
            points: 1200,
            order: 2,
            options: {
              create: [
                { text: 'WebSocket', isCorrect: true, order: 1 },
                { text: 'Socket.IO', isCorrect: true, order: 2 },
                { text: 'Только HTML без сервера', order: 3 },
                { text: 'Long polling', isCorrect: true, order: 4 }
              ]
            }
          },
          {
            text: 'Что отвечает за миграции и типобезопасную работу с БД в этом проекте?',
            type: QuestionType.TEXT,
            answerMode: AnswerMode.SINGLE,
            timeLimit: 20,
            points: 1000,
            order: 3,
            options: {
              create: [
                { text: 'Tailwind CSS', order: 1 },
                { text: 'Prisma ORM', isCorrect: true, order: 2 },
                { text: 'Lucide Icons', order: 3 },
                { text: 'Figma', order: 4 }
              ]
            }
          }
        ]
      }
    }
  });

  const historyQuiz = await prisma.quiz.create({
    data: {
      title: 'История веб-разработки',
      description: 'Публичный квиз про HTML, CSS, JavaScript и эволюцию frontend-инструментов.',
      coverImageUrl: '/covers/web-history.svg',
      defaultQuestionTime: 30,
      status: QuizStatus.PUBLISHED,
      visibility: QuizVisibility.PUBLIC,
      ownerId: organizer.id,
      categoryId: history.id,
      playCount: 76,
      ratingCount: 19,
      ratingSum: 82,
      ratingAverage: 4.3,
      questions: {
        create: [
          {
            text: 'Что появилось раньше?',
            type: QuestionType.TEXT,
            answerMode: AnswerMode.SINGLE,
            timeLimit: 25,
            points: 900,
            order: 1,
            options: {
              create: [
                { text: 'React', order: 1 },
                { text: 'HTML', isCorrect: true, order: 2 },
                { text: 'Next.js', order: 3 },
                { text: 'Tailwind CSS', order: 4 }
              ]
            }
          },
          {
            text: 'Какие технологии относятся к frontend-разработке?',
            type: QuestionType.TEXT,
            answerMode: AnswerMode.MULTIPLE,
            timeLimit: 30,
            points: 1000,
            order: 2,
            options: {
              create: [
                { text: 'HTML', isCorrect: true, order: 1 },
                { text: 'CSS', isCorrect: true, order: 2 },
                { text: 'JavaScript', isCorrect: true, order: 3 },
                { text: 'PostgreSQL', order: 4 }
              ]
            }
          }
        ]
      }
    }
  });

  await prisma.quiz.create({
    data: {
      title: 'Frontend Battle',
      description: 'Черновик будущего соревновательного квиза. Не отображается в публичном каталоге.',
      defaultQuestionTime: 20,
      status: QuizStatus.DRAFT,
      visibility: QuizVisibility.PRIVATE,
      accessCode: 'DRAFT-FRONTEND',
      ownerId: organizer.id,
      categoryId: tech.id,
      questions: {
        create: [
          {
            text: 'Какой hook используется для состояния в React?',
            type: QuestionType.TEXT,
            answerMode: AnswerMode.SINGLE,
            timeLimit: 20,
            points: 800,
            order: 1,
            options: {
              create: [
                { text: 'useState', isCorrect: true, order: 1 },
                { text: 'usePaint', order: 2 },
                { text: 'useStyle', order: 3 },
                { text: 'useDOM', order: 4 }
              ]
            }
          }
        ]
      }
    }
  });

  const privateQuiz = await prisma.quiz.create({
    data: {
      title: 'Закрытый AI Challenge',
      description: 'Приватный квиз: его нет в каталоге. Открывается только по коду доступа.',
      coverImageUrl: '/covers/ai-private.svg',
      defaultQuestionTime: 35,
      status: QuizStatus.PUBLISHED,
      visibility: QuizVisibility.PRIVATE,
      accessCode: 'AI-PRIVATE-777',
      ownerId: organizer.id,
      categoryId: privateLab.id,
      playCount: 21,
      ratingCount: 7,
      ratingSum: 33,
      ratingAverage: 4.7,
      questions: {
        create: [
          {
            text: 'Что лучше всего описывает LLM?',
            type: QuestionType.TEXT,
            answerMode: AnswerMode.SINGLE,
            timeLimit: 30,
            points: 1000,
            order: 1,
            options: {
              create: [
                { text: 'База данных', order: 1 },
                { text: 'Большая языковая модель', isCorrect: true, order: 2 },
                { text: 'CSS-фреймворк', order: 3 },
                { text: 'Тип браузера', order: 4 }
              ]
            }
          },
          {
            text: 'Что важно учитывать при проектировании AI-продукта?',
            type: QuestionType.TEXT,
            answerMode: AnswerMode.MULTIPLE,
            timeLimit: 35,
            points: 1200,
            order: 2,
            options: {
              create: [
                { text: 'Приватность данных', isCorrect: true, order: 1 },
                { text: 'UX', isCorrect: true, order: 2 },
                { text: 'Проверка качества ответов', isCorrect: true, order: 3 },
                { text: 'Игнорирование ошибок', order: 4 }
              ]
            }
          }
        ]
      }
    }
  });

  await prisma.room.create({
    data: {
      code: 'QZ-4821',
      quizId: demoQuiz.id,
      hostId: organizer.id,
      status: RoomStatus.WAITING,
      participants: {
        create: [{ nickname: 'Demo Player', userId: participant.id, score: 0 }]
      }
    }
  });

  await prisma.room.create({
    data: {
      code: 'HIST-2026',
      quizId: historyQuiz.id,
      hostId: organizer.id,
      status: RoomStatus.WAITING
    }
  });

  await prisma.room.create({
    data: {
      code: 'AI-777',
      quizId: privateQuiz.id,
      hostId: organizer.id,
      status: RoomStatus.WAITING
    }
  });

  console.log('Seed completed. Public rooms: QZ-4821, HIST-2026. Private quiz access: AI-PRIVATE-777. Private room: AI-777.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
