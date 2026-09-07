import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive: boolean };
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, icon, trend }) => {
  return (
    <div className="stat-card">
      <div className="stat-card__header">
        <span className="stat-card__label">{label}</span>
        {icon && <span className="stat-card__icon">{icon}</span>}
      </div>
      <div className="stat-card__value">{value}</div>
      {sub && <div className="stat-card__sub">{sub}</div>}
      {trend && (
        <div className={`stat-card__trend ${trend.positive ? 'stat-card__trend--up' : 'stat-card__trend--down'}`}>
          {trend.positive ? '↑' : '↓'} {trend.value}
        </div>
      )}
    </div>
  );
};

const style = document.createElement('style');
style.textContent = `
.stat-card {
  background: var(--bg-white);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-card__label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-card__icon {
  color: var(--text-tertiary);
}

.stat-card__value {
  font-size: var(--font-size-4xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.1;
  letter-spacing: -0.5px;
}

.stat-card__sub {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.stat-card__trend {
  font-size: var(--font-size-xs);
  font-weight: 500;
  margin-top: 2px;
}
.stat-card__trend--up { color: var(--status-success-text); }
.stat-card__trend--down { color: var(--status-error-text); }
`;
if (typeof document !== 'undefined' && !document.getElementById('stat-card-styles')) {
  style.id = 'stat-card-styles';
  document.head.appendChild(style);
}
