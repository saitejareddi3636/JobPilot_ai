import { clsx } from 'clsx';

interface ConfidencePillProps {
  score: number; // 0–100
}

export function ConfidencePill({ score }: ConfidencePillProps) {
  const color = clsx(
    'text-xs font-semibold px-1.5 py-0.5 rounded-md',
    score >= 90 && 'bg-emerald-50 text-emerald-700',
    score >= 70 && score < 90 && 'bg-amber-50 text-amber-700',
    score < 70  && 'bg-red-50 text-red-600',
  );
  return (
    <span className={color} title={`AI confidence: ${score}%`}>
      {score}%
    </span>
  );
}
