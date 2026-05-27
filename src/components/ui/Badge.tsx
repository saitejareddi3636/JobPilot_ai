import { clsx } from 'clsx';

type BadgeVariant =
  | 'default'
  | 'violet'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default:  'bg-slate-100 text-slate-600',
  violet:   'bg-violet-100 text-violet-700',
  success:  'bg-emerald-100 text-emerald-700',
  warning:  'bg-amber-100 text-amber-700',
  danger:   'bg-red-100 text-red-600',
  info:     'bg-sky-100 text-sky-700',
  outline:  'bg-white text-slate-600 border border-slate-200',
};

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-medium rounded-full',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
