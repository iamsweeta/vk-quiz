import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoginForm } from '@/components/forms/LoginForm';

export default function LoginPage() {
  return (
    <AppShell>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div>
          <Badge>Secure MVP Auth</Badge>
          <h1 className="mt-5 text-5xl font-black leading-tight md:text-7xl">
            Вход в <span className="text-gradient">VK Quiz</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-[color:var(--muted)]">
            Авторизация работает через безопасную HTTP-only cookie-сессию. Кабинеты организатора и участника теперь защищены.
          </p>
          <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {['Cookie session', 'Role guard', 'Prisma users'].map((item) => (
              <div key={item} className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--glass)] p-4 text-sm font-black">
                {item}
              </div>
            ))}
          </div>
        </div>

        <Card>
          <h2 className="text-3xl font-black">Войти</h2>
          <p className="mt-2 text-sm text-[color:var(--muted)]">Используй демо-аккаунт или свой аккаунт после регистрации.</p>
          <LoginForm />
        </Card>
      </section>
    </AppShell>
  );
}
