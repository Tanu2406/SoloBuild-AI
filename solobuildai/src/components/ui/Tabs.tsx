import React from 'react';
import { clsx } from 'clsx';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'default' | 'pills';
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, variant = 'default' }) => {
  return (
    <div className={clsx('tabs', `tabs--${variant}`)} role="tablist">
      {tabs.map(tab => (
        <button
          key={tab.id}
          role="tab"
          aria-selected={activeTab === tab.id}
          className={clsx('tabs__tab', {
            'tabs__tab--active': activeTab === tab.id,
          })}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={clsx('tabs__count', {
              'tabs__count--active': activeTab === tab.id,
            })}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

const style = document.createElement('style');
style.textContent = `
.tabs {
  display: flex;
  align-items: center;
  gap: 0;
  border-bottom: 1px solid var(--border-default);
}

.tabs__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color var(--transition-fast), border-color var(--transition-fast);
  margin-bottom: -1px;
  white-space: nowrap;
}

.tabs__tab:hover {
  color: var(--text-primary);
}

.tabs__tab--active {
  color: var(--brand-primary);
  border-bottom-color: var(--brand-primary);
}

.tabs__count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  background: var(--bg-subtle);
  color: var(--text-secondary);
}

.tabs__count--active {
  background: var(--brand-primary-light);
  color: var(--brand-primary);
}

/* Pills variant */
.tabs--pills {
  border-bottom: none;
  gap: 4px;
  padding: 4px;
  background: var(--bg-subtle);
  border-radius: var(--radius-md);
  width: fit-content;
}

.tabs--pills .tabs__tab {
  border-radius: var(--radius-sm);
  border-bottom: none;
  margin-bottom: 0;
  padding: 6px 14px;
}

.tabs--pills .tabs__tab--active {
  background: var(--bg-white);
  color: var(--text-primary);
  box-shadow: var(--shadow-xs);
}
`;
if (typeof document !== 'undefined' && !document.getElementById('tabs-styles')) {
  style.id = 'tabs-styles';
  document.head.appendChild(style);
}
