'use client';

import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

export function PwaInstallButton() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setInstalled(true);
      setInstallEvent(null);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) {
    return <span className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--glass)] px-5 py-3 text-sm font-black text-[color:var(--muted)]">Установлено</span>;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={async () => {
        if (!installEvent) {
          window.alert('Откройте меню браузера и выберите «Добавить на главный экран» или «Установить приложение».');
          return;
        }
        await installEvent.prompt();
        await installEvent.userChoice.catch(() => undefined);
        setInstallEvent(null);
      }}
    >
      <Smartphone size={18} /> Установить приложение
    </Button>
  );
}
