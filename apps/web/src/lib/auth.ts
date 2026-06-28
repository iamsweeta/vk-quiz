import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { createHmac, randomBytes, timingSafeEqual, pbkdf2Sync } from 'node:crypto';
import { prisma, UserRole } from '@quizpulse/db';
import type { User } from '@quizpulse/db';

const COOKIE_NAME = 'quizpulse_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const HASH_ITERATIONS = 120_000;

type SafeUser = Pick<User, 'id' | 'name' | 'email' | 'role' | 'emailVerifiedAt' | 'mascotType' | 'mascotColor'>;

type SessionPayload = {
  userId: string;
  exp: number;
};

function getSecret() {
  return process.env.AUTH_SECRET || 'quizpulse-local-dev-secret-change-me';
}

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url');
}

function sign(value: string) {
  return createHmac('sha256', getSecret()).update(value).digest('base64url');
}

function createSessionToken(userId: string) {
  const payload: SessionPayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
  };
  const encodedPayload = base64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function verifySessionToken(token?: string): SessionPayload | null {
  if (!token || !token.includes('.')) return null;

  const [encodedPayload, signature] = token.split('.');
  const expectedSignature = sign(encodedPayload);

  const actual = Buffer.from(signature || '');
  const expected = Buffer.from(expectedSignature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.userId || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = pbkdf2Sync(password, salt, HASH_ITERATIONS, 32, 'sha256').toString('hex');
  return `pbkdf2$${HASH_ITERATIONS}$${salt}$${derivedKey}`;
}

export function verifyPassword(password: string, storedHash?: string | null) {
  if (!storedHash) return false;
  const [algorithm, iterationsRaw, salt, hash] = storedHash.split('$');
  if (algorithm !== 'pbkdf2' || !iterationsRaw || !salt || !hash) return false;

  const iterations = Number(iterationsRaw);
  const derivedKey = pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');

  const actual = Buffer.from(derivedKey, 'hex');
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function setAuthCookie(response: NextResponse, userId: string) {
  response.cookies.set(COOKIE_NAME, createSessionToken(userId), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/'
  });
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
    path: '/'
  });
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const cookieStore = await cookies();
  const session = verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true, emailVerifiedAt: true, mascotType: true, mascotColor: true }
  });

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireRole(role: UserRole) {
  const user = await requireUser();
  if (user.role === UserRole.ADMIN || user.role === role) return user;

  if (user.role === UserRole.ORGANIZER) redirect('/dashboard/organizer');
  redirect('/dashboard/participant');
}

export { UserRole };
