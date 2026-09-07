import React from 'react';

interface ProgressBarProps {
  value: number; // 0-100
  total?: number;
  label?: string;
  size?: 'sm' | 'md';
  color?: string;
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  total,
  label,
  size = 'sm',
  color = 'var(--brand-primary)',
  showPercentage = false,
}) => {
  const pct = Math.min(100, Math.max(0, total ? (value / total) * 100 : value));
  const height = size === 'sm' ? 6 : 8;

  return (
    <div className="progress-wrap">
      {(label || showPercentage) && (
        <div className="progress-header">
          {label && <span className="progress-label">{label}</span>}
          {showPercentage && <span className="progress-pct">{Math.round(pct)}%</span>}
          {total !== undefined && !showPercentage && (
            <span className="progress-pct">{value} / {total}</span>
          )}
        </div>
      )}
      <div
        className="progress-track"
        style={{ height }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemax={total ?? 100}
      >
        <div
          className="progress-fill"
          style={{
            width: `${pct}%`,
            background: color,
            height: '100%',
            borderRadius: 'inherit',
            transition: 'width 600ms ease',
          }}
        />
      </div>
    </div>
  );
};

const style = document.createElement('style');
style.textContent = `
.progress-wrap {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.progress-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.progress-pct {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-weight: 500;
}

.progress-track {
  width: 100%;
  background: var(--bg-subtle);
  border-radius: var(--radius-full);
  overflow: hidden;
}
`;
if (typeof document !== 'undefined' && !document.getElementById('progress-styles')) {
  style.id = 'progress-styles';
  document.head.appendChild(style);
}
