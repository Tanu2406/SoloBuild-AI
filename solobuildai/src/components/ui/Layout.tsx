import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
};

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, actions }) => {
  return (
    <div className="page-header">
      <div className="page-header__text">
        <h1 className="page-header__title">{title}</h1>
        {subtitle && <p className="page-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="page-header__actions">{actions}</div>}
    </div>
  );
};

const style = document.createElement('style');
style.textContent = `
.app-shell {
  display: flex;
  min-height: 100vh;
  background: var(--bg-app);
}

.app-main {
  flex: 1;
  min-width: 0;
  overflow-x: hidden;
}

.page-content {
  padding: 32px var(--content-padding);
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
  flex-wrap: wrap;
}

.page-header__text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-header__title {
  font-size: var(--font-size-4xl);
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.5px;
  line-height: 1.1;
}

.page-header__subtitle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  line-height: 1.5;
}

.page-header__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .page-content {
    padding: 20px 16px;
  }
}
`;
if (typeof document !== 'undefined' && !document.getElementById('layout-styles')) {
  style.id = 'layout-styles';
  document.head.appendChild(style);
}
