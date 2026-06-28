import { cn } from '@/lib/cn';

type MascotProps = {
  type?: string | null;
  color?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const colorClasses: Record<string, string> = {
  cyan: 'from-cyan to-primary shadow-cyan/30',
  violet: 'from-primary to-pink shadow-primary/30',
  pink: 'from-pink to-warning shadow-pink/30',
  emerald: 'from-success to-cyan shadow-success/30'
};

const faceForType: Record<string, string> = {
  PULSE_BOT: '◕‿◕',
  STAR_FOX: 'ᵔᴥᵔ',
  NOVA_CAT: '＾•ﻌ•＾',
  ORBIT_DRAGON: '✦ᴗ✦'
};

const sizes = {
  sm: 'h-9 w-9 text-[10px]',
  md: 'h-16 w-16 text-sm',
  lg: 'h-28 w-28 text-xl'
};

export function UserMascot({ type = 'PULSE_BOT', color = 'cyan', size = 'md', className }: MascotProps) {
  const palette = colorClasses[color || 'cyan'] || colorClasses.cyan;
  const face = faceForType[type || 'PULSE_BOT'] || faceForType.PULSE_BOT;

  return (
    <div className={cn('relative inline-grid place-items-center', className)} aria-label="User mascot">
      <div className={cn('absolute inset-0 rounded-full bg-gradient-to-br blur-xl opacity-50', palette)} />
      <div className={cn('relative grid place-items-center rounded-[38%] bg-gradient-to-br font-black text-white shadow-2xl ring-1 ring-white/25 transition hover:-translate-y-1 hover:rotate-3', sizes[size], palette)}>
        <div className="absolute left-[18%] top-[18%] h-[18%] w-[18%] rounded-full bg-white/50 blur-[1px]" />
        <span className="drop-shadow-sm">{face}</span>
      </div>
      <div className="absolute -bottom-1 h-2 w-3/4 rounded-full bg-black/20 blur-sm" />
    </div>
  );
}
