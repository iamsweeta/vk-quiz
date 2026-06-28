'use client';

import Link from 'next/link';
import { ArrowLeft, Home, LayoutGrid, LogIn, LogOut, KeyRound, Repeat2, UserRound } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { UserMascot } from '@/components/mascot/UserMascot';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { SoundToggle } from '@/components/sound/SoundToggle';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { cn } from '@/lib/cn';

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'PARTICIPANT' | 'ORGANIZER' | 'ADMIN';
  mascotType?: string;
  mascotColor?: string;
};

type NavItem = readonly [string, string, typeof Home];

function roleLabel(role: AuthUser['role']) {
  if (role === 'ORGANIZER') return 'Организатор';
  if (role === 'ADMIN') return 'Админ';
  return 'Участник';
}

function dashboardForRole(role?: AuthUser['role']) {
  if (role === 'ORGANIZER' || role === 'ADMIN') return '/dashboard/organizer';
  return '/dashboard/participant';
}

function BackButton() {
  const pathname = usePathname();
  if (pathname === '/') return null;

  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--glass)] text-[color:var(--muted)] shadow-soft transition hover:bg-[color:var(--glass-hover)] hover:text-[color:var(--foreground)] sm:h-11 sm:w-11"
      aria-label="Назад"
      title="Назад"
    >
      <ArrowLeft size={17} />
    </button>
  );
}

function RoleSwitchButton({ user, onUserChange, iconOnly = false, className }: { user: AuthUser | null; onUserChange: (user: AuthUser | null) => void; iconOnly?: boolean; className?: string }) {
  if (!user) return null;

  const nextRoleLabel = user.role === 'ORGANIZER' ? 'Стать участником' : 'Стать организатором';
  const shortTitle = user.role === 'ORGANIZER' ? 'Перейти в роль участника' : 'Перейти в роль организатора';

  async function switchRole() {
    const response = await fetch('/api/auth/switch-role', { method: 'POST' });
    const data = await response.json().catch(() => null);
    if (!response.ok) return;
    onUserChange(data.user);
    window.location.assign(data.redirectTo || dashboardForRole(data.user?.role));
  }

  return (
    <button
      type="button"
      onClick={switchRole}
      className={cn(
        'inline-flex items-center justify-center rounded-xl text-sm font-black transition hover:bg-[color:var(--card-strong)] hover:text-[color:var(--foreground)]',
        iconOnly
          ? 'h-9 w-9 shrink-0 border border-[color:var(--border)] bg-[color:var(--glass)] text-[color:var(--muted)] shadow-soft sm:h-11 sm:w-11'
          : 'gap-2 px-3 py-2 text-[color:var(--muted)]',
        className
      )}
      title={shortTitle}
      aria-label={shortTitle}
    >
      <Repeat2 size={iconOnly ? 16 : 16} />
      {!iconOnly && nextRoleLabel}
    </button>
  );
}

function AuthStatus({ user, loading }: { user: AuthUser | null; loading: boolean; onUserChange: (user: AuthUser | null) => void }) {
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.assign('/');
  }

  if (loading) {
    return <div className="hidden h-11 w-28 animate-pulse rounded-2xl bg-[color:var(--glass)] sm:block" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button href="/login" variant="ghost" className="hidden px-4 sm:inline-flex">Войти</Button>
        <Button href="/register" className="hidden px-5 sm:inline-flex">Регистрация</Button>
        <Button href="/login" className="h-9 w-9 px-0 sm:hidden" aria-label="Войти">
          <LogIn size={18} />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Link
        href={dashboardForRole(user.role)}
        className="hidden items-center gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--glass)] px-3 py-2 text-sm font-bold text-[color:var(--foreground)] transition hover:bg-[color:var(--glass-hover)] md:flex"
      >
        <UserMascot type={user.mascotType} color={user.mascotColor} size="sm" />
        <span className="max-w-36 truncate">{user.name}</span>
        <span className="rounded-full bg-[color:var(--card-strong)] px-2 py-1 text-[10px] uppercase tracking-wide text-[color:var(--muted)]">
          {roleLabel(user.role)}
        </span>
      </Link>

      <button
        type="button"
        onClick={logout}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--glass)] text-[color:var(--muted)] transition hover:bg-[color:var(--danger-soft)] hover:text-[color:var(--danger)] sm:h-11 sm:w-11"
        aria-label="Выйти"
        title="Выйти"
      >
        <LogOut size={17} />
      </button>
    </div>
  );
}

