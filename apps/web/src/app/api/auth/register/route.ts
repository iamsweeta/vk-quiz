import { NextResponse } from 'next/server';
import { prisma, UserRole } from '@quizpulse/db';
import { hashPassword } from '@/lib/auth';
import { createVerificationToken } from '@/lib/email/verification';
import { sendVerificationEmail } from '@/lib/email/email.service';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function randomMascot(email: string) {
  const variants = ['PULSE_BOT', 'STAR_FOX', 'NOVA_CAT', 'ORBIT_DRAGON'];
  const colors = ['cyan', 'violet', 'pink', 'emerald'];
  const sum = Array.from(email).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return { mascotType: variants[sum % variants.length], mascotColor: colors[sum % colors.length] };
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const name = String(body?.name || '').trim();
  const email = normalizeEmail(String(body?.email || ''));
  const password = String(body?.password || '');

  if (name.length < 2) return NextResponse.json({ message: 'Введите имя минимум из 2 символов.' }, { status: 400 });
  if (!email.includes('@') || email.length < 5) return NextResponse.json({ message: 'Введите корректный email.' }, { status: 400 });
  if (password.length < 6) return NextResponse.json({ message: 'Пароль должен быть минимум 6 символов.' }, { status: 400 });

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return NextResponse.json({ message: 'Пользователь с таким email уже существует.' }, { status: 409 });

  const user = await prisma.user.create({
    data: {
      name,
      email,
      role: UserRole.PARTICIPANT,
      passwordHash: hashPassword(password),
      ...randomMascot(email)
    },
    select: { id: true, name: true, email: true, role: true, emailVerifiedAt: true, mascotType: true, mascotColor: true }
  });

  const token = await createVerificationToken(email);

  try {
    await sendVerificationEmail({ to: email, name, token });
  } catch (error) {
    console.error('Failed to send verification email', error);
    return NextResponse.json({
      message: 'Аккаунт создан, но письмо подтверждения не отправилось. Проверьте настройки EMAIL_PROVIDER/SMTP.'
    }, { status: 502 });
  }

  return NextResponse.json({ user, verificationRequired: true });
}
