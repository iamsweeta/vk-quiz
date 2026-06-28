import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { RegisterForm } from '@/components/forms/RegisterForm';

export default function RegisterPage() {
  return (
    <AppShell>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-12 lg:grid-cols-[1fr_1fr] lg:py-20">
        <Card className="order-2 lg:order-1">
          <h2 className="text-3xl font-black">Создать аккаунт</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Выбери роль: организатор создаёт квизы, участник проходит игры и смотрит историю.</p>
          <RegisterForm />
        </Card>

        <div className="order-1 lg:order-2">
          <Badge>Organizer / Participant</Badge>
          <h1 className="mt-5 text-5xl font-black leading-tight md:text-7xl">
            Регистрация с выбором <span className="text-gradient">роли</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[color:var(--muted)]">
            После регистрации пользователь автоматически попадает в правильный личный кабинет: организатора или участника.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
