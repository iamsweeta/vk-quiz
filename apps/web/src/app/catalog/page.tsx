import { ProductIcon } from '@/components/brand/ProductIcon';
import { AppShell } from '@/components/layout/AppShell';
import { QuizCatalogCard } from '@/components/catalog/QuizCatalogCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PrivateQuizAccessForm } from '@/features/catalog/PrivateQuizAccessForm';
import { getCurrentUser } from '@/lib/auth';
import { prisma, QuizStatus, QuizVisibility, RoomStatus } from '@quizpulse/db';
import { PRIVATE_DEMO_ACCESS_CODE } from '@quizpulse/shared';

export default async function CatalogPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const params = await searchParams;
  const query = String(params.q || '').trim();
  const category = String(params.category || '').trim();
  const user = await getCurrentUser();

  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true }
  });

  const quizzes = await prisma.quiz.findMany({
    where: {
      status: QuizStatus.PUBLISHED,
      visibility: QuizVisibility.PUBLIC,
      ...(query
        ? {
            OR: [
              { title: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } }
            ]
          }
        : {}),
      ...(category && category !== 'ALL'
        ? { category: { name: category } }
        : {})
    },
    include: {
      category: true,
      owner: { select: { id: true, name: true } },
      rooms: {
        where: { status: { in: [RoomStatus.WAITING, RoomStatus.ACTIVE] } },
        orderBy: { createdAt: 'desc' },
        take: 1
      },
      questions: {
        select: { timeLimit: true }
      },
      _count: {
        select: { questions: true, rooms: true }
      }
    },
    orderBy: [
      { ratingAverage: 'desc' },
      { playCount: 'desc' },
      { ratingCount: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  return (
    <AppShell>
      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-end">
          <div>
            <Badge>Каталог • Публичные квизы • Поиск</Badge>
            <h1 className="mt-5 text-5xl font-black tracking-tight md:text-7xl">
              Каталог квизов
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[color:var(--muted)]">
              Выбирайте публичные квизы, фильтруйте по категории, ищите по названию и проходите самостоятельно или в live-комнате.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {user?.role === 'ORGANIZER' || user?.role === 'ADMIN' ? (
                <Button href="/dashboard/organizer">Перейти к проведению</Button>
              ) : (
                <>
                  <Button href="/join">Войти по коду комнаты</Button>
                  <Button href="/dashboard/participant" variant="ghost">Кабинет участника</Button>
                </>
              )}
            </div>
          </div>
          <PrivateQuizAccessForm defaultCode={PRIVATE_DEMO_ACCESS_CODE} />
        </div>

        <form className="mt-10 grid gap-3 rounded-[2rem] border border-[color:var(--border)] bg-[color:var(--glass)] p-4 shadow-soft md:grid-cols-[1fr_260px_auto]" action="/catalog">
          <label className="grid gap-2 text-sm font-bold">
            Поиск по названию
            <input
              name="q"
              defaultValue={query}
              placeholder="Например: космос, история, AI"
              className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--input)] px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-cyan focus:ring-4 focus:ring-cyan/10"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            Категория
            <select
              name="category"
              defaultValue={category || 'ALL'}
              className="w-full rounded-2xl border border-[color:var(--border)] bg-[color:var(--input)] px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-cyan focus:ring-4 focus:ring-cyan/10"
            >
              <option value="ALL">Все категории</option>
              {categories.map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button className="h-[50px] w-full md:w-auto" type="submit">Найти</Button>
            {(query || category) && <Button className="h-[50px]" href="/catalog" variant="ghost">Сбросить</Button>}
          </div>
        </form>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Card>
            <ProductIcon name="catalog" className="mb-4 h-8 w-8 text-cyan" />
            <h2 className="text-2xl font-black">Поиск</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Название и описание учитываются при поиске.</p>
          </Card>
          <Card>
            <ProductIcon name="auth" className="mb-4 h-8 w-8 text-cyan" />
            <h2 className="text-2xl font-black">Категории</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">15 основных направлений и вариант «Другое» для любых тем.</p>
          </Card>
          <Card>
            <ProductIcon name="room" className="mb-4 h-8 w-8 text-cyan" />
            <h2 className="text-2xl font-black">Рейтинг</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">Сначала показываются квизы с высокой оценкой и большим числом прохождений.</p>
          </Card>
        </div>

        <div className="mt-10 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-cyan">Публичные квизы</p>
            <h2 className="mt-2 text-4xl font-black">Выберите квиз</h2>
          </div>
          <div className="rounded-full border border-[color:var(--border)] bg-[color:var(--glass)] px-4 py-2 text-sm font-black text-[color:var(--muted)]">
            {quizzes.length} найдено
          </div>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          {quizzes.map((quiz) => (
            <QuizCatalogCard
              key={quiz.id}
              quiz={{
                id: quiz.id,
                title: quiz.title,
                description: quiz.description,
                coverImageUrl: quiz.coverImageUrl,
                visibility: quiz.visibility,
                accessCode: quiz.accessCode,
                category: quiz.category,
                owner: quiz.owner,
                roomCode: quiz.rooms[0]?.code,
                questionsCount: quiz._count.questions,
                roomsCount: quiz._count.rooms,
                playCount: quiz.playCount,
                ratingAverage: quiz.ratingAverage,
                ratingCount: quiz.ratingCount,
                totalTimeSeconds: quiz.questions.reduce((sum, question) => sum + question.timeLimit, 0)
              }}
              viewerRole={user?.role ?? null}
            />
          ))}
        </div>

        {quizzes.length === 0 && (
          <Card className="mt-7 text-center">
            <h2 className="text-2xl font-black">Ничего не найдено</h2>
            <p className="mt-2 text-[color:var(--muted)]">Попробуйте изменить запрос или выбрать другую категорию.</p>
            <Button href="/catalog" className="mt-5">Показать все квизы</Button>
          </Card>
        )}
      </section>
    </AppShell>
  );
}
