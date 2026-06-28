import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { NewQuizBuilder } from '@/features/quiz-builder/NewQuizBuilder';
import { requireRole, UserRole } from '@/lib/auth';

export default async function NewQuizPage() {
  await requireRole(UserRole.ORGANIZER);

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-wide text-cyan">Конструктор</p>
            <h1 className="mt-2 text-5xl font-black">Создание квиза</h1>
            <p className="mt-3 text-[color:var(--muted)]">
              Создайте квиз, настройте доступ, обложку, вопросы, правильные ответы, время и баллы. Для запуска текущего квиза используйте кнопку «Сохранить и запустить live» внизу формы.
            </p>
          </div>
          <Button href="/dashboard/organizer/quizzes" variant="ghost">Мои квизы</Button>
        </div>

        <NewQuizBuilder />
      </section>
    </AppShell>
  );
}
