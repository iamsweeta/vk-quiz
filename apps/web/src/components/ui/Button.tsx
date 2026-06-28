import Link from 'next/link';
import { cn } from '@/lib/cn';
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'ghost' | 'danger' | 'success';

type BaseProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
};

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never };
type LinkButtonProps = BaseProps & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

const variants: Record<ButtonVariant, string> = {
  primary: 'qp-primary-button bg-[image:var(--button-gradient)] text-white shadow-glow hover:brightness-110 hover:text-white',
  ghost: 'border border-[color:var(--border)] bg-[color:var(--glass)] text-[color:var(--foreground)] hover:bg-[color:var(--glass-hover)]',
  danger: 'bg-danger text-white hover:bg-danger/90',
  success: 'bg-success text-white hover:bg-success/90'
};

const baseClass = 'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export function Button(props: ButtonProps | LinkButtonProps) {
  if ('href' in props && props.href) {
    const { href, children, variant = 'primary', className, ...rest } = props;
    return (
      <Link href={href} className={cn(baseClass, variants[variant], className)} {...rest}>
        {children}
      </Link>
    );
  }

  const { children, variant = 'primary', className, type = 'button', ...rest } = props as ButtonProps;
  return (
    <button type={type} className={cn(baseClass, variants[variant], className)} {...rest}>
      {children}
    </button>
  );
}
