import { Badge } from './Badge';
import type { ApplicationStatus, FieldStatus } from '../../types';

const appStatusConfig: Record<ApplicationStatus, { label: string; variant: Parameters<typeof Badge>[0]['variant'] }> = {
  filled:    { label: 'Filled',     variant: 'info' },
  submitted: { label: 'Submitted',  variant: 'violet' },
  reviewing: { label: 'Reviewing',  variant: 'warning' },
  interview: { label: 'Interview',  variant: 'success' },
  rejected:  { label: 'Rejected',   variant: 'danger' },
  offer:     { label: 'Offer 🎉',   variant: 'success' },
};

const fieldStatusConfig: Record<FieldStatus, { label: string; variant: Parameters<typeof Badge>[0]['variant'] }> = {
  ready:        { label: 'Ready',        variant: 'success' },
  needs_review: { label: 'Review',       variant: 'warning' },
  empty:        { label: 'Empty',        variant: 'danger' },
  filled:       { label: 'Filled',       variant: 'violet' },
};

export function AppStatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = appStatusConfig[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function FieldStatusBadge({ status }: { status: FieldStatus }) {
  const cfg = fieldStatusConfig[status];
  return <Badge variant={cfg.variant} size="sm">{cfg.label}</Badge>;
}
