import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state__icon">{icon}</div>}
      <h3 className="empty-state__title">{title}</h3>
      {description && <p className="empty-state__desc">{description}</p>}
      {action && (
        <Button onClick={action.onClick} size="md">
          {action.label}
        </Button>
      )}
    </div>
  );
};

const style = document.createElement('style');
style.textContent = `
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 64px 32px;
  gap: 12px;
}

.empty-state__icon {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-xl);
  background: var(--bg-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  margin-bottom: 4px;
}

.empty-state__title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
}

.empty-state__desc {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  max-width: 360px;
  line-height: 1.6;
}
`;
if (typeof document !== 'undefined' && !document.getElementById('empty-state-styles')) {
  style.id = 'empty-state-styles';
  document.head.appendChild(style);
}
