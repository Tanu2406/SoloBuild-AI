import React from 'react';
import type { HiringStatus, CandidateStatus } from '../../types';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'primary';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', children, dot = false }) => {
  return (
    <span className={`badge badge--${variant}`}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
};

export const HiringStatusBadge: React.FC<{ status: HiringStatus }> = ({ status }) => {
  const map: Record<HiringStatus, { variant: BadgeVariant; label: string; dot: boolean }> = {
    calling:   { variant: 'success', label: 'Calling',   dot: true },
    ready:     { variant: 'info',    label: 'Ready',     dot: false },
    paused:    { variant: 'warning', label: 'Paused',    dot: false },
    completed: { variant: 'neutral', label: 'Completed', dot: false },
    draft:     { variant: 'neutral', label: 'Draft',     dot: false },
    screening: { variant: 'info',    label: 'Screening', dot: true },
    screened:  { variant: 'primary', label: 'Screened',  dot: false },
  };
  const config = map[status] ?? { variant: 'neutral' as BadgeVariant, label: status, dot: false };
  return <Badge variant={config.variant} dot={config.dot}>{config.label}</Badge>;
};

export const CandidateStatusBadge: React.FC<{ status: CandidateStatus }> = ({ status }) => {
  const map: Record<CandidateStatus, { variant: BadgeVariant; label: string; dot?: boolean }> = {
    added:                { variant: 'neutral', label: 'Queued',             dot: false },
    calling:              { variant: 'info',    label: 'Calling…',           dot: true },
    contacted:            { variant: 'info',    label: 'Contacted',          dot: false },
    connected:            { variant: 'primary', label: 'Connected',          dot: false },
    interested:           { variant: 'success', label: 'Interested',         dot: true },
    shortlisted:          { variant: 'success', label: 'Shortlisted',        dot: true },
    interview_scheduled:  { variant: 'primary', label: 'Interview Scheduled',dot: true },
    interview_completed:  { variant: 'success', label: 'Interview Done',     dot: false },
    hired:                { variant: 'success', label: 'Hired',              dot: false },
    not_interested:       { variant: 'neutral', label: 'Not Interested',     dot: false },
    no_answer:            { variant: 'warning', label: 'No Answer',          dot: true },
    busy:                 { variant: 'warning', label: 'Line Busy',          dot: false },
    call_failed:          { variant: 'error',   label: 'Call Failed',        dot: false },
  };
  const config = map[status] ?? { variant: 'neutral' as BadgeVariant, label: status, dot: false };
  return <Badge variant={config.variant} dot={config.dot}>{config.label}</Badge>;
};

const style = document.createElement('style');
style.textContent = `
.badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 500;
  line-height: 1.6;
}

.badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.badge--success {
  background: var(--status-success-bg);
  color: var(--status-success-text);
  border: 1px solid var(--status-success-border);
}
.badge--warning {
  background: var(--status-warning-bg);
  color: var(--status-warning-text);
  border: 1px solid var(--status-warning-border);
}
.badge--error {
  background: var(--status-error-bg);
  color: var(--status-error-text);
  border: 1px solid var(--status-error-border);
}
.badge--info {
  background: var(--status-info-bg);
  color: var(--status-info-text);
  border: 1px solid var(--status-info-border);
}
.badge--primary {
  background: var(--brand-primary-light);
  color: var(--brand-primary);
  border: 1px solid #bfdbfe;
}
.badge--neutral {
  background: var(--status-neutral-bg);
  color: var(--status-neutral-text);
  border: 1px solid var(--status-neutral-border);
}
`;
if (typeof document !== 'undefined' && !document.getElementById('badge-styles')) {
  style.id = 'badge-styles';
  document.head.appendChild(style);
}
