import { NextResponse } from 'next/server';
import { prisma, UserRole } from '@quizpulse/db';
import { setAuthCookie, verifyPassword } from '@/lib/auth';

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeLoginRole(value: unknown) {
  return value === UserRole.ORGANIZER ? UserRole.ORGANIZER : UserRole.PARTICIPANT;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = normalizeEmail(String(body?.email || ''));
  const password = String(body?.password || '');
  const loginRole = normalizeLoginRole(body?.role);

  if (!email || !password) return NextResponse.json({ message: 'Введите email и пароль.' }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) return NextResponse.json({ message: 'Неверный email или пароль.' }, { status: 401 });

  if (process.env.EMAIL_REQUIRE_VERIFICATION !== 'false' && !user.emailVerifiedAt) {
    return NextResponse.json({
      message: 'Сначала подтвердите email. Мы можем отправить письмо повторно.',
      verificationRequired: true,
      email: user.email
    }, { status: 403 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { role: loginRole },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      emailVerifiedAt: true,
      mascotType: true,
      mascotColor: true
    }
  });

  const response = NextResponse.json({ user: updatedUser });
  setAuthCookie(response, user.id);
  return response;
}
