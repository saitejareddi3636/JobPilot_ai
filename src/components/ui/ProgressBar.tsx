import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  color?: 'violet' | 'emerald' | 'amber' | 'sky';
  height?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  showLabel?: boolean;
}

const colorMap = {
  violet:  'bg-violet-500',
  emerald: 'bg-emerald-500',
  amber:   'bg-amber-500',
  sky:     'bg-sky-500',
};

const heightMap = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({
  value,
  className,
  color = 'violet',
  height = 'md',
  animated = false,
  showLabel = false,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={clsx('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Progress</span>
          <span>{clamped}%</span>
        </div>
      )}
      <div className={clsx('w-full bg-slate-200 rounded-full overflow-hidden', heightMap[height])}>
        <div
          className={clsx(
            'rounded-full transition-all duration-500 ease-out',
            colorMap[color],
            heightMap[height],
            animated && 'animate-pulse',
          )}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
