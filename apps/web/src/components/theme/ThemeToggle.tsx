'use client';

import { Heart, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

type ThemeName = 'light' | 'dark' | 'pink';

const themes: Array<{
  value: ThemeName;
  label: string;
  icon: typeof Sun;
}> = [
  { value: 'light', label: 'Светлая тема', icon: Sun },
  { value: 'dark', label: 'Тёмная тема', icon: Moon },
  { value: 'pink', label: 'Розовая тема', icon: Heart }
];

function normalizeTheme(value: string | null): ThemeName {
  if (value === 'light' || value === 'dark' || value === 'pink') return value;
  return 'dark';
}

function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark', 'pink');
  root.classList.add(theme);
  root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<ThemeName>('dark');

  useEffect(() => {
    const savedTheme = normalizeTheme(localStorage.getItem('quizpulse-theme'));
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  function selectTheme(nextTheme: ThemeName) {
    setTheme(nextTheme);
    localStorage.setItem('quizpulse-theme', nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <div
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-2xl border border-[color:var(--border)] bg-[color:var(--glass)] p-1 shadow-soft backdrop-blur-xl',
        compact ? 'h-9 sm:h-11' : 'h-12'
      )}
      aria-label="Выбор темы"
    >
      {themes.map((item) => {
        const Icon = item.icon;
        const active = theme === item.value;
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => selectTheme(item.value)}
            className={cn(
              'grid place-items-center rounded-xl transition duration-200',
              compact ? 'h-7 w-7 sm:h-9 sm:w-9' : 'h-10 w-10',
              active
                ? 'bg-[color:var(--card-strong)] text-[color:var(--foreground)] shadow-soft scale-105'
                : 'text-[color:var(--muted)] hover:bg-[color:var(--glass-hover)] hover:text-[color:var(--foreground)]'
            )}
            aria-pressed={active}
            aria-label={item.label}
            title={item.label}
          >
            <Icon size={compact ? 14 : 18} />
          </button>
        );
      })}
      {!compact && <span className="sr-only">Переключить тему</span>}
    </div>
  );
}
