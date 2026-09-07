import React from 'react';
import { MapPin, Users, ChevronRight } from 'lucide-react';
import type { Hiring } from '../../types';
import { HiringStatusBadge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';

interface HiringCardProps {
  hiring: Hiring;
  onClick?: () => void;
}

const employmentLabels: Record<string, string> = {
  full_time: 'Full-time',
  part_time: 'Part-time',
  contract: 'Contract',
  internship: 'Internship',
};

export const HiringCard: React.FC<HiringCardProps> = ({ hiring, onClick }) => {
  return (
    <div className="hiring-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={e => e.key === 'Enter' && onClick?.()}>
      <div className="hiring-card__main">
        <div className="hiring-card__top">
          <div className="hiring-card__info">
            <div className="hiring-card__title-row">
              <h3 className="hiring-card__title">{hiring.title}</h3>
              <HiringStatusBadge status={hiring.status} />
            </div>
            <div className="hiring-card__meta">
              <span className="hiring-card__meta-item">
                <MapPin size={13} />
                {hiring.location}
              </span>
              <span className="hiring-card__meta-sep">·</span>
              <span className="hiring-card__meta-item">
                {employmentLabels[hiring.employmentType]}
              </span>
            </div>
          </div>
          <div className="hiring-card__arrow">
            <ChevronRight size={18} strokeWidth={1.5} />
          </div>
        </div>

        <div className="hiring-card__stats">
          <div className="hiring-card__stat">
            <span className="hiring-card__stat-value">{hiring.candidateCount}</span>
            <span className="hiring-card__stat-label">Total</span>
          </div>
          <div className="hiring-card__stat-divider" />
          <div className="hiring-card__stat">
            <span className="hiring-card__stat-value">{hiring.contacted}</span>
            <span className="hiring-card__stat-label">Contacted</span>
          </div>
          <div className="hiring-card__stat-divider" />
          <div className="hiring-card__stat">
            <span className="hiring-card__stat-value">{hiring.connected}</span>
            <span className="hiring-card__stat-label">Connected</span>
          </div>
          <div className="hiring-card__stat-divider" />
          <div className="hiring-card__stat">
            <span className="hiring-card__stat-value">{hiring.interested}</span>
            <span className="hiring-card__stat-label">Interested</span>
          </div>
          <div className="hiring-card__stat-divider" />
          <div className="hiring-card__stat">
            <span className="hiring-card__stat-value hiring-card__stat-value--accent">{hiring.shortlisted}</span>
            <span className="hiring-card__stat-label">Shortlisted</span>
          </div>
        </div>

        {hiring.status !== 'draft' && (
          <div className="hiring-card__progress">
            <ProgressBar value={hiring.contacted} total={hiring.candidateCount} />
            <span className="hiring-card__progress-label">
              {hiring.contacted} of {hiring.candidateCount} contacted
            </span>
          </div>
        )}
      </div>

      <div className="hiring-card__footer">
        <span className="hiring-card__updated">
          Updated {new Date(hiring.updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </span>
        {hiring.status === 'draft' && (
          <span className="hiring-card__footer-action">
            <Users size={12} /> {hiring.candidateCount} candidates ready
          </span>
        )}
      </div>
    </div>
  );
};

const style = document.createElement('style');
style.textContent = `
.hiring-card {
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  cursor: pointer;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hiring-card:hover {
  border-color: var(--brand-primary);
  box-shadow: var(--shadow-sm);
}

.hiring-card__main {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hiring-card__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.hiring-card__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hiring-card__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.hiring-card__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.hiring-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.hiring-card__meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.hiring-card__meta-sep {
  color: var(--text-tertiary);
}

.hiring-card__arrow {
  color: var(--text-tertiary);
  flex-shrink: 0;
  margin-top: 2px;
}

.hiring-card__stats {
  display: flex;
  align-items: center;
  gap: 0;
}

.hiring-card__stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 0 8px;
}
.hiring-card__stat:first-child { padding-left: 0; }
.hiring-card__stat:last-child { padding-right: 0; }

.hiring-card__stat-divider {
  width: 1px;
  height: 28px;
  background: var(--border-default);
  flex-shrink: 0;
}

.hiring-card__stat-value {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.hiring-card__stat-value--accent {
  color: var(--brand-primary);
}

.hiring-card__stat-label {
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 500;
  text-align: center;
}

.hiring-card__progress {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hiring-card__progress-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.hiring-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--border-default);
}

.hiring-card__updated {
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.hiring-card__footer-action {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 4px;
}
`;
if (typeof document !== 'undefined' && !document.getElementById('hiring-card-styles')) {
  style.id = 'hiring-card-styles';
  document.head.appendChild(style);
}
