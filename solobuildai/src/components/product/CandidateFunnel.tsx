import React from 'react';
import type { Hiring } from '../../types';

interface CandidateFunnelProps {
  hiring: Hiring;
}

export const CandidateFunnel: React.FC<CandidateFunnelProps> = ({ hiring }) => {
  const steps = [
    { label: 'Added', value: hiring.candidateCount, color: '#6b7280' },
    { label: 'Contacted', value: hiring.contacted, color: '#2563eb' },
    { label: 'Connected', value: hiring.connected, color: '#0891b2' },
    { label: 'Interested', value: hiring.interested, color: '#059669' },
    { label: 'Shortlisted', value: hiring.shortlisted, color: '#16a34a' },
  ];

  const max = hiring.candidateCount || 1;

  return (
    <div className="funnel">
      {steps.map((step, i) => (
        <div key={step.label} className="funnel__row">
          <div className="funnel__label-wrap">
            <span className="funnel__label">{step.label}</span>
          </div>
          <div className="funnel__bar-wrap">
            <div
              className="funnel__bar"
              style={{
                width: `${(step.value / max) * 100}%`,
                background: step.color,
                opacity: 1 - i * 0.08,
              }}
            />
          </div>
          <span className="funnel__value">{step.value}</span>
        </div>
      ))}
    </div>
  );
};

const style = document.createElement('style');
style.textContent = `
.funnel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.funnel__row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.funnel__label-wrap {
  width: 80px;
  flex-shrink: 0;
}

.funnel__label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.funnel__bar-wrap {
  flex: 1;
  height: 28px;
  background: var(--bg-subtle);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.funnel__bar {
  height: 100%;
  border-radius: var(--radius-sm);
  transition: width 600ms ease;
  min-width: 4px;
}

.funnel__value {
  width: 36px;
  text-align: right;
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
  flex-shrink: 0;
}
`;
if (typeof document !== 'undefined' && !document.getElementById('funnel-styles')) {
  style.id = 'funnel-styles';
  document.head.appendChild(style);
}