function PinkHeartField() {
  return (
    <div className="pink-heart-field" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, index) => (
        <span key={index} className="pink-heart" />
      ))}
    </div>
  );
}

function BottomMobileNav({ links, pathname, user, onUserChange }: { links: NavItem[]; pathname: string; user: AuthUser | null; onUserChange: (user: AuthUser | null) => void }) {
  return (
    <nav className="mobile-tabbar lg:hidden" aria-label="Основная навигация">
      {links.map(([href, label, Icon]) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
        return (
          <Link key={href} href={href} className={cn('mobile-tabbar__item', active && 'mobile-tabbar__item--active')}>
            <Icon size={18} />
            <span>{label}</span>
          </Link>
        );
      })}
      {user ? (
        <button type="button" className="mobile-tabbar__item" onClick={async () => {
          const response = await fetch('/api/auth/switch-role', { method: 'POST' });
          const data = await response.json().catch(() => null);
          if (!response.ok) return;
          onUserChange(data.user);
          window.location.assign(data.redirectTo || dashboardForRole(data.user?.role));
        }} aria-label="Сменить роль" title="Сменить роль">
          <Repeat2 size={18} />
          <span>Роль</span>
        </button>
      ) : null}
    </nav>
  );
}

export function AppShell({ children, className }: { children: ReactNode; className?: string }) {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => setUser(data.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const links = useMemo<NavItem[]>(() => {
    const base: NavItem[] = [
      ['/', 'Главная', Home],
      ['/catalog', 'Каталог', LayoutGrid]
    ];

    if (user?.role === 'ORGANIZER' || user?.role === 'ADMIN') {
      base.push(['/dashboard/organizer', 'Кабинет', UserRound]);
    } else if (user?.role === 'PARTICIPANT') {
      base.push(['/join', 'По коду', KeyRound]);
      base.push(['/dashboard/participant', 'Кабинет', UserRound]);
    } else {
      base.push(['/join', 'По коду', KeyRound]);
      base.push(['/login', 'Вход', LogIn]);
    }

    return base;
  }, [user?.role]);

  return (
    <main className={cn('relative min-h-screen overflow-hidden pb-24 lg:pb-0 grid-bg', className)}>
      <PinkHeartField />
      <div className="orb left-[-12rem] top-[-10rem] bg-cyan/30" />
      <div className="orb right-[-10rem] top-24 bg-primary/25" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(to_bottom,var(--top-glow),transparent)]" />

      <header className="sticky top-0 z-30 border-b border-[color:var(--border)] bg-[color:var(--header)] backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-5 sm:py-4">
          <div className="flex min-w-0 shrink items-center gap-2">
            <BackButton />
            <div className="min-[390px]:hidden"><BrandLogo compact /></div>
            <div className="hidden min-[390px]:block"><BrandLogo /></div>
          </div>

          <nav className="hidden items-center gap-1 rounded-2xl border border-[color:var(--border)] bg-[color:var(--glass)] p-1 lg:flex">
            {links.filter(([href]) => href !== '/login').map(([href, label]) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  'rounded-xl px-3 py-2 text-sm font-bold text-[color:var(--muted)] transition hover:text-[color:var(--foreground)]',
                  (pathname === href || (href !== '/' && pathname.startsWith(href))) && 'bg-[color:var(--card-strong)] text-[color:var(--foreground)] shadow-soft'
                )}
              >
                {label === 'По коду' ? 'Войти по коду' : label}
              </Link>
            ))}
            <RoleSwitchButton user={user} onUserChange={setUser} iconOnly className="ml-3" />
          </nav>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <ThemeToggle compact />
            <SoundToggle compact />
            <AuthStatus user={user} loading={loading} onUserChange={setUser} />
          </div>
        </div>
      </header>

      <div className="relative z-10">{children}</div>
      <BottomMobileNav links={links} pathname={pathname} user={user} onUserChange={setUser} />
    </main>
  );
}
