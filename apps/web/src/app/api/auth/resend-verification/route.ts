import { NextResponse } from 'next/server';
import { prisma } from '@quizpulse/db';
import { createVerificationToken } from '@/lib/email/verification';
import { sendVerificationEmail } from '@/lib/email/email.service';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(String(body?.email || ''));
  if (!email) return NextResponse.json({ message: 'Введите email.' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ message: 'Если аккаунт существует, письмо будет отправлено.' });
  if (user.emailVerifiedAt) return NextResponse.json({ message: 'Email уже подтверждён.' });

  const token = await createVerificationToken(email);
  await sendVerificationEmail({ to: user.email, name: user.name, token });
  return NextResponse.json({ message: 'Письмо подтверждения отправлено повторно.' });
}
