import { MailCheck } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ResendVerificationForm } from '@/components/forms/ResendVerificationForm';

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const params = await searchParams;
  const email = params?.email || '';

  return (
    <AppShell>
      <section className="mx-auto grid min-h-[calc(100vh-90px)] max-w-3xl place-items-center px-5 py-12">
        <Card className="w-full text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-3xl bg-cyan/10 text-cyan">
            <MailCheck size={30} />
          </div>
          <p className="text-sm font-black uppercase tracking-wide text-cyan">Почта почти подтверждена</p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">Проверьте inbox</h1>
          <p className="mx-auto mt-4 max-w-xl text-[color:var(--muted)]">
            Мы отправили письмо со ссылкой подтверждения. В dev-режиме оно находится в Mailpit: <b className="text-[color:var(--foreground)]">http://localhost:8025</b>. В SMTP/Resend-режиме письмо придёт на настоящую почту.
          </p>
          <ResendVerificationForm defaultEmail={email} />
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button href="/login" variant="ghost">Перейти ко входу</Button>
            <Button href="/catalog">Открыть каталог</Button>
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
