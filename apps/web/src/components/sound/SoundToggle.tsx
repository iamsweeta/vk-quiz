'use client';

import { Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

type SoundEvent = 'success' | 'correct' | 'partial' | 'wrong';

type ToneStep = {
  frequency: number;
  duration: number;
  volume: number;
  delay?: number;
  type?: OscillatorType;
};

declare global {
  interface Window {
    __vkQuizSoundUnlocked?: boolean;
  }
}

let sharedAudioContext: AudioContext | null = null;
let lastSoundAt = 0;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!sharedAudioContext) sharedAudioContext = new AudioContextClass();
  return sharedAudioContext;
}

async function ensureAudioContext() {
  const context = getAudioContext();
  if (!context) return null;
  if (context.state === 'suspended') {
    try {
      await context.resume();
    } catch {
      return null;
    }
  }
  window.__vkQuizSoundUnlocked = true;
  return context;
}

function soundPattern(type: SoundEvent): ToneStep[] {
  switch (type) {
    case 'correct':
      return [
        { frequency: 523.25, duration: 0.10, volume: 0.09, type: 'sine' },
        { frequency: 659.25, duration: 0.12, volume: 0.08, delay: 0.09, type: 'sine' },
        { frequency: 1046.5, duration: 0.18, volume: 0.07, delay: 0.20, type: 'triangle' }
      ];
    case 'partial':
      return [
        { frequency: 392, duration: 0.12, volume: 0.07, type: 'triangle' },
        { frequency: 587.33, duration: 0.15, volume: 0.065, delay: 0.13, type: 'sine' }
      ];
    case 'wrong':
      return [
        { frequency: 196, duration: 0.18, volume: 0.08, type: 'sawtooth' },
        { frequency: 146.83, duration: 0.26, volume: 0.07, delay: 0.16, type: 'triangle' }
      ];
    case 'success':
    default:
      return [
        { frequency: 740, duration: 0.08, volume: 0.055, type: 'sine' },
        { frequency: 980, duration: 0.11, volume: 0.05, delay: 0.09, type: 'sine' }
      ];
  }
}

function playPattern(context: AudioContext, type: SoundEvent) {
  const startBase = context.currentTime + 0.015;

  for (const step of soundPattern(type)) {
    const startAt = startBase + (step.delay ?? 0);
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = step.type ?? 'sine';
    oscillator.frequency.setValueAtTime(step.frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(step.volume, startAt + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + step.duration);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + step.duration + 0.06);
  }
}

async function playTone(type: SoundEvent) {
  try {
    const now = Date.now();
    if (now - lastSoundAt < 90) return;
    lastSoundAt = now;

    const context = await ensureAudioContext();
    if (!context) return;
    playPattern(context, type);
  } catch {
    // Sound is optional.
  }
}

function readSoundEvent(event: Event): SoundEvent | null {
  const detail = (event as CustomEvent<{ type?: SoundEvent | string }>).detail;
  const type = detail?.type;
  return type === 'correct' || type === 'partial' || type === 'wrong' || type === 'success' ? type : null;
}

export function SoundToggle({ compact = false }: { compact?: boolean }) {
  const [enabled, setEnabled] = useState(true);
  const enabledRef = useRef(true);

  useEffect(() => {
    const saved = localStorage.getItem('quizpulse-sound');
    const nextEnabled = saved !== 'off';
    setEnabled(nextEnabled);
    enabledRef.current = nextEnabled;
    document.documentElement.dataset.sound = nextEnabled ? 'on' : 'off';
  }, []);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    async function unlockOnGesture() {
      if (!enabledRef.current) return;
      await ensureAudioContext();
    }

    window.addEventListener('pointerdown', unlockOnGesture, { passive: true });
    window.addEventListener('keydown', unlockOnGesture);
    return () => {
      window.removeEventListener('pointerdown', unlockOnGesture);
      window.removeEventListener('keydown', unlockOnGesture);
    };
  }, []);

  useEffect(() => {
    function handleQuizSound(event: Event) {
      if (!enabledRef.current) return;
      const type = readSoundEvent(event);
      if (!type) return;
      void playTone(type);
    }

    window.addEventListener('quizpulse:sound', handleQuizSound);
    return () => window.removeEventListener('quizpulse:sound', handleQuizSound);
  }, []);

  async function toggleSound() {
    const next = !enabled;
    setEnabled(next);
    enabledRef.current = next;
    localStorage.setItem('quizpulse-sound', next ? 'on' : 'off');
    document.documentElement.dataset.sound = next ? 'on' : 'off';
    if (next) {
      await ensureAudioContext();
      void playTone('success');
    }
  }

  const Icon = enabled ? Volume2 : VolumeX;

  return (
    <button
      type="button"
      onClick={toggleSound}
      className={cn(
        'grid shrink-0 place-items-center rounded-2xl border border-[color:var(--border)] bg-[color:var(--glass)] text-[color:var(--muted)] shadow-soft transition hover:bg-[color:var(--glass-hover)] hover:text-[color:var(--foreground)]',
        compact ? 'h-9 w-9 sm:h-11 sm:w-11' : 'h-12 w-12'
      )}
      aria-pressed={enabled}
      aria-label={enabled ? 'Отключить звуки ответов' : 'Включить звуки ответов'}
      title={enabled ? 'Звуки ответов включены' : 'Звуки ответов выключены'}
    >
      <Icon size={compact ? 16 : 19} />
    </button>
  );
}
