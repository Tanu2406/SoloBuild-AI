import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { GlobalSearch } from './GlobalSearch';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [searchOpen, setSearchOpen] = useState(false);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main-wrapper">
        {/* Global top bar */}
        <div className="app-topbar">
          <button
            className="app-topbar__search-btn"
            onClick={() => setSearchOpen(true)}
            aria-label="Open global search"
          >
            <Search size={14} className="app-topbar__search-icon" />
            <span className="app-topbar__search-label">Search candidates, hirings, recruiters…</span>
            <span className="app-topbar__search-kbd">
              <kbd>⌘</kbd><kbd>K</kbd>
            </span>
          </button>
        </div>
        <main className="app-main">
          {children}
        </main>
      </div>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
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
